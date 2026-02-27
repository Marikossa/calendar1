import Foundation

struct Event {
    var title: String
    var date: Date
    var recurrence: Recurrence?
}

enum Recurrence {
    case daily
    case weekly
    case monthly
    case yearly
}