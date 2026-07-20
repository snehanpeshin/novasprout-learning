import SwiftUI

enum AppTab: Hashable {
    case learn
    case library
    case tutor
    case settings
}

struct RootView: View {
    @State private var selectedTab: AppTab = .learn

    var body: some View {
        TabView(selection: $selectedTab) {
            LearnView(selectedTab: $selectedTab)
                .tabItem { Label("Learn", systemImage: "sparkles") }
                .tag(AppTab.learn)

            LibraryView()
                .tabItem { Label("Library", systemImage: "books.vertical") }
                .tag(AppTab.library)

            LiveTutorView()
                .tabItem { Label("Live Tutor", systemImage: "person.2.wave.2") }
                .tag(AppTab.tutor)

            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
                .tag(AppTab.settings)
        }
    }
}
