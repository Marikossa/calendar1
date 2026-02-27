import Foundation

class APIManager {
    static let shared = APIManager()

    private let baseURL: String

    private init() {
        baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:8001/api"
    }

    // MARK: - Events

    func fetchEvents(completion: @escaping (Result<[Event], Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/events") else {
            completion(.failure(URLError(.badURL)))
            return
        }
        NetworkManager.shared.request(url: url, completion: completion)
    }

    func createEvent(_ event: Event, completion: @escaping (Result<Event, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/events") else {
            completion(.failure(URLError(.badURL)))
            return
        }
        guard let body = try? JSONEncoder().encode(event) else {
            completion(.failure(URLError(.cannotDecodeContentData)))
            return
        }
        NetworkManager.shared.request(url: url, method: "POST", body: body, completion: completion)
    }

    func updateEvent(_ event: Event, completion: @escaping (Result<Event, Error>) -> Void) {
        guard let id = event.id, let url = URL(string: "\(baseURL)/events/\(id)") else {
            completion(.failure(URLError(.badURL)))
            return
        }
        guard let body = try? JSONEncoder().encode(event) else {
            completion(.failure(URLError(.cannotDecodeContentData)))
            return
        }
        NetworkManager.shared.request(url: url, method: "PUT", body: body, completion: completion)
    }

    func deleteEvent(id: String, completion: @escaping (Result<Void, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/events/\(id)") else {
            completion(.failure(URLError(.badURL)))
            return
        }
        NetworkManager.shared.requestVoid(url: url, method: "DELETE", completion: completion)
    }

    func fetchEventsForDate(_ date: Date, completion: @escaping (Result<[Event], Error>) -> Void) {
        let formatter = ISO8601DateFormatter()
        let dateString = formatter.string(from: Calendar.current.startOfDay(for: date))
        guard let encoded = dateString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "\(baseURL)/events?date=\(encoded)") else {
            completion(.failure(URLError(.badURL)))
            return
        }
        NetworkManager.shared.request(url: url, completion: completion)
    }
}
