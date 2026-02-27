import Foundation

struct Event: Identifiable, Codable {
    var id: String?
    var title: String
    var description: String
    var startDate: Date
    var endDate: Date?
    var allDay: Bool = false
    var eventType: String
    var color: String
    var icon: String
    var recurrence: Recurrence?
    var reminders: [Reminder] = []
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case title
        case description
        case startDate = "start_date"
        case endDate = "end_date"
        case allDay = "all_day"
        case eventType = "event_type"
        case color
        case icon
        case recurrence
        case reminders
    }
}

struct Recurrence: Codable {
    var type: String
    var interval: Int
    var endDate: String?
    
    enum CodingKeys: String, CodingKey {
        case type
        case interval
        case endDate = "end_date"
    }
}

struct Reminder: Codable, Identifiable {
    var id = UUID()
    var minutesBefore: Int
    
    enum CodingKeys: String, CodingKey {
        case minutesBefore = "minutes_before"
    }
}