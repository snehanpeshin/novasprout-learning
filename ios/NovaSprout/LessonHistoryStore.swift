import Foundation

@MainActor
final class LessonHistoryStore: ObservableObject {
    @Published private(set) var lessons: [SavedLesson] = []

    private let defaultsKey = "novasprout.saved-lessons.v1"
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init() {
        encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        load()
    }

    @discardableResult
    func save(context: LessonContext, lesson: GeneratedLesson, pdfData: Data?) -> SavedLesson {
        let id = UUID()
        let fileName = pdfData == nil ? nil : "\(id.uuidString).pdf"
        if let pdfData, let fileName {
            try? pdfData.write(to: lessonsDirectory.appendingPathComponent(fileName), options: .atomic)
        }
        let saved = SavedLesson(
            id: id,
            context: context,
            createdAt: Date(),
            lesson: lesson,
            lastScore: nil,
            pdfFileName: fileName
        )
        lessons.insert(saved, at: 0)
        persist()
        return saved
    }

    func pdfData(for lesson: SavedLesson) -> Data? {
        guard let fileName = lesson.pdfFileName else { return nil }
        return try? Data(contentsOf: lessonsDirectory.appendingPathComponent(fileName))
    }

    func recordScore(for id: UUID, percent: Int) {
        guard let index = lessons.firstIndex(where: { $0.id == id }) else { return }
        lessons[index].lastScore = percent
        persist()
    }

    func delete(at offsets: IndexSet) {
        for index in offsets {
            if let fileName = lessons[index].pdfFileName {
                try? FileManager.default.removeItem(at: lessonsDirectory.appendingPathComponent(fileName))
            }
        }
        lessons.remove(atOffsets: offsets)
        persist()
    }

    func clear() {
        for lesson in lessons {
            if let fileName = lesson.pdfFileName {
                try? FileManager.default.removeItem(at: lessonsDirectory.appendingPathComponent(fileName))
            }
        }
        lessons = []
        persist()
    }

    private var lessonsDirectory: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let directory = base.appendingPathComponent("NovaSprout/Lessons", isDirectory: true)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: defaultsKey),
              let decoded = try? decoder.decode([SavedLesson].self, from: data) else {
            lessons = []
            return
        }
        lessons = decoded.sorted { $0.createdAt > $1.createdAt }
    }

    private func persist() {
        guard let data = try? encoder.encode(lessons) else { return }
        UserDefaults.standard.set(data, forKey: defaultsKey)
    }
}
