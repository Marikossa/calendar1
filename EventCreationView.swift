import SwiftUI

struct EventCreationView: View {
    @EnvironmentObject var eventManager: EventManager
    @Environment(\.dismiss) var dismiss
    
    @State private var title = ""
    @State private var description = ""
    @State private var startDate = Date()
    @State private var endDate = Date()
    @State private var allDay = false
    @State private var selectedEventType = "personal"
    @State private var selectedReminders: Set<Int> = []
    
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
            .navigationTitle("Create Event")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let reminders = selectedReminders.map { Reminder(minutesBefore: $0) }
                        let recurrence = Recurrence(type: "none", interval: 1)
                        eventManager.createEvent(
                            title: title,
                            description: description,
                            startDate: startDate,
                            endDate: allDay ? nil : endDate,
                            allDay: allDay,
                            eventType: selectedEventType,
                            color: eventManager.eventColors[selectedEventType] ?? "#FFE5EC",
                            icon: eventManager.eventIcons[selectedEventType] ?? "heart",
                            recurrence: recurrence,
                            reminders: reminders
                        )
                        dismiss()
                    }
                    .disabled(title.isEmpty)
                }
            }
        }
    }
}

#Preview {
    EventCreationView()
        .environmentObject(EventManager())
}