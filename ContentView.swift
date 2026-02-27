import SwiftUI

struct ContentView: View {
    @State private var selectedDate = Date()
    private let calendar = Calendar.current

    var body: some View {
        VStack {
            Text("Calendar")
                .font(.largeTitle)
                .padding()

            // Month Grid
            let days = getDaysInMonth(month: calendar.component(.month, from: selectedDate),
                                       year: calendar.component(.year, from: selectedDate))
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7)) {
                ForEach(days, id: \.self) { date in
                    Text("\(calendar.component(.day, from: date))")
                        .padding()
                        .background(selectedDate == date ? Color.blue : Color.clear)
                        .cornerRadius(8)
                        .onTapGesture {
                            selectedDate = date
                        }
                }
            }

            // Daily Event List
            List {
                Text("Events for \(selectedDate, formatter: DateFormatter.shortDate)")
                    .font(.headline)

                // Placeholder for events
                ForEach(getEvents(for: selectedDate), id: \.self) { event in
                    Text(event)
                }
            }
        }
    }

    private func getDaysInMonth(month: Int, year: Int) -> [Date] {
        var days: [Date] = []
        let range = calendar.range(of: .day, in: .month, for: calendar.date(from: DateComponents(year: year, month: month))!)!
        for day in range {
            if let date = calendar.date(from: DateComponents(year: year, month: month, day: day)) {
                days.append(date)
            }
        }
        return days
    }

    private func getEvents(for date: Date) -> [String] {
        // Fetch events for the selected date
        // Placeholder data
        return ["Event 1", "Event 2", "Event 3"]
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}