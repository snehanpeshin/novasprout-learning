import SwiftUI

struct QuizView: View {
    let exam: TimedExam
    let onComplete: (Int) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var selections: [String: Int] = [:]
    @State private var remainingSeconds: Int
    @State private var submitted = false
    @State private var score = 0

    private let tick = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    init(exam: TimedExam, onComplete: @escaping (Int) -> Void) {
        self.exam = exam
        self.onComplete = onComplete
        _remainingSeconds = State(initialValue: max(1, exam.durationMinutes) * 60)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    HStack {
                        Label(formattedTime(remainingSeconds), systemImage: "timer")
                            .font(.headline.monospacedDigit())
                            .foregroundStyle(remainingSeconds < 60 ? NovaPalette.coral : NovaPalette.navy)
                        Spacer()
                        Text("Pass: \(exam.passingScore)%")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(NovaPalette.muted)
                    }

                    if submitted {
                        scoreSummary
                    }

                    ForEach(Array(exam.questions.enumerated()), id: \.element.id) { index, question in
                        questionView(index: index, question: question)
                    }

                    if submitted {
                        Button("Done") { dismiss() }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                            .frame(maxWidth: .infinity)
                    } else {
                        Button("Submit Quiz") { submit() }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                            .frame(maxWidth: .infinity)
                            .disabled(selections.count < exam.questions.count)
                    }
                }
                .frame(maxWidth: 720)
                .padding(20)
                .frame(maxWidth: .infinity)
            }
            .background(NovaPalette.background.ignoresSafeArea())
            .navigationTitle("Quick Quiz")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
            .onReceive(tick) { _ in
                guard !submitted else { return }
                if remainingSeconds > 0 {
                    remainingSeconds -= 1
                } else {
                    submit()
                }
            }
        }
    }

    private var scoreSummary: some View {
        HStack(spacing: 14) {
            Image(systemName: score >= exam.passingScore ? "checkmark.seal.fill" : "arrow.clockwise.circle.fill")
                .font(.largeTitle)
                .foregroundStyle(score >= exam.passingScore ? NovaPalette.teal : NovaPalette.coral)
            VStack(alignment: .leading, spacing: 3) {
                Text("Your score: \(score)%")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(NovaPalette.navy)
                Text(score >= exam.passingScore ? "Nice work. You passed." : "Review the explanations and try again later.")
                    .font(.subheadline)
                    .foregroundStyle(NovaPalette.muted)
            }
        }
        .novaCard()
    }

    private func questionView(index: Int, question: ExamQuestion) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("\(index + 1). \(question.question)")
                .font(.headline)
                .foregroundStyle(NovaPalette.navy)

            ForEach(Array(question.options.enumerated()), id: \.offset) { optionIndex, option in
                Button {
                    guard !submitted else { return }
                    selections[question.id] = optionIndex
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: optionSymbol(question: question, option: optionIndex))
                            .foregroundStyle(optionColor(question: question, option: optionIndex))
                        Text(option)
                            .foregroundStyle(NovaPalette.navy)
                            .multilineTextAlignment(.leading)
                        Spacer()
                    }
                    .padding(12)
                    .background(optionBackground(question: question, option: optionIndex))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            if submitted {
                Label(question.explanation, systemImage: "lightbulb.fill")
                    .font(.footnote)
                    .foregroundStyle(NovaPalette.muted)
            }
        }
        .novaCard()
    }

    private func optionSymbol(question: ExamQuestion, option: Int) -> String {
        guard submitted else {
            return selections[question.id] == option ? "largecircle.fill.circle" : "circle"
        }
        if option == question.answerIndex { return "checkmark.circle.fill" }
        if selections[question.id] == option { return "xmark.circle.fill" }
        return "circle"
    }

    private func optionColor(question: ExamQuestion, option: Int) -> Color {
        guard submitted else { return selections[question.id] == option ? NovaPalette.blue : NovaPalette.muted }
        if option == question.answerIndex { return NovaPalette.teal }
        if selections[question.id] == option { return NovaPalette.coral }
        return NovaPalette.muted
    }

    private func optionBackground(question: ExamQuestion, option: Int) -> Color {
        if submitted && option == question.answerIndex { return NovaPalette.teal.opacity(0.10) }
        if submitted && selections[question.id] == option { return NovaPalette.coral.opacity(0.10) }
        if selections[question.id] == option { return NovaPalette.blue.opacity(0.10) }
        return Color(uiColor: .secondarySystemBackground)
    }

    private func submit() {
        guard !submitted else { return }
        let correct = exam.questions.filter { selections[$0.id] == $0.answerIndex }.count
        score = exam.questions.isEmpty ? 0 : Int((Double(correct) / Double(exam.questions.count) * 100).rounded())
        submitted = true
        onComplete(score)
    }

    private func formattedTime(_ seconds: Int) -> String {
        String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
}
