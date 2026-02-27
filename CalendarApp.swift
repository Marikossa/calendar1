import SwiftUI

@main
struct CalendarApp: App {
    @StateObject private var eventManager = EventManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(eventManager)
        }
    }
}