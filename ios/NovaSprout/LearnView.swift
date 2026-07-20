import SwiftUI

struct LearnView: View {
    @Binding var selectedTab: AppTab
    @EnvironmentObject private var settings: AppSettings
    @EnvironmentObject private var history: LessonHistoryStore
    @StateObject private var viewModel = LessonGeneratorViewModel()
    @State private var handledLaunchArguments = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    brandHeader
                    sampleLesson
                    lessonForm
                }
                .frame(maxWidth: 760)
                .padding(.horizontal, 18)
                .padding(.vertical, 20)
                .frame(maxWidth: .infinity)
            }
            .background(NovaPalette.background.ignoresSafeArea())
            .navigationTitle("AI Tutor")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $viewModel.showOverview) {
                LessonOverviewView(viewModel: viewModel)
                    .environmentObject(settings)
                    .environmentObject(history)
            }
            .fullScreenCover(item: $viewModel.playerConfiguration) { configuration in
                LessonPlayerView(configuration: configuration)
                    .environmentObject(history)
            }
            .overlay {
                if viewModel.isGenerating {
                    GenerationProgressView(stage: viewModel.stage ?? .lesson)
                }
            }
            .task {
                #if DEBUG
                if !handledLaunchArguments && CommandLine.arguments.contains("-openSample") {
                    handledLaunchArguments = true
                    viewModel.openSample()
                }
                #endif
            }
        }
    }

    private var brandHeader: some View {
        HStack(spacing: 14) {
            Image("NovaSproutLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 66, height: 66)
                .clipShape(Circle())
                .accessibilityLabel("NovaSprout Learning")

            VStack(alignment: .leading, spacing: 4) {
                Text("Learn it your way")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(NovaPalette.navy)
                Text("Create a focused visual lesson, study privately, then take a scored quiz.")
                    .font(.subheadline)
                    .foregroundStyle(NovaPalette.muted)
            }
        }
    }

    private var sampleLesson: some View {
        HStack(spacing: 14) {
            SubjectMark(subject: "Mathematics")
            VStack(alignment: .leading, spacing: 3) {
                Text("Try a free sample")
                    .font(.headline)
                Text("Equivalent fractions, with a short quiz")
                    .font(.subheadline)
                    .foregroundStyle(NovaPalette.muted)
            }
            Spacer(minLength: 8)
            Button("Open") {
                viewModel.openSample()
            }
            .buttonStyle(.bordered)
        }
        .novaCard()
    }

    private var lessonForm: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 4) {
                SectionLabel(text: "Create a lesson")
                Text("What would you like to understand today?")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(NovaPalette.navy)
            }

            LabeledContent("Grade") {
                Picker("Grade", selection: $viewModel.request.grade) {
                    ForEach(LessonOptions.grades, id: \.self) { Text($0) }
                }
                .labelsHidden()
            }

            LabeledContent("Subject") {
                Picker("Subject", selection: $viewModel.request.subject) {
                    ForEach(LessonOptions.subjects, id: \.self) { Text($0) }
                }
                .labelsHidden()
            }

            VStack(alignment: .leading, spacing: 7) {
                Text("Topic")
                    .font(.subheadline.weight(.semibold))
                TextField("For example: the digestive system", text: $viewModel.request.topic)
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.sentences)
            }

            LabeledContent("Goal") {
                Picker("Goal", selection: $viewModel.request.goal) {
                    ForEach(LessonOptions.goals, id: \.self) { Text($0) }
                }
                .labelsHidden()
            }

            LabeledContent("Length") {
                Picker("Length", selection: $viewModel.request.duration) {
                    ForEach(LessonOptions.durations, id: \.self) { Text($0) }
                }
                .labelsHidden()
            }

            VStack(alignment: .leading, spacing: 7) {
                Text("Your question (optional)")
                    .font(.subheadline.weight(.semibold))
                TextField("What is confusing or important?", text: $viewModel.request.studentQuestion, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(2...4)
            }

            if !viewModel.errorMessage.isEmpty {
                Label(viewModel.errorMessage, systemImage: "exclamationmark.circle.fill")
                    .font(.footnote)
                    .foregroundStyle(NovaPalette.coral)
            }

            Button {
                Task { await viewModel.generate(accessCode: settings.accessCode) }
            } label: {
                Label("Create My Lesson", systemImage: "wand.and.stars")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(viewModel.isGenerating)

            if !settings.hasAccessCode {
                Button("Add beta access in Settings") {
                    selectedTab = .settings
                }
                .font(.footnote.weight(.semibold))
                .frame(maxWidth: .infinity)
            }

            Label("Visual lesson creation may take a few minutes. Do not include sensitive student information.", systemImage: "lock.shield")
                .font(.caption)
                .foregroundStyle(NovaPalette.muted)
        }
        .novaCard()
    }
}
