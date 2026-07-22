import Foundation

@MainActor
final class LessonGeneratorViewModel: ObservableObject {
    @Published var request = LessonRequest()
    @Published private(set) var lesson: GeneratedLesson?
    @Published private(set) var context: LessonContext?
    @Published private(set) var stage: GenerationStage?
    @Published private(set) var isGenerating = false
    @Published private(set) var isBuildingDeck = false
    @Published var errorMessage = ""
    @Published var showOverview = false
    @Published var playerConfiguration: LessonPlayerConfiguration?

    func generate(access: AIRequestAccess) async -> Bool {
        if let validationError = CurriculumTopicValidator.error(
            topic: request.topic,
            subject: request.subject,
            grade: request.grade,
            studentQuestion: request.studentQuestion
        ) {
            errorMessage = validationError
            return false
        }
        guard !access.isEmpty else {
            errorMessage = "Choose one AI lesson, subscribe, add beta access, or open the free sample."
            return false
        }

        errorMessage = ""
        isGenerating = true
        stage = .lesson
        let lessonContext = LessonContext(grade: request.grade, subject: request.subject, topic: request.topic)
        do {
            let generated = try await APIClient.shared.generateLesson(
                request: request,
                access: access
            ) { [self] nextStage in
                await updateStage(nextStage)
            }
            lesson = generated
            context = lessonContext
            showOverview = true
            isGenerating = false
            return true
        } catch {
            errorMessage = error.localizedDescription
        }
        isGenerating = false
        return false
    }

    func buildPrivateLesson(access: AIRequestAccess, history: LessonHistoryStore) async {
        guard let lesson, let context else { return }
        errorMessage = ""
        isBuildingDeck = true
        do {
            let result = try await APIClient.shared.buildDeck(
                lesson: lesson,
                context: context,
                access: access
            ) { [self] nextStage in
                await updateStage(nextStage)
            }
            let summary = result.deck.summary
            let saved = history.save(
                context: context,
                lesson: lesson,
                pdfData: result.pdfData,
                deckSummary: summary
            )
            playerConfiguration = LessonPlayerConfiguration(
                context: context,
                lesson: lesson,
                pdfData: result.pdfData,
                savedLessonID: saved.id,
                deckSummary: summary
            )
        } catch {
            errorMessage = error.localizedDescription
        }
        isBuildingDeck = false
    }

    func openSample() {
        playerConfiguration = LessonPlayerConfiguration(
            context: SampleData.context,
            lesson: SampleData.lesson,
            pdfData: nil,
            savedLessonID: nil,
            deckSummary: nil
        )
    }

    func reset() {
        lesson = nil
        context = nil
        stage = nil
        errorMessage = ""
        showOverview = false
        playerConfiguration = nil
    }

    private func updateStage(_ nextStage: GenerationStage) {
        stage = nextStage
    }
}

struct LessonPlayerConfiguration: Identifiable {
    let id = UUID()
    let context: LessonContext
    let lesson: GeneratedLesson
    let pdfData: Data?
    let savedLessonID: UUID?
    let deckSummary: DeckSummary?
}
