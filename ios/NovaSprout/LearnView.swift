import SwiftUI
import StoreKit

struct LearnView: View {
    @Binding var selectedTab: AppTab
    @EnvironmentObject private var settings: AppSettings
    @EnvironmentObject private var history: LessonHistoryStore
    @EnvironmentObject private var purchases: PurchaseManager
    @StateObject private var viewModel = LessonGeneratorViewModel()
    @State private var handledLaunchArguments = false
    @State private var showPurchaseOptions = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    brandHeader
                    sampleLesson
                    accessCard
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
            .sheet(isPresented: $showPurchaseOptions) {
                PurchaseOptionsView()
                    .environmentObject(purchases)
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

    private var accessCard: some View {
        HStack(spacing: 12) {
            Image(systemName: purchases.hasMonthlyAccess ? "checkmark.seal.fill" : "graduationcap.fill")
                .font(.title2)
                .foregroundStyle(purchases.hasMonthlyAccess ? NovaPalette.teal : NovaPalette.blue)
            VStack(alignment: .leading, spacing: 3) {
                Text(purchases.hasMonthlyAccess ? "AI Tutor access active" : "Create your own AI lesson")
                    .font(.headline)
                Text(purchases.hasMonthlyAccess
                     ? "Your monthly access is ready."
                     : "Choose one lesson or monthly access.")
                    .font(.subheadline)
                    .foregroundStyle(NovaPalette.muted)
            }
            Spacer(minLength: 8)
            if !purchases.hasMonthlyAccess {
                Button("View") { showPurchaseOptions = true }
                    .buttonStyle(.bordered)
            }
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
                    .onChange(of: viewModel.request.topic) { _, newValue in
                        if newValue.count > 90 {
                            viewModel.request.topic = String(newValue.prefix(90))
                        }
                    }
                Text("Use a school topic that matches the selected subject and grade.")
                    .font(.caption)
                    .foregroundStyle(NovaPalette.muted)
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
                startLesson()
            } label: {
                Label("Create My Lesson", systemImage: "wand.and.stars")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(viewModel.isGenerating)

            if !purchases.hasMonthlyAccess {
                HStack {
                    Button("Purchase access") { showPurchaseOptions = true }
                    Spacer()
                    Button("Beta access") { selectedTab = .settings }
                }
                .font(.footnote.weight(.semibold))
            }

            Label("Visual lesson creation may take a few minutes. Do not include sensitive student information.", systemImage: "lock.shield")
                .font(.caption)
                .foregroundStyle(NovaPalette.muted)
        }
        .novaCard()
    }

    private func startLesson() {
        if let validationError = CurriculumTopicValidator.error(
            topic: viewModel.request.topic,
            subject: viewModel.request.subject,
            grade: viewModel.request.grade,
            studentQuestion: viewModel.request.studentQuestion
        ) {
            viewModel.errorMessage = validationError
            return
        }

        let access = purchases.accessForNewLesson(betaCode: settings.accessCode)
        guard !access.isEmpty else {
            showPurchaseOptions = true
            return
        }

        Task {
            if await viewModel.generate(access: access) {
                await purchases.markSingleLessonStarted(using: access)
            }
        }
    }
}

private struct PurchaseOptionsView: View {
    @EnvironmentObject private var purchases: PurchaseManager
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Unlock AI Tutor")
                            .font(.title2.weight(.bold))
                            .foregroundStyle(NovaPalette.navy)
                        Text("Create curriculum-checked visual lessons with a timed quiz.")
                            .foregroundStyle(NovaPalette.muted)
                    }

                    if let product = purchases.singleLessonProduct {
                        purchaseRow(
                            product: product,
                            title: "One AI lesson",
                            detail: "One personalized lesson, visual deck, and quiz"
                        )
                    }

                    if let product = purchases.monthlyProduct {
                        purchaseRow(
                            product: product,
                            title: "Monthly AI Tutor",
                            detail: "Up to 20 personalized lessons per subscription month"
                        )
                    }

                    if purchases.products.isEmpty && !purchases.isLoading {
                        Label("Purchases are not available yet. Please try again shortly.", systemImage: "exclamationmark.circle")
                            .font(.footnote)
                            .foregroundStyle(NovaPalette.coral)
                    }

                    if !purchases.statusMessage.isEmpty {
                        Text(purchases.statusMessage)
                            .font(.footnote)
                            .foregroundStyle(NovaPalette.teal)
                    }

                    Button("Restore Purchases") {
                        Task { await purchases.restorePurchases() }
                    }
                    .frame(maxWidth: .infinity)

                    Text("Monthly access renews automatically unless canceled at least 24 hours before the end of the current period. Payment is charged to your Apple Account. Manage or cancel in App Store subscriptions.")
                        .font(.caption)
                        .foregroundStyle(NovaPalette.muted)

                    HStack {
                        Link("Privacy", destination: URL(string: "https://www.novasproutlearning.com/privacy")!)
                        Spacer()
                        Link("Terms", destination: URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!)
                        Spacer()
                        Link("Manage subscription", destination: URL(string: "https://apps.apple.com/account/subscriptions")!)
                    }
                    .font(.caption.weight(.semibold))
                }
                .padding(20)
            }
            .background(NovaPalette.background.ignoresSafeArea())
            .navigationTitle("AI Tutor Access")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
            .task { await purchases.refresh() }
        }
    }

    private func purchaseRow(product: Product, title: String, detail: String) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.headline)
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(NovaPalette.muted)
            }
            Spacer(minLength: 8)
            Button(product.displayPrice) {
                Task { await purchases.purchase(product) }
            }
            .buttonStyle(.borderedProminent)
            .disabled(purchases.isPurchasing)
        }
        .novaCard()
    }
}
