import Foundation

enum NovaAPIError: LocalizedError {
    case invalidResponse
    case message(String)
    case serverError(status: Int, message: String)
    case network(String)
    case timedOut

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            "NovaSprout returned an unreadable response."
        case .message(let message):
            message
        case .serverError(_, let message):
            message
        case .network(let message):
            message
        case .timedOut:
            "NovaSprout is still processing this lesson. Please try again shortly."
        }
    }

    var isRetryable: Bool {
        if case .serverError(let status, _) = self {
            return [408, 429, 500, 502, 503, 504].contains(status)
        }
        if case .network = self {
            return true
        }
        return false
    }
}

struct APIErrorEnvelope: Codable {
    let error: String?
}

actor APIClient {
    static let shared = APIClient()

    private let baseURL = URL(string: "https://www.novasproutlearning.com")!
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    func generateLesson(
        request lessonRequest: LessonRequest,
        accessCode: String,
        progress: @escaping @Sendable (GenerationStage) async -> Void
    ) async throws -> GeneratedLesson {
        await progress(.lesson)
        let start: LessonStartResponse = try await postWithRetry(
            path: "/api/ai-lesson",
            body: lessonRequest,
            accessCode: accessCode,
            timeout: 40,
            retries: 2
        )
        if let error = start.error { throw NovaAPIError.message(error) }
        if let lesson = start.lesson { return lesson }
        guard let responseId = start.responseId else {
            throw NovaAPIError.message("The AI service did not start a lesson.")
        }

        let deadline = Date().addingTimeInterval(300)
        while Date() < deadline {
            try await Task.sleep(for: .seconds(2.5))
            let status: LessonStartResponse = try await getWithRetry(
                path: "/api/ai-lesson/status?responseId=\(responseId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? responseId)",
                accessCode: accessCode,
                timeout: 20,
                retries: 3
            )
            if let error = status.error { throw NovaAPIError.message(error) }
            if let lesson = status.lesson { return lesson }
            if let value = status.status, !["queued", "in_progress"].contains(value) {
                throw NovaAPIError.message("Lesson generation ended with status: \(value).")
            }
        }
        throw NovaAPIError.timedOut
    }

    func buildDeck(
        lesson: GeneratedLesson,
        context: LessonContext,
        accessCode: String,
        progress: @escaping @Sendable (GenerationStage) async -> Void
    ) async throws -> (deck: CompiledDeck, pdfData: Data) {
        await progress(.visualPlan)
        let planBody = AssetPlanRequest(context: context, lesson: lesson)
        let plan: AssetPlanResponse = try await postWithRetry(
            path: "/api/ai-slide-assets",
            body: planBody,
            accessCode: accessCode,
            timeout: 300,
            retries: 2
        )
        if let error = plan.error { throw NovaAPIError.message(error) }

        let allAssets = plan.assets ?? []
        let selectedImages = Array(allAssets.filter { $0.type == "image" }.prefix(1))
        let selectedAssets = allAssets.filter { $0.type == "latex" } + selectedImages
        var compiledAssets = selectedAssets

        if !selectedImages.isEmpty {
            await progress(.images)
            let images: ImageGenerationResponse = try await postWithRetry(
                path: "/api/ai-slide-images",
                body: ImageRequest(assets: selectedImages),
                accessCode: accessCode,
                timeout: 300,
                retries: 1
            )
            if let error = images.error { throw NovaAPIError.message(error) }
            let generatedImages = images.images ?? []
            compiledAssets = selectedAssets.map { asset in
                generatedImages.first(where: {
                    ($0.assetId != nil && $0.assetId == asset.assetId) ||
                    ($0.placement == asset.placement && $0.prompt == asset.prompt)
                }) ?? asset
            }
        }

        await progress(.compilation)
        let deck: CompiledDeck = try await postWithRetry(
            path: "/api/ai-lesson-deck",
            body: DeckRequest(assets: compiledAssets, context: context, lesson: lesson),
            accessCode: accessCode,
            timeout: 300,
            retries: 2
        )
        if let error = deck.error { throw NovaAPIError.message(error) }
        guard deck.compilerStatus == "compiled" else {
            throw NovaAPIError.message("The lesson PDF did not compile successfully.")
        }

        await progress(.quality)
        guard (deck.pageCount ?? 0) >= 3 else {
            throw NovaAPIError.message("The compiled lesson has fewer pages than expected.")
        }
        let data = try await loadPDF(from: deck)
        guard data.count > 1_000 else {
            throw NovaAPIError.message("The compiled lesson PDF is unexpectedly small.")
        }
        await progress(.ready)
        return (deck, data)
    }

    private func loadPDF(from deck: CompiledDeck) async throws -> Data {
        if let urlString = deck.pdfUrl, let url = URL(string: urlString) {
            for attempt in 0...2 {
                do {
                    let (data, response) = try await URLSession.shared.data(from: url)
                    guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                        throw NovaAPIError.message("The compiled PDF could not be downloaded.")
                    }
                    return data
                } catch where attempt < 2 {
                    try await Task.sleep(for: .seconds(attempt + 1))
                }
            }
            throw NovaAPIError.message("The compiled PDF could not be downloaded.")
        }
        if let dataURL = deck.pdfDataUrl,
           let comma = dataURL.firstIndex(of: ","),
           let data = Data(base64Encoded: String(dataURL[dataURL.index(after: comma)...])) {
            return data
        }
        throw NovaAPIError.message("The compiler did not return a PDF.")
    }

    private func get<Response: Decodable>(
        path: String,
        accessCode: String,
        timeout: TimeInterval
    ) async throws -> Response {
        var request = URLRequest(url: endpoint(path))
        request.httpMethod = "GET"
        request.timeoutInterval = timeout
        request.setValue(accessCode, forHTTPHeaderField: "x-ai-access-token")
        return try await send(request)
    }

    private func getWithRetry<Response: Decodable>(
        path: String,
        accessCode: String,
        timeout: TimeInterval,
        retries: Int
    ) async throws -> Response {
        var attempt = 0
        while true {
            do {
                return try await get(path: path, accessCode: accessCode, timeout: timeout)
            } catch let error as NovaAPIError where error.isRetryable && attempt < retries {
                attempt += 1
                try await Task.sleep(for: .seconds(min(8, attempt * 2)))
            }
        }
    }

    private func postWithRetry<Body: Encodable, Response: Decodable>(
        path: String,
        body: Body,
        accessCode: String,
        timeout: TimeInterval,
        retries: Int
    ) async throws -> Response {
        var attempt = 0
        while true {
            do {
                return try await post(path: path, body: body, accessCode: accessCode, timeout: timeout)
            } catch let error as NovaAPIError where error.isRetryable && attempt < retries {
                attempt += 1
                try await Task.sleep(for: .seconds(min(8, attempt * 2)))
            }
        }
    }

    private func post<Body: Encodable, Response: Decodable>(
        path: String,
        body: Body,
        accessCode: String,
        timeout: TimeInterval
    ) async throws -> Response {
        var request = URLRequest(url: endpoint(path))
        request.httpMethod = "POST"
        request.timeoutInterval = timeout
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(accessCode, forHTTPHeaderField: "x-ai-access-token")
        request.httpBody = try encoder.encode(body)
        return try await send(request)
    }

    private func send<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch let error as URLError {
            let message = error.code == .timedOut
                ? "The NovaSprout service took longer than expected. Retrying may help."
                : "Could not reach NovaSprout. Check your internet connection and try again."
            throw NovaAPIError.network(message)
        }
        guard let http = response as? HTTPURLResponse else { throw NovaAPIError.invalidResponse }
        if !(200...299).contains(http.statusCode) {
            let envelope = try? decoder.decode(APIErrorEnvelope.self, from: data)
            throw NovaAPIError.serverError(
                status: http.statusCode,
                message: envelope?.error ?? "NovaSprout returned error \(http.statusCode)."
            )
        }
        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw NovaAPIError.invalidResponse
        }
    }

    private func endpoint(_ path: String) -> URL {
        URL(string: path, relativeTo: baseURL)!.absoluteURL
    }
}

private struct AssetPlanRequest: Codable {
    let context: LessonContext
    let lesson: GeneratedLesson
}

private struct ImageRequest: Codable {
    let assets: [DeckAsset]
}

private struct DeckRequest: Codable {
    let assets: [DeckAsset]
    let context: LessonContext
    let lesson: GeneratedLesson
}
