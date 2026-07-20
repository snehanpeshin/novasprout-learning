import PDFKit
import SwiftUI

struct PDFKitView: UIViewRepresentable {
    let data: Data
    @Binding var currentPage: Int
    @Binding var pageCount: Int

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> PDFView {
        let view = PDFView()
        view.autoScales = true
        view.displayMode = .singlePage
        view.displayDirection = .horizontal
        view.displaysPageBreaks = true
        view.pageBreakMargins = UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10)
        view.backgroundColor = UIColor(NovaPalette.navy)
        view.document = PDFDocument(data: data)
        view.usePageViewController(true, withViewOptions: [
            UIPageViewController.OptionsKey.interPageSpacing: 12
        ])
        context.coordinator.observe(view)
        context.coordinator.updatePageState(from: view)
        return view
    }

    func updateUIView(_ view: PDFView, context: Context) {
        context.coordinator.parent = self
    }

    static func dismantleUIView(_ view: PDFView, coordinator: Coordinator) {
        coordinator.stopObserving()
    }

    final class Coordinator {
        var parent: PDFKitView
        private var pageObserver: NSObjectProtocol?

        init(parent: PDFKitView) {
            self.parent = parent
        }

        func observe(_ view: PDFView) {
            pageObserver = NotificationCenter.default.addObserver(
                forName: .PDFViewPageChanged,
                object: view,
                queue: .main
            ) { [weak self, weak view] _ in
                guard let self, let view else { return }
                self.updatePageState(from: view)
            }
        }

        func stopObserving() {
            if let pageObserver {
                NotificationCenter.default.removeObserver(pageObserver)
            }
            pageObserver = nil
        }

        func updatePageState(from view: PDFView) {
            guard let document = view.document else { return }
            let nextCount = document.pageCount
            let nextPage = view.currentPage.map { document.index(for: $0) + 1 } ?? 1
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                if self.parent.pageCount != nextCount { self.parent.pageCount = nextCount }
                if self.parent.currentPage != nextPage { self.parent.currentPage = nextPage }
            }
        }
    }
}
