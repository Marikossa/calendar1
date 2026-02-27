#!/usr/bin/env python3
"""
Additional focused tests for specific Bridgerton Calendar API requirements
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Any

BACKEND_URL = "https://period-planner-7.preview.emergentagent.com/api"

def test_recurring_event_expansion():
    """Detailed test of recurring event expansion logic"""
    print("🔄 Testing Recurring Event Expansion Logic in Detail...")
    
    # Create a weekly recurring event
    event_data = {
        "title": "Weekly Team Sync",
        "description": "Weekly team synchronization meeting",
        "start_date": datetime.now().replace(hour=9, minute=0, second=0, microsecond=0).isoformat(),
        "end_date": datetime.now().replace(hour=10, minute=0, second=0, microsecond=0).isoformat(),
        "all_day": False,
        "event_type": "meeting",
        "color": "#9B7EBD",
        "icon": "briefcase",
        "recurrence": {
            "type": "weekly",
            "interval": 1,
            "end_date": (datetime.now() + timedelta(days=28)).isoformat()  # 4 weeks
        },
        "reminders": [{"minutes_before": 15}]
    }
    
    # Create the recurring event
    response = requests.post(f"{BACKEND_URL}/events", 
                           json=event_data, 
                           headers={"Content-Type": "application/json"},
                           timeout=10)
    
    if response.status_code != 200:
        print(f"❌ Failed to create weekly recurring event: {response.text}")
        return
    
    created_event = response.json()
    event_id = created_event.get("_id")
    print(f"✅ Created weekly recurring event: {created_event.get('title')} (ID: {event_id})")
    
    # Test fetching with date range to see expanded occurrences
    start_date = datetime.now().isoformat()
    end_date = (datetime.now() + timedelta(days=35)).isoformat()
    
    response = requests.get(f"{BACKEND_URL}/events", 
                          params={"start_date": start_date, "end_date": end_date},
                          timeout=10)
    
    if response.status_code == 200:
        events = response.json()
        
        # Find events related to our recurring event
        related_events = [e for e in events if 
                         e.get("title") == "Weekly Team Sync" or 
                         e.get("original_event_id") == event_id]
        
        print(f"📅 Found {len(related_events)} occurrences of weekly recurring event")
        
        # Verify recurring instances
        recurring_instances = [e for e in related_events if e.get("is_recurring_instance")]
        print(f"🔁 Found {len(recurring_instances)} recurring instances")
        
        # Show the dates of occurrences
        for i, event in enumerate(related_events):
            start_dt = datetime.fromisoformat(event.get("start_date").replace('Z', '+00:00'))
            is_instance = "📍 Original" if not event.get("is_recurring_instance") else "🔄 Instance"
            print(f"   {is_instance}: {start_dt.strftime('%Y-%m-%d %H:%M')}")
    
    # Cleanup
    requests.delete(f"{BACKEND_URL}/events/{event_id}", timeout=10)

def test_event_types_and_colors():
    """Test different event types with their colors and icons"""
    print("\n🎨 Testing Different Event Types and Colors...")
    
    event_types_config = [
        ("meeting", "#9B7EBD", "briefcase"),
        ("birthday", "#FFB6C6", "cake"), 
        ("appointment", "#D5E8F5", "calendar"),
        ("social", "#E6D5F5", "users"),
        ("personal", "#FFE5EC", "heart"),
        ("other", "#F0F8E8", "star")
    ]
    
    created_events = []
    
    for event_type, color, icon in event_types_config:
        event_data = {
            "title": f"Test {event_type.title()} Event",
            "description": f"Testing {event_type} event type",
            "start_date": (datetime.now() + timedelta(hours=1)).isoformat(),
            "end_date": (datetime.now() + timedelta(hours=2)).isoformat(),
            "all_day": False,
            "event_type": event_type,
            "color": color,
            "icon": icon,
            "recurrence": {"type": "none"},
            "reminders": []
        }
        
        response = requests.post(f"{BACKEND_URL}/events", 
                               json=event_data, 
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        if response.status_code == 200:
            created_event = response.json()
            created_events.append(created_event.get("_id"))
            print(f"✅ Created {event_type} event with color {color} and icon {icon}")
        else:
            print(f"❌ Failed to create {event_type} event: {response.text}")
    
    # Cleanup all created events
    for event_id in created_events:
        requests.delete(f"{BACKEND_URL}/events/{event_id}", timeout=10)

def test_reminder_functionality():
    """Test reminder creation and storage"""
    print("\n⏰ Testing Reminder Functionality...")
    
    event_data = {
        "title": "Event with Multiple Reminders",
        "description": "Testing reminder functionality",
        "start_date": (datetime.now() + timedelta(days=1)).isoformat(),
        "all_day": False,
        "event_type": "meeting",
        "color": "#9B7EBD",
        "icon": "bell",
        "recurrence": {"type": "none"},
        "reminders": [
            {"minutes_before": 5},      # 5 minutes before
            {"minutes_before": 15},     # 15 minutes before
            {"minutes_before": 60},     # 1 hour before
            {"minutes_before": 1440}    # 1 day before
        ]
    }
    
    response = requests.post(f"{BACKEND_URL}/events", 
                           json=event_data, 
                           headers={"Content-Type": "application/json"},
                           timeout=10)
    
    if response.status_code == 200:
        created_event = response.json()
        reminders = created_event.get("reminders", [])
        
        print(f"✅ Created event with {len(reminders)} reminders:")
        for reminder in reminders:
            minutes = reminder.get("minutes_before")
            if minutes < 60:
                time_str = f"{minutes} minutes"
            elif minutes < 1440:
                time_str = f"{minutes // 60} hours"
            else:
                time_str = f"{minutes // 1440} days"
            print(f"   📢 Reminder: {time_str} before event")
        
        # Cleanup
        requests.delete(f"{BACKEND_URL}/events/{created_event.get('_id')}", timeout=10)
    else:
        print(f"❌ Failed to create event with reminders: {response.text}")

def test_date_filtering_accuracy():
    """Test the accuracy of date range filtering"""
    print("\n📅 Testing Date Range Filtering Accuracy...")
    
    # Create events at different dates
    test_events = []
    base_date = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    
    # Past event (should not appear in future range)
    past_event = {
        "title": "Past Event",
        "start_date": (base_date - timedelta(days=5)).isoformat(),
        "event_type": "meeting",
        "color": "#9B7EBD",
        "icon": "clock",
        "recurrence": {"type": "none"},
        "reminders": []
    }
    
    # Current/today event
    today_event = {
        "title": "Today Event",
        "start_date": base_date.isoformat(),
        "event_type": "personal",
        "color": "#FFE5EC",
        "icon": "calendar",
        "recurrence": {"type": "none"},
        "reminders": []
    }
    
    # Future event
    future_event = {
        "title": "Future Event",
        "start_date": (base_date + timedelta(days=10)).isoformat(),
        "event_type": "social",
        "color": "#E6D5F5",
        "icon": "star",
        "recurrence": {"type": "none"},
        "reminders": []
    }
    
    # Create all test events
    for event_data in [past_event, today_event, future_event]:
        response = requests.post(f"{BACKEND_URL}/events", 
                               json=event_data, 
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        if response.status_code == 200:
            test_events.append(response.json().get("_id"))
    
    # Test filtering - get only future events (next 15 days)
    start_date = base_date.isoformat()
    end_date = (base_date + timedelta(days=15)).isoformat()
    
    response = requests.get(f"{BACKEND_URL}/events", 
                          params={"start_date": start_date, "end_date": end_date},
                          timeout=10)
    
    if response.status_code == 200:
        events = response.json()
        event_titles = [e.get("title") for e in events]
        
        print(f"📊 Date range query returned {len(events)} events:")
        for title in event_titles:
            print(f"   📝 {title}")
        
        # Verify filtering worked correctly
        has_past = "Past Event" in event_titles
        has_today = "Today Event" in event_titles  
        has_future = "Future Event" in event_titles
        
        print(f"✅ Past event excluded: {not has_past}")
        print(f"✅ Today event included: {has_today}")
        print(f"✅ Future event included: {has_future}")
    
    # Cleanup all test events
    for event_id in test_events:
        requests.delete(f"{BACKEND_URL}/events/{event_id}", timeout=10)

if __name__ == "__main__":
    print("🚀 Starting Additional Bridgerton Calendar API Tests")
    print("=" * 60)
    
    test_recurring_event_expansion()
    test_event_types_and_colors()
    test_reminder_functionality()
    test_date_filtering_accuracy()
    
    print("\n" + "=" * 60)
    print("✅ Additional testing complete!")