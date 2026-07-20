import SwiftUI

struct LessonOverviewView: View {
    @ObservedObject var viewModel: LessonGeneratorViewModel
    @EnvironmentObject private var settings: AppSettings
    @EnvironmentObject private var history: LessonHistoryStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                if let lesson = viewModel.lesson, let context = viewModel.context {
                    VStack(alignment: .leading, spacing: 20) {
                        HStack(spacing: 12) {
                            SubjectMark(subject: context.subject)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(lesson.displayTitle)
                                    .font(.title2.weight(.bold))
                                    .foregroundStyle(NovaPalette.navy)
                                Text("\(context.grade) | \(context.subject) | \(lesson.duration ?? "Lesson")")
                                    .font(.subheadline)
                                    .foregroundStyle(NovaPalette.muted)
                            }
                        }

                        lessonSection("You will learn", items: lesson.learningObjectives ?? [])
                        textSection("Warm-up", text: lesson.warmUp)
                        textSection("Main idea", text: lesson.conceptExplanation)
                        textSection("Worked example", text: lesson.guidedExample)

                        if let segments = lesson.fullLessonSegments, !segments.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                SectionLabel(text: "Lesson flow")
                                ForEach(segments.prefix(5)) { segment in
                                    HStack(alignment: .top, spacing: 10) {
                                        Text(segment.time)
                                            .font(.caption.weight(.bold))
                                            .foregroundStyle(NovaPalette.blue)
                                            .frame(width: 72, alignment: .leading)
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(segment.title).font(.subheadline.weight(.semibold))
                                            Text(segment.activity)
                                                .font(.footnote)
                                                .foregroundStyle(NovaPalette.muted)
                                                .lineLimit(3)
                                        }
                                    }
                                }
                            }
                        }

                        if !viewModel.errorMessage.isEmpty {
                            Label(viewModel.errorMessage, systemImage: "exclamationmark.circle.fill")
                                .font(.footnote)
                                .foregroundStyle(NovaPalette.coral)
                        }

                        Button {
                            Task {
                                await viewModel.buildPrivateLesson(accessCode: settings.accessCode, history: history)
                                if viewModel.playerConfiguration != nil { dismiss() }
                            }
                        } label: {
                            Label(viewModel.isBuildingDeck ? "Preparing Private Lesson" : "Start Private Lesson", systemImage: "play.rectangle.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                        .disabled(viewModel.isBuildingDeck)

                        Text("This creates the visual PDF lesson. The scored quiz unlocks halfway through the lesson timer.")
                            .font(.caption)
                            .foregroundStyle(NovaPalette.muted)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                    .padding(20)
                    .frame(maxWidth: 760)
                    .frame(maxWidth: .infinity)
                }
            }
            .background(NovaPalette.background.ignoresSafeArea())
            .navigationTitle("Review Lesson")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
            .overlay {
                if viewModel.isBuildingDeck {
                    GenerationProgressView(stage: viewModel.stage ?? .visualPlan)
                }
            }
        }
    }

    @ViewBuilder
    private func lessonSection(_ title: String, items: [String]) -> some View {
        if !items.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                SectionLabel(text: title)
                ForEach(items.prefix(5), id: \.self) { item in
                    Label(item, systemImage: "checkmark.circle.fill")
                        .font(.subheadline)
                        .foregroundStyle(NovaPalette.navy)
                        .symbolRenderingMode(.hierarchical)
                }
            }
        }
    }

    @ViewBuilder
    private func textSection(_ title: String, text: String?) -> some View {
        if let text, !text.isEmpty {
            VStack(alignment: .leading, spacing: 7) {
                SectionLabel(text: title)
                Text(text)
                    .font(.body)
                    .foregroundStyle(NovaPalette.navy)
            }
        }
    }
}
