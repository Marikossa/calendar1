#!/usr/bin/env python3
"""
Comprehensive test suite for Bridgerton Calendar API Backend
Tests all CRUD operations and recurring event functionality
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Any
import sys

# Backend URL from frontend .env file
BACKEND_URL = "https://period-planner-7.preview.emergentagent.com/api"

class BridgertonCalendarAPITest:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.created_events = []  # Track created events for cleanup
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_result(self, test_name: str, success: bool, message: str = "", error: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   📝 {message}")
        if error:
            print(f"   🚨 Error: {error}")
            self.test_results["errors"].append(f"{test_name}: {error}")
        
        if success:
            self.test_results["passed"] += 1
        else:
            self.test_results["failed"] += 1
        print()

    def test_api_health(self):
        """Test if the API is responding"""
        print("🔄 Testing API Health Check...")
        try:
            response = requests.get(f"{self.backend_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("API Health Check", True, f"API is responding: {data.get('message', 'OK')}")
                return True
            else:
                self.log_result("API Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("API Health Check", False, error=str(e))
            return False

    def create_test_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to create an event and track it"""
        try:
            response = requests.post(f"{self.backend_url}/events", 
                                   json=event_data, 
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            
            if response.status_code == 200:
                created_event = response.json()
                self.created_events.append(created_event.get("_id"))
                return created_event
            else:
                print(f"Failed to create event: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error creating event: {e}")
            return None

    def test_create_simple_event(self):
        """Test POST /api/events - Create a simple meeting event"""
        print("🔄 Testing Create Simple Event...")
        
        # Test data as specified in requirements
        event_data = {
            "title": "Team Standup",
            "description": "Daily team standup meeting",
            "start_date": (datetime.now() + timedelta(hours=2)).replace(hour=10, minute=0, second=0, microsecond=0).isoformat(),
            "end_date": (datetime.now() + timedelta(hours=2)).replace(hour=11, minute=0, second=0, microsecond=0).isoformat(),
            "all_day": False,
            "event_type": "meeting",
            "color": "#9B7EBD",
            "icon": "briefcase",
            "recurrence": {
                "type": "none",
                "interval": 1
            },
            "reminders": [
                {"minutes_before": 15},
                {"minutes_before": 30}
            ]
        }

        created_event = self.create_test_event(event_data)
        
        if created_event:
            # Verify all fields are correct
            success = (
                created_event.get("title") == event_data["title"] and
                created_event.get("event_type") == event_data["event_type"] and
                created_event.get("color") == event_data["color"] and
                created_event.get("icon") == event_data["icon"] and
                created_event.get("_id") is not None
            )
            self.log_result("Create Simple Event", success, 
                          f"Event ID: {created_event.get('_id')}, Title: {created_event.get('title')}")
        else:
            self.log_result("Create Simple Event", False, error="Failed to create event")

    def test_create_recurring_event(self):
        """Test POST /api/events - Create a recurring birthday event"""
        print("🔄 Testing Create Recurring Event...")
        
        # Test recurring birthday event as specified
        event_data = {
            "title": "Mom's Birthday",
            "description": "Annual birthday celebration",
            "start_date": datetime.now().replace(month=6, day=15, hour=0, minute=0, second=0, microsecond=0).isoformat(),
            "all_day": True,
            "event_type": "birthday",
            "color": "#FFB6C6",
            "icon": "cake",
            "recurrence": {
                "type": "yearly",
                "interval": 1,
                "end_date": (datetime.now() + timedelta(days=365*5)).isoformat()  # 5 years
            },
            "reminders": [
                {"minutes_before": 1440},  # 1 day before
                {"minutes_before": 10080}  # 1 week before
            ]
        }

        created_event = self.create_test_event(event_data)
        
        if created_event:
            success = (
                created_event.get("title") == event_data["title"] and
                created_event.get("event_type") == event_data["event_type"] and
                created_event.get("recurrence", {}).get("type") == "yearly" and
                created_event.get("all_day") == True
            )
            self.log_result("Create Recurring Event", success, 
                          f"Yearly recurring birthday event created with ID: {created_event.get('_id')}")
        else:
            self.log_result("Create Recurring Event", False, error="Failed to create recurring event")

    def test_get_events_with_date_range(self):
        """Test GET /api/events with date range - Fetch events for next 2 months"""
        print("🔄 Testing Get Events with Date Range...")
        
        start_date = datetime.now().isoformat()
        end_date = (datetime.now() + timedelta(days=60)).isoformat()
        
        try:
            response = requests.get(f"{self.backend_url}/events", 
                                  params={"start_date": start_date, "end_date": end_date},
                                  timeout=10)
            
            if response.status_code == 200:
                events = response.json()
                self.log_result("Get Events with Date Range", True, 
                              f"Retrieved {len(events)} events for next 2 months")
                
                # Check if any recurring events were expanded
                recurring_instances = [e for e in events if e.get("is_recurring_instance")]
                if recurring_instances:
                    self.log_result("Recurring Event Expansion", True, 
                                  f"Found {len(recurring_instances)} recurring event instances")
                
            else:
                self.log_result("Get Events with Date Range", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Get Events with Date Range", False, error=str(e))

    def test_get_events_for_specific_day(self):
        """Test GET /api/events/day/{date} - Get events for today"""
        print("🔄 Testing Get Events for Specific Day...")
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        try:
            response = requests.get(f"{self.backend_url}/events/day/{today}", timeout=10)
            
            if response.status_code == 200:
                events = response.json()
                self.log_result("Get Events for Specific Day", True, 
                              f"Retrieved {len(events)} events for today ({today})")
            else:
                self.log_result("Get Events for Specific Day", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Get Events for Specific Day", False, error=str(e))

    def test_get_single_event(self):
        """Test GET /api/events/{id} - Get single event"""
        print("🔄 Testing Get Single Event...")
        
        if not self.created_events:
            self.log_result("Get Single Event", False, error="No events created to test with")
            return
        
        event_id = self.created_events[0]
        
        try:
            response = requests.get(f"{self.backend_url}/events/{event_id}", timeout=10)
            
            if response.status_code == 200:
                event = response.json()
                success = (
                    event.get("_id") == event_id and
                    event.get("title") is not None and
                    event.get("event_type") is not None
                )
                self.log_result("Get Single Event", success, 
                              f"Retrieved event: {event.get('title')} (ID: {event_id})")
            else:
                self.log_result("Get Single Event", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Get Single Event", False, error=str(e))

    def test_update_event(self):
        """Test PUT /api/events/{id} - Update event"""
        print("🔄 Testing Update Event...")
        
        if not self.created_events:
            self.log_result("Update Event", False, error="No events created to test with")
            return
        
        event_id = self.created_events[0]
        
        update_data = {
            "title": "Updated Team Standup - Important",
            "description": "Updated description with more details about the meeting agenda"
        }
        
        try:
            response = requests.put(f"{self.backend_url}/events/{event_id}", 
                                  json=update_data,
                                  headers={"Content-Type": "application/json"},
                                  timeout=10)
            
            if response.status_code == 200:
                updated_event = response.json()
                success = (
                    updated_event.get("title") == update_data["title"] and
                    updated_event.get("description") == update_data["description"] and
                    updated_event.get("updated_at") is not None
                )
                self.log_result("Update Event", success, 
                              f"Updated event title to: '{updated_event.get('title')}'")
            else:
                self.log_result("Update Event", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Update Event", False, error=str(e))

    def test_delete_event(self):
        """Test DELETE /api/events/{id} - Delete event"""
        print("🔄 Testing Delete Event...")
        
        if not self.created_events:
            self.log_result("Delete Event", False, error="No events created to test with")
            return
        
        # Use the last created event for deletion
        event_id = self.created_events[-1]
        
        try:
            response = requests.delete(f"{self.backend_url}/events/{event_id}", timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                # Verify event was deleted by trying to fetch it
                get_response = requests.get(f"{self.backend_url}/events/{event_id}", timeout=10)
                
                success = get_response.status_code == 404
                self.log_result("Delete Event", success, 
                              f"Event deleted: {result.get('message', 'Success')}")
                
                # Remove from tracking list
                if event_id in self.created_events:
                    self.created_events.remove(event_id)
                    
            else:
                self.log_result("Delete Event", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Delete Event", False, error=str(e))

    def test_recurring_event_types(self):
        """Test different recurring event types (daily, weekly, monthly, yearly)"""
        print("🔄 Testing Different Recurring Event Types...")
        
        recurring_types = [
            ("daily", "Daily Exercise", "personal"),
            ("weekly", "Team Meeting", "meeting"),
            ("monthly", "Monthly Review", "meeting"),
            ("yearly", "Anniversary", "social")
        ]
        
        for recurrence_type, title, event_type in recurring_types:
            event_data = {
                "title": title,
                "description": f"Test {recurrence_type} recurring event",
                "start_date": (datetime.now() + timedelta(days=1)).replace(hour=14, minute=0, second=0, microsecond=0).isoformat(),
                "end_date": (datetime.now() + timedelta(days=1)).replace(hour=15, minute=0, second=0, microsecond=0).isoformat(),
                "all_day": False,
                "event_type": event_type,
                "color": "#E6D5F5",
                "icon": "calendar",
                "recurrence": {
                    "type": recurrence_type,
                    "interval": 1,
                    "end_date": (datetime.now() + timedelta(days=90)).isoformat()
                },
                "reminders": [{"minutes_before": 30}]
            }
            
            created_event = self.create_test_event(event_data)
            
            if created_event:
                success = created_event.get("recurrence", {}).get("type") == recurrence_type
                self.log_result(f"Create {recurrence_type.capitalize()} Recurring Event", success, 
                              f"Created {recurrence_type} recurring event: {title}")

    def test_invalid_requests(self):
        """Test error handling with invalid requests"""
        print("🔄 Testing Error Handling...")
        
        # Test invalid event ID
        try:
            response = requests.get(f"{self.backend_url}/events/invalid_id", timeout=10)
            success = response.status_code == 400
            self.log_result("Invalid Event ID Handling", success, 
                          f"Correctly returned status {response.status_code} for invalid ID")
        except Exception as e:
            self.log_result("Invalid Event ID Handling", False, error=str(e))
        
        # Test non-existent event ID
        try:
            response = requests.get(f"{self.backend_url}/events/507f1f77bcf86cd799439011", timeout=10)
            success = response.status_code == 404
            self.log_result("Non-existent Event Handling", success, 
                          f"Correctly returned status {response.status_code} for non-existent event")
        except Exception as e:
            self.log_result("Non-existent Event Handling", False, error=str(e))

    def cleanup(self):
        """Clean up created events"""
        print("🧹 Cleaning up test data...")
        deleted_count = 0
        for event_id in self.created_events:
            try:
                response = requests.delete(f"{self.backend_url}/events/{event_id}", timeout=10)
                if response.status_code == 200:
                    deleted_count += 1
            except:
                pass
        
        if deleted_count > 0:
            print(f"🗑️  Cleaned up {deleted_count} test events")

    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting Bridgerton Calendar API Test Suite")
        print("=" * 60)
        
        # Test API availability first
        if not self.test_api_health():
            print("❌ API is not accessible. Cannot proceed with tests.")
            return
        
        # Run all tests
        self.test_create_simple_event()
        self.test_create_recurring_event()
        self.test_get_events_with_date_range()
        self.test_get_events_for_specific_day()
        self.test_get_single_event()
        self.test_update_event()
        self.test_delete_event()
        self.test_recurring_event_types()
        self.test_invalid_requests()
        
        # Cleanup
        self.cleanup()
        
        # Print summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        print(f"📋 Total: {self.test_results['passed'] + self.test_results['failed']}")
        
        if self.test_results['errors']:
            print("\n🚨 ERRORS:")
            for error in self.test_results['errors']:
                print(f"   • {error}")
        
        print("=" * 60)
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = BridgertonCalendarAPITest()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)