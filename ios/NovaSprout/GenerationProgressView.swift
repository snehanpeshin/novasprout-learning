import SwiftUI

struct GenerationProgressView: View {
    let stage: GenerationStage

    private var visibleStages: [GenerationStage] {
        stage == .lesson
            ? [.lesson]
            : [.visualPlan, .images, .compilation, .quality, .ready]
    }

    var body: some View {
        ZStack {
            Color.black.opacity(0.28)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 16) {
                ProgressView()
                    .controlSize(.large)
                    .tint(NovaPalette.blue)
                    .frame(maxWidth: .infinity)
                Text(stage.rawValue)
                    .font(.headline)
                    .foregroundStyle(NovaPalette.navy)
                    .frame(maxWidth: .infinity, alignment: .center)
                Text(stage.detail)
                    .font(.subheadline)
                    .foregroundStyle(NovaPalette.muted)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)

                if visibleStages.count > 1 {
                    VStack(alignment: .leading, spacing: 9) {
                        ForEach(visibleStages) { item in
                            Label(item.rawValue, systemImage: stageSymbol(for: item))
                                .font(.caption.weight(item == stage ? .semibold : .regular))
                                .foregroundStyle(stageColor(for: item))
                        }
                    }
                    .padding(.top, 2)
                }
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

    private func stageSymbol(for item: GenerationStage) -> String {
        guard let current = visibleStages.firstIndex(of: stage),
              let index = visibleStages.firstIndex(of: item) else {
            return "circle"
        }
        if index < current { return "checkmark.circle.fill" }
        if index == current { return "circle.dotted.circle.fill" }
        return "circle"
    }

    private func stageColor(for item: GenerationStage) -> Color {
        guard let current = visibleStages.firstIndex(of: stage),
              let index = visibleStages.firstIndex(of: item) else {
            return NovaPalette.muted
        }
        if index < current { return NovaPalette.teal }
        if index == current { return NovaPalette.blue }
        return NovaPalette.muted
    }
}
