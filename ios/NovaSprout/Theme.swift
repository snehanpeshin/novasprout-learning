import SwiftUI

enum NovaPalette {
    static let navy = Color(red: 0.06, green: 0.17, blue: 0.29)
    static let blue = Color(red: 0.04, green: 0.49, blue: 0.74)
    static let teal = Color(red: 0.05, green: 0.60, blue: 0.48)
    static let yellow = Color(red: 0.98, green: 0.73, blue: 0.18)
    static let coral = Color(red: 0.94, green: 0.38, blue: 0.32)
    static let background = Color(red: 0.96, green: 0.98, blue: 0.99)
    static let muted = Color(red: 0.34, green: 0.42, blue: 0.49)
}

struct NovaCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(Color(uiColor: .systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(Color.black.opacity(0.08), lineWidth: 1)
            }
    }
}

extension View {
    func novaCard() -> some View {
        modifier(NovaCardModifier())
    }
}

struct SectionLabel: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(.caption.weight(.bold))
            .foregroundStyle(NovaPalette.blue)
            .tracking(0)
    }
}

struct SubjectMark: View {
    let subject: String

    private var symbol: String {
        switch subject {
        case "Mathematics": "function"
        case "Science": "atom"
        case "English": "text.book.closed"
        case "Social Studies": "globe.americas"
        case "Computer Science": "chevron.left.forwardslash.chevron.right"
        default: "checkmark.seal"
        }
    }

    private var color: Color {
        switch subject {
        case "Mathematics": NovaPalette.blue
        case "Science": NovaPalette.teal
        case "English": NovaPalette.coral
        case "Social Studies": Color.indigo
        case "Computer Science": NovaPalette.navy
        default: NovaPalette.yellow
        }
    }

    var body: some View {
        Image(systemName: symbol)
            .font(.title3.weight(.semibold))
            .foregroundStyle(color)
            .frame(width: 38, height: 38)
            .background(color.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .accessibilityHidden(true)
    }
}
