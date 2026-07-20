import SwiftUI

struct GenerationProgressView: View {
    let stage: GenerationStage

    var body: some View {
        ZStack {
            Color.black.opacity(0.28)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                ProgressView()
                    .controlSize(.large)
                    .tint(NovaPalette.blue)
                Text(stage.rawValue)
                    .font(.headline)
                    .foregroundStyle(NovaPalette.navy)
                Text("NovaSprout is preparing your lesson.")
                    .font(.subheadline)
                    .foregroundStyle(NovaPalette.muted)
            }
            .padding(28)
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .shadow(color: .black.opacity(0.14), radius: 20, y: 8)
            .padding(30)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(stage.rawValue). Please wait.")
    }
}
