import SwiftUI

struct ContentView: View {
    @EnvironmentObject var eventManager: EventManager
    @State private var selectedDate = Date()
    @State private var showCreateEvent = false
    private let calendar = Calendar.current

    var body: some View {
        NavigationStack {
            VStack {
                // Month Grid
                let days = getDaysInMonth(month: calendar.component(.month, from: selectedDate),
                                           year: calendar.component(.year, from: selectedDate))
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7)) {
                    ForEach(days, id: \.self) { date in
                        Text("\(calendar.component(.day, from: date))")
                            .padding(8)
                            .background(calendar.isDate(date, inSameDayAs: selectedDate) ? Color.blue : Color.clear)
                            .foregroundColor(calendar.isDate(date, inSameDayAs: selectedDate) ? .white : .primary)
                            .clipShape(Circle())
                            .onTapGesture {
                                selectedDate = date
                            }
                    }
                }
                .padding(.horizontal)

                Divider()

                // Daily Event List
                let dayEvents = eventManager.getEventsForDay(selectedDate)
                List {
                    Section(header: Text(selectedDate, style: .date).font(.headline)) {
                        if dayEvents.isEmpty {
                            Text("No events")
                                .foregroundColor(.gray)
                        } else {
                            ForEach(dayEvents) { event in
                                NavigationLink {
                                    EventDetailView(event: event)
                                        .environmentObject(eventManager)
                                } label: {
                                    HStack {
                                        Circle()
                                            .fill(Color(hex: event.color))
                                            .frame(width: 10, height: 10)
                                        VStack(alignment: .leading) {
                                            Text(event.title)
                                                .fontWeight(.medium)
                                            if !event.allDay {
                                                Text(event.startDate, style: .time)
                                                    .font(.caption)
                                                    .foregroundColor(.gray)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Calendar")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showCreateEvent = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showCreateEvent) {
                EventCreationView()
                    .environmentObject(eventManager)
            }
        }
    }

    private func getDaysInMonth(month: Int, year: Int) -> [Date] {
        var days: [Date] = []
        guard let monthDate = calendar.date(from: DateComponents(year: year, month: month)),
              let range = calendar.range(of: .day, in: .month, for: monthDate) else { return days }
        for day in range {
            if let date = calendar.date(from: DateComponents(year: year, month: month, day: day)) {
                days.append(date)
            }
        }
        return days
    }
}

#Preview {
    ContentView()
        .environmentObject(EventManager())
}