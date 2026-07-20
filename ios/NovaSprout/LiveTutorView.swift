import SwiftUI

struct LiveTutorView: View {
    @Environment(\.openURL) private var openURL
    @State private var name = ""
    @State private var gradeAndSubject = ""
    @State private var message = ""

    private let bookingURL = URL(string: "https://calendly.com/novasprout-learning/free-15-min-intro-call")!
    private let email = "novasproutlearning@gmail.com"

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 7) {
                        SectionLabel(text: "Human support")
                        Text("Meet a live tutor")
                            .font(.title2.weight(.bold))
                            .foregroundStyle(NovaPalette.navy)
                        Text("One-to-one online tutoring is $20 per class. Start with a free consultation.")
                            .font(.body)
                            .foregroundStyle(NovaPalette.muted)
                    }

                    Link(destination: bookingURL) {
                        Label("Book a Free Demo", systemImage: "calendar.badge.plus")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)

                    HStack(spacing: 12) {
                        Link(destination: URL(string: "mailto:\(email)")!) {
                            Label("Email", systemImage: "envelope")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)

                        Link(destination: URL(string: "tel:+17752488317")!) {
                            Label("Call", systemImage: "phone")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }

                    VStack(alignment: .leading, spacing: 14) {
                        SectionLabel(text: "Send a tutor request")
                        TextField("Your name", text: $name)
                            .textFieldStyle(.roundedBorder)
                        TextField("Grade and subject", text: $gradeAndSubject)
                            .textFieldStyle(.roundedBorder)
                        TextField("What help do you need?", text: $message, axis: .vertical)
                            .textFieldStyle(.roundedBorder)
                            .lineLimit(3...6)

                        Button {
                            openTutorEmail()
                        } label: {
                            Label("Send Request", systemImage: "paperplane.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                    .novaCard()

                    VStack(alignment: .leading, spacing: 7) {
                        Text(email)
                            .font(.subheadline.weight(.semibold))
                        Text("+1 775-248-8317")
                            .font(.subheadline.weight(.semibold))
                        Text("Sessions are held online through Google Meet or Zoom.")
                            .font(.caption)
                            .foregroundStyle(NovaPalette.muted)
                    }
                }
                .frame(maxWidth: 720)
                .padding(20)
                .frame(maxWidth: .infinity)
            }
            .background(NovaPalette.background.ignoresSafeArea())
            .navigationTitle("Live Tutor")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func openTutorEmail() {
        var components = URLComponents()
        components.scheme = "mailto"
        components.path = email
        components.queryItems = [
            URLQueryItem(name: "subject", value: "NovaSprout live tutor request"),
            URLQueryItem(name: "body", value: "Name: \(name)\nGrade and subject: \(gradeAndSubject)\n\nHow we can help:\n\(message)")
        ]
        if let url = components.url { openURL(url) }
    }
}
