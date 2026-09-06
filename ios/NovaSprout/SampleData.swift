import Foundation

enum SampleData {
    static let context = LessonContext(
        grade: "Grades 6-8",
        subject: "Mathematics",
        topic: "Ratios and proportions"
    )

    static let lesson: GeneratedLesson = loadLesson()

    static var pdfData: Data? {
        guard let url = Bundle.main.url(
            forResource: "NovaSprout-Ratios-Sample",
            withExtension: "pdf"
        ) else { return nil }
        return try? Data(contentsOf: url)
    }

    static let deckSummary = DeckSummary(
        pageCount: 36,
        generatedImageCount: 0,
        qualityWarnings: []
    )

    private static func loadLesson() -> GeneratedLesson {
        guard let url = Bundle.main.url(
            forResource: "NovaSprout-Ratios-Sample",
            withExtension: "json"
        ),
        let data = try? Data(contentsOf: url),
        let lesson = try? JSONDecoder().decode(GeneratedLesson.self, from: data)
        else {
            fatalError("The bundled NovaSprout sample lesson is missing or invalid.")
        }

        return lesson
    }
}
