import Foundation

class EventManager: ObservableObject {
    @Published var events: [Event] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let userDefaultsKey = "CalendarEvents"
    
    init() {
        loadEvents()
    }
    
    func loadEvents() {
        if let data = UserDefaults.standard.data(forKey: userDefaultsKey) {
            if let decoded = try? JSONDecoder().decode([Event].self, from: data) {
                self.events = decoded
            }
        }
    }
    
    private func saveEvents() {
        if let encoded = try? JSONEncoder().encode(events) {
            UserDefaults.standard.set(encoded, forKey: userDefaultsKey)
        }
    }
    
    func createEvent(title: String, description: String, startDate: Date, endDate: Date?, allDay: Bool, eventType: String, color: String, icon: String, recurrence: Recurrence?, reminders: [Reminder]) {
        let newEvent = Event(
            id: UUID().uuidString,
            title: title,
            description: description,
            startDate: startDate,
            endDate: endDate,
            allDay: allDay,
            eventType: eventType,
            color: color,
            icon: icon,
            recurrence: recurrence,
            reminders: reminders
        )
        
        events.append(newEvent)
        saveEvents()
    }
    
    func getEvents(from startDate: Date, to endDate: Date) -> [Event] {
        return events.filter { event in
            let eventStart = Calendar.current.startOfDay(for: event.startDate)
            let filterStart = Calendar.current.startOfDay(for: startDate)
            let filterEnd = Calendar.current.startOfDay(for: endDate)
            
            return eventStart >= filterStart && eventStart <= filterEnd
        }
    }
    
    func getEventsForDay(_ date: Date) -> [Event] {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        return events.filter { event in
            event.startDate >= startOfDay && event.startDate < endOfDay
        }
    }
    
    func getEvent(by id: String) -> Event? {
        return events.first { $0.id == id }
    }
    
    func updateEvent(_ event: Event) {
        if let index = events.firstIndex(where: { $0.id == event.id }) {
            events[index] = event
            saveEvents()
        }
    }
    
    func deleteEvent(by id: String) {
        events.removeAll { $0.id == id }
        saveEvents()
    }
    
    func expandRecurringEvent(_ event: Event, until endDate: Date) -> [Event] {
        guard let recurrence = event.recurrence else { return [event] }
        
        var expandedEvents: [Event] = [event]
        var currentDate = event.startDate
        let calendar = Calendar.current
        
        while currentDate < endDate {
            switch recurrence.type {
            case "daily":
                currentDate = calendar.date(byAdding: .day, value: recurrence.interval, to: currentDate)! 
            case "weekly":
                currentDate = calendar.date(byAdding: .weekOfYear, value: recurrence.interval, to: currentDate)!  
            case "monthly":
                currentDate = calendar.date(byAdding: .month, value: recurrence.interval, to: currentDate)!  
            case "yearly":
                currentDate = calendar.date(byAdding: .year, value: recurrence.interval, to: currentDate)! 
            default:
                break
            }
            
            if currentDate < endDate {
                var newEvent = event
                newEvent.id = UUID().uuidString
                newEvent.startDate = currentDate
                if let originalEndDate = event.endDate {
                    let duration = calendar.dateComponents([.second], from: event.startDate, to: originalEndDate).second ?? 0
                    newEvent.endDate = calendar.date(byAdding: .second, value: duration, to: currentDate)
                }
                expandedEvents.append(newEvent)
            }
        }
        
        return expandedEvents
    }
    
    let eventTypes = ["Personal", "Meeting", "Birthday", "Appointment", "Social", "Other"]
    
    let eventColors: [String: String] = [
        "personal": "#FFE5EC",
        "meeting": "#9B7EBD",
        "birthday": "#FFB6C6",
        "appointment": "#D5E8F5",
        "social": "#E6D5F5",
        "other": "#F0F8E8"
    ]
    
    let eventIcons: [String: String] = [
        "personal": "heart",
        "meeting": "briefcase",
        "birthday": "gift",
        "appointment": "calendar",
        "social": "person.2",
        "other": "star"
    ]
}