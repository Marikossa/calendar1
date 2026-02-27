import SwiftUI

struct EventEditView: View {
    @State var title: String
    @State var description: String
    @State var startDate: Date
    @State var endDate: Date
    @State var eventType: String
    @State var reminders: Bool

    var body: some View {
        Form {
            Section(header: Text("Event Details")) {
                TextField("Title", text: $title)
                TextField("Description", text: $description)
                DatePicker("Start Date", selection: $startDate, displayedComponents: [.date, .hourAndMinute])
                DatePicker("End Date", selection: $endDate, displayedComponents: [.date, .hourAndMinute])
                TextField("Event Type", text: $eventType)
                Toggle(isOn: $reminders) {
                    Text("Reminders")
                }
            }
        }
        .navigationTitle("Edit Event")
    }
}