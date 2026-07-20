import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var settings: AppSettings
    @EnvironmentObject private var history: LessonHistoryStore
    @State private var showClearConfirmation = false

    var body: some View {
        NavigationStack {
            Form {
                Section("AI Tutor Beta") {
                    SecureField("Access code", text: $settings.accessCode)
                        .textContentType(.password)
                        .autocorrectionDisabled()

                    Button("Save Access Code") { settings.saveAccessCode() }
                        .disabled(settings.accessCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                    if settings.hasAccessCode {
                        Button("Remove Access Code", role: .destructive) { settings.clearAccessCode() }
                    }

                    if !settings.statusMessage.isEmpty {
                        Text(settings.statusMessage)
                            .font(.footnote)
                            .foregroundStyle(NovaPalette.teal)
                    }

                    Text("Beta access is provided by NovaSprout for testing. It is not an in-app purchase or subscription.")
                        .font(.caption)
                        .foregroundStyle(NovaPalette.muted)
                }

                Section("Support") {
                    Link(destination: URL(string: "https://www.novasproutlearning.com")!) {
                        Label("NovaSprout website", systemImage: "safari")
                    }
                    Link(destination: URL(string: "mailto:novasproutlearning@gmail.com")!) {
                        Label("novasproutlearning@gmail.com", systemImage: "envelope")
                    }
                    Link(destination: URL(string: "https://www.novasproutlearning.com/privacy")!) {
                        Label("Privacy Policy", systemImage: "hand.raised")
                    }
                }

                Section("On This Device") {
                    LabeledContent("Saved lessons", value: "\(history.lessons.count)")
                    Button("Clear Lesson History", role: .destructive) {
                        showClearConfirmation = true
                    }
                    .disabled(history.lessons.isEmpty)
                    Text("Generated lesson PDFs and quiz scores are stored on this device. Removing the app also removes them.")
                        .font(.caption)
                        .foregroundStyle(NovaPalette.muted)
                }

                Section("About") {
                    LabeledContent("Version", value: appVersion)
                    Text("NovaSprout Learning is a brand of Karigari Home LLC.")
                        .font(.footnote)
                }
            }
            .navigationTitle("Settings")
            .confirmationDialog("Clear all saved lessons?", isPresented: $showClearConfirmation, titleVisibility: .visible) {
                Button("Clear Lesson History", role: .destructive) { history.clear() }
                Button("Cancel", role: .cancel) {}
            }
        }
    }

    private var appVersion: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(version) (\(build))"
    }
}
