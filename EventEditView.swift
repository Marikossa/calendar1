import SwiftUI

struct EventEditView: View {
    @EnvironmentObject var eventManager: EventManager
    @Environment(\.dismiss) var dismiss

    var event: Event

    @State private var title: String
    @State private var description: String
    @State private var startDate: Date
    @State private var endDate: Date
    @State private var allDay: Bool
    @State private var selectedEventType: String
    @State private var selectedReminders: Set<Int>

    init(event: Event) {
        self.event = event
        _title = State(initialValue: event.title)
        _description = State(initialValue: event.description)
        _startDate = State(initialValue: event.startDate)
        _endDate = State(initialValue: event.endDate ?? event.startDate)
        _allDay = State(initialValue: event.allDay)
        _selectedEventType = State(initialValue: event.eventType)
        _selectedReminders = State(initialValue: Set(event.reminders.map { $0.minutesBefore }))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Event Details")) {
                    TextField("Title", text: $title)
                    TextField("Description", text: $description)
                }

                Section(header: Text("Date & Time")) {
                    Toggle("All Day", isOn: $allDay)
                    DatePicker("Start Date", selection: $startDate, displayedComponents: [.date, .hourAndMinute])
                    if !allDay {
                        DatePicker("End Date", selection: $endDate, displayedComponents: [.date, .hourAndMinute])
                    }
                }

                Section(header: Text("Event Type")) {
                    Picker("Type", selection: $selectedEventType) {
                        Text("Personal").tag("personal")
                        Text("Meeting").tag("meeting")
                        Text("Birthday").tag("birthday")
                        Text("Appointment").tag("appointment")
                        Text("Social").tag("social")
                        Text("Other").tag("other")
                    }
                }

                Section(header: Text("Reminders")) {
                    Toggle("5 minutes", isOn: Binding(get: { selectedReminders.contains(5) }, set: { if $0 { selectedReminders.insert(5) } else { selectedReminders.remove(5) } }))
                    Toggle("15 minutes", isOn: Binding(get: { selectedReminders.contains(15) }, set: { if $0 { selectedReminders.insert(15) } else { selectedReminders.remove(15) } }))
                    Toggle("30 minutes", isOn: Binding(get: { selectedReminders.contains(30) }, set: { if $0 { selectedReminders.insert(30) } else { selectedReminders.remove(30) } }))
                    Toggle("1 hour", isOn: Binding(get: { selectedReminders.contains(60) }, set: { if $0 { selectedReminders.insert(60) } else { selectedReminders.remove(60) } }))
                    Toggle("1 day", isOn: Binding(get: { selectedReminders.contains(1440) }, set: { if $0 { selectedReminders.insert(1440) } else { selectedReminders.remove(1440) } }))
                }
            }
            .navigationTitle("Edit Event")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        var updated = event
                        updated.title = title
                        updated.description = description
                        updated.startDate = startDate
                        updated.endDate = allDay ? nil : endDate
                        updated.allDay = allDay
                        updated.eventType = selectedEventType
                        updated.color = eventManager.eventColors[selectedEventType] ?? event.color
                        updated.icon = eventManager.eventIcons[selectedEventType] ?? event.icon
                        updated.reminders = selectedReminders.map { Reminder(minutesBefore: $0) }
                        eventManager.updateEvent(updated)
                        dismiss()
                    }
                    .disabled(title.isEmpty)
                }
            }
        }
    }
}

#Preview {
    EventEditView(event: Event(id: "1", title: "Team Meeting", description: "Weekly sync", startDate: Date(), eventType: "meeting", color: "#9B7EBD", icon: "briefcase"))
        .environmentObject(EventManager())
}