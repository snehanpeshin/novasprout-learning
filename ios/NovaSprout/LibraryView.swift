import SwiftUI

struct LibraryView: View {
    @EnvironmentObject private var history: LessonHistoryStore
    @State private var selectedLesson: LessonPlayerConfiguration?

    var body: some View {
        NavigationStack {
            Group {
                if history.lessons.isEmpty {
                    ContentUnavailableView {
                        Label("No saved lessons", systemImage: "books.vertical")
                    } description: {
                        Text("Generated private lessons will appear here on this device.")
                    }
                } else {
                    List {
                        ForEach(history.lessons) { saved in
                            Button {
                                selectedLesson = LessonPlayerConfiguration(
                                    context: saved.context,
                                    lesson: saved.lesson,
                                    pdfData: history.pdfData(for: saved),
                                    savedLessonID: saved.id,
                                    deckSummary: saved.deckSummary
                                )
                            } label: {
                                HStack(spacing: 13) {
                                    SubjectMark(subject: saved.context.subject)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(saved.lesson.displayTitle)
                                            .font(.headline)
                                            .foregroundStyle(NovaPalette.navy)
                                            .lineLimit(2)
                                        Text("\(saved.context.grade) | \(saved.createdAt.formatted(date: .abbreviated, time: .omitted))")
                                            .font(.caption)
                                            .foregroundStyle(NovaPalette.muted)
                                        if let score = saved.lastScore {
                                            Text("Latest quiz: \(score)%")
                                                .font(.caption.weight(.semibold))
                                                .foregroundStyle(NovaPalette.teal)
                                        }
                                        if let pageCount = saved.deckSummary?.pageCount, pageCount > 0 {
                                            Label("\(pageCount) visual slides", systemImage: "rectangle.stack")
                                                .font(.caption)
                                                .foregroundStyle(NovaPalette.muted)
                                        }
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(.tertiary)
                                }
                                .padding(.vertical, 4)
                            }
                            .buttonStyle(.plain)
                        }
                        .onDelete(perform: history.delete)
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("My Lessons")
            .fullScreenCover(item: $selectedLesson) { configuration in
                LessonPlayerView(configuration: configuration)
                    .environmentObject(history)
            }
        }
    }
}
