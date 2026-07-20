import SwiftUI

struct LessonPage: Identifiable {
    let id = UUID()
    let title: String
    let body: String
    let symbol: String
    let color: Color
}

struct LessonPlayerView: View {
    let configuration: LessonPlayerConfiguration
    @EnvironmentObject private var history: LessonHistoryStore
    @Environment(\.dismiss) private var dismiss
    @State private var elapsedSeconds = 0
    @State private var isRunning = true
    @State private var showQuiz = false
    @State private var shareURL: URL?
    @State private var samplePage = 0

    private let tick = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var totalSeconds: Int { configuration.lesson.lessonMinutes * 60 }
    private var halfwaySeconds: Int { max(1, totalSeconds / 2) }
    private var quizUnlocked: Bool { elapsedSeconds >= halfwaySeconds || elapsedSeconds >= totalSeconds }
    private var remainingSeconds: Int { max(0, totalSeconds - elapsedSeconds) }
    private var progress: Double { min(1, Double(elapsedSeconds) / Double(max(1, totalSeconds))) }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ProgressView(value: progress)
                    .tint(quizUnlocked ? NovaPalette.teal : NovaPalette.blue)

                if let pdfData = configuration.pdfData {
                    PDFKitView(data: pdfData)
                        .background(NovaPalette.navy)
                } else {
                    sampleDeck
                }

                controls
            }
            .background(NovaPalette.background)
            .navigationTitle(configuration.lesson.displayTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                    }
                    .accessibilityLabel("Close lesson")
                }
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        isRunning.toggle()
                    } label: {
                        Image(systemName: isRunning ? "pause.fill" : "play.fill")
                    }
                    .accessibilityLabel(isRunning ? "Pause timer" : "Resume timer")

                    if let shareURL {
                        ShareLink(item: shareURL) {
                            Image(systemName: "square.and.arrow.up")
                        }
                        .accessibilityLabel("Share lesson PDF")
                    }
                }
            }
            .onReceive(tick) { _ in
                guard isRunning, elapsedSeconds < totalSeconds else { return }
                elapsedSeconds += 1
                if elapsedSeconds >= totalSeconds { isRunning = false }
            }
            .onAppear { prepareShareFile() }
            .sheet(isPresented: $showQuiz) {
                if let exam = configuration.lesson.timedExam, !exam.questions.isEmpty {
                    QuizView(exam: exam) { score in
                        if let id = configuration.savedLessonID {
                            history.recordScore(for: id, percent: score)
                        }
                    }
                } else {
                    NoQuizView()
                }
            }
            .persistentSystemOverlays(.hidden)
        }
    }

    private var controls: some View {
        VStack(spacing: 9) {
            HStack {
                Label(formattedTime(remainingSeconds), systemImage: "timer")
                    .font(.subheadline.monospacedDigit().weight(.semibold))
                    .foregroundStyle(NovaPalette.navy)
                Spacer()
                Button {
                    showQuiz = true
                } label: {
                    Label("Start Quiz", systemImage: quizUnlocked ? "checkmark.seal.fill" : "lock.fill")
                }
                .buttonStyle(.borderedProminent)
                .disabled(!quizUnlocked)
            }
            Text(quizUnlocked ? "Quiz ready. Complete it when you are ready." : "The quiz unlocks halfway through this \(configuration.lesson.lessonMinutes)-minute lesson.")
                .font(.caption)
                .foregroundStyle(NovaPalette.muted)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.regularMaterial)
    }

    private var sampleDeck: some View {
        TabView(selection: $samplePage) {
            ForEach(Array(samplePages.enumerated()), id: \.element.id) { index, page in
                VStack(alignment: .leading, spacing: 24) {
                    Image(systemName: page.symbol)
                        .font(.system(size: 42, weight: .semibold))
                        .foregroundStyle(page.color)
                    Text(page.title)
                        .font(.largeTitle.weight(.bold))
                        .foregroundStyle(NovaPalette.navy)
                    Text(page.body)
                        .font(.title3)
                        .foregroundStyle(NovaPalette.navy)
                        .lineSpacing(6)
                    Spacer()
                    Text("\(index + 1) of \(samplePages.count)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(NovaPalette.muted)
                }
                .padding(28)
                .frame(maxWidth: 760, maxHeight: .infinity, alignment: .leading)
                .background(Color(uiColor: .systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                .padding(18)
                .tag(index)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .always))
        .background(NovaPalette.background)
    }

    private var samplePages: [LessonPage] {
        var pages = [
            LessonPage(title: configuration.lesson.displayTitle, body: configuration.lesson.studentFit ?? configuration.context.topic, symbol: "sparkles", color: NovaPalette.yellow),
            LessonPage(title: "Warm-up", body: configuration.lesson.warmUp ?? "Think about what you already know.", symbol: "brain.head.profile", color: NovaPalette.coral),
            LessonPage(title: "Main idea", body: configuration.lesson.conceptExplanation ?? "Explore the main concept.", symbol: "lightbulb.fill", color: NovaPalette.blue),
            LessonPage(title: "Worked example", body: configuration.lesson.guidedExample ?? "Work through an example step by step.", symbol: "pencil.and.ruler.fill", color: NovaPalette.teal)
        ]
        pages += (configuration.lesson.fullLessonSegments ?? []).map {
            LessonPage(title: $0.title, body: $0.activity, symbol: "rectangle.on.rectangle.angled", color: NovaPalette.blue)
        }
        if let questions = configuration.lesson.practiceQuestions, !questions.isEmpty {
            pages.append(LessonPage(title: "Practice", body: questions.joined(separator: "\n\n"), symbol: "checklist", color: NovaPalette.coral))
        }
        pages.append(LessonPage(title: "What comes next", body: configuration.lesson.recommendedNextSession ?? "Review your answers and keep practicing.", symbol: "arrow.right.circle.fill", color: NovaPalette.teal))
        return pages
    }

    private func formattedTime(_ seconds: Int) -> String {
        String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }

    private func prepareShareFile() {
        guard let data = configuration.pdfData else { return }
        let safeName = configuration.lesson.displayTitle
            .lowercased()
            .replacingOccurrences(of: "[^a-z0-9]+", with: "-", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(safeName.isEmpty ? "novasprout-lesson" : safeName).pdf")
        try? data.write(to: url, options: .atomic)
        shareURL = url
    }
}

private struct NoQuizView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ContentUnavailableView {
            Label("Quiz unavailable", systemImage: "questionmark.circle")
        } description: {
            Text("This lesson does not include a scored quiz.")
        } actions: {
            Button("Done") { dismiss() }
        }
    }
}
