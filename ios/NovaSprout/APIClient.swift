import Foundation

enum NovaAPIError: LocalizedError {
    case invalidResponse
    case message(String)
    case timedOut

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            "NovaSprout returned an unreadable response."
        case .message(let message):
            message
        case .timedOut:
            "The lesson is still processing after five minutes. Please try again shortly."
        }
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
        let start: LessonStartResponse = try await post(
            path: "/api/ai-lesson",
            body: lessonRequest,
            accessCode: accessCode,
            timeout: 40
        )
        if let error = start.error { throw NovaAPIError.message(error) }
        if let lesson = start.lesson { return lesson }
        guard let responseId = start.responseId else {
            throw NovaAPIError.message("The AI service did not start a lesson.")
        }

        let deadline = Date().addingTimeInterval(300)
        while Date() < deadline {
            try await Task.sleep(for: .seconds(2.5))
            let status: LessonStartResponse = try await get(
                path: "/api/ai-lesson/status?responseId=\(responseId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? responseId)",
                accessCode: accessCode,
                timeout: 20
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
        let plan: AssetPlanResponse = try await post(
            path: "/api/ai-slide-assets",
            body: planBody,
            accessCode: accessCode,
            timeout: 300
        )
        if let error = plan.error { throw NovaAPIError.message(error) }

        let allAssets = plan.assets ?? []
        let selectedImages = Array(allAssets.filter { $0.type == "image" }.prefix(1))
        let selectedAssets = allAssets.filter { $0.type == "latex" } + selectedImages
        var compiledAssets = selectedAssets

        if !selectedImages.isEmpty {
            await progress(.images)
            let images: ImageGenerationResponse = try await post(
                path: "/api/ai-slide-images",
                body: ImageRequest(assets: selectedImages),
                accessCode: accessCode,
                timeout: 300
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
        let deck: CompiledDeck = try await post(
            path: "/api/ai-lesson-deck",
            body: DeckRequest(assets: compiledAssets, context: context, lesson: lesson),
            accessCode: accessCode,
            timeout: 300
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
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                throw NovaAPIError.message("The compiled PDF could not be downloaded.")
            }
            return data
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
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NovaAPIError.invalidResponse }
        if !(200...299).contains(http.statusCode) {
            let envelope = try? decoder.decode(APIErrorEnvelope.self, from: data)
            throw NovaAPIError.message(envelope?.error ?? "NovaSprout returned error \(http.statusCode).")
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
