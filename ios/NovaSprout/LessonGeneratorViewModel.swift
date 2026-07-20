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

    func generate(accessCode: String) async {
        guard !request.topic.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Enter a lesson topic."
            return
        }
        guard !accessCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Add the NovaSprout beta access code in Settings, or open the free sample lesson."
            return
        }

        errorMessage = ""
        isGenerating = true
        stage = .lesson
        let lessonContext = LessonContext(grade: request.grade, subject: request.subject, topic: request.topic)
        do {
            let generated = try await APIClient.shared.generateLesson(
                request: request,
                accessCode: accessCode
            ) { [self] nextStage in
                await updateStage(nextStage)
            }
            lesson = generated
            context = lessonContext
            showOverview = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isGenerating = false
    }

    func buildPrivateLesson(accessCode: String, history: LessonHistoryStore) async {
        guard let lesson, let context else { return }
        errorMessage = ""
        isBuildingDeck = true
        do {
            let result = try await APIClient.shared.buildDeck(
                lesson: lesson,
                context: context,
                accessCode: accessCode
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
