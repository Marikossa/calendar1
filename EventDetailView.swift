import SwiftUI

struct EventDetailView: View {
    @EnvironmentObject var eventManager: EventManager
    @Environment(\.dismiss) var dismiss
    
    var event: Event
    @State private var showEditView = false
    @State private var showDeleteConfirmation = false
    
    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Circle()
                            .fill(Color(hex: event.color))
                            .frame(width: 16, height: 16)
                        Text(event.eventType.uppercased())
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    Text(event.title)
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    Text(event.description)
                        .font(.body)
                        .foregroundColor(.gray)
                }
                .padding()
                
                Divider()
                
                VStack(alignment: .leading, spacing: 12) {
                    Label { if event.allDay { Text("All Day Event") } else { Text(event.startDate, style: .date) + Text(" at ") + Text(event.startDate, style: .time) } } icon: { Image(systemName: "calendar") }
                    if let endDate = event.endDate, !event.allDay {
                        Label { Text(endDate, style: .time) } icon: { Image(systemName: "clock") }
                    }
                }
                .padding()
                
                Divider()
                
                if let recurrence = event.recurrence {
                    VStack(alignment: .leading) {
                        Label { Text("\(recurrence.type.capitalized) (Interval: \(recurrence.interval))") } icon: { Image(systemName: "repeat") }
                    }
                    .padding()
                    Divider()
                }
                
                if !event.reminders.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label { Text("Reminders") } icon: { Image(systemName: "bell") }
                        ForEach(event.reminders) { reminder in
                            Text("• \(formatMinutes(reminder.minutesBefore))")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .padding(.leading, 24)
                        }
                    }
                    .padding()
                    Divider()
                }
                
                Spacer()
                
                HStack(spacing: 12) {
                    Button(action: { showEditView = true }) {
                        Label("Edit", systemImage: "pencil")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    
                    Button(role: .destructive, action: { showDeleteConfirmation = true }) {
                        Label("Delete", systemImage: "trash")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
                .padding()
            }
            .navigationTitle("Event Details")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showEditView) {
            EventEditView(event: event)
                .environmentObject(eventManager)
        }
        .alert("Delete Event?", isPresented: $showDeleteConfirmation) {
            Button("Delete", role: .destructive) {
                if let id = event.id {
                    eventManager.deleteEvent(by: id)
                    dismiss()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This action cannot be undone.")
        }
    }
    
    private func formatMinutes(_ minutes: Int) -> String {
        if minutes < 60 {
            return "\(minutes) minutes before"
        } else if minutes < 1440 {
            return "\(minutes / 60) hour(s) before"
        } else {
            return "\(minutes / 1440) day(s) before"
        }
    }
}

#Preview {
    EventDetailView(event: Event(id: "1", title: "Team Meeting", description: "Weekly sync", startDate: Date(), eventType: "meeting", color: "#9B7EBD", icon: "briefcase"))
        .environmentObject(EventManager())
}