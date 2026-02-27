#!/usr/bin/env python3
"""
Debug test to understand recurring event expansion
"""

import requests
from datetime import datetime, timedelta

BACKEND_URL = "https://period-planner-7.preview.emergentagent.com/api"

def debug_recurring_expansion():
    """Debug recurring event expansion logic"""
    print("🔍 Debug: Recurring Event Expansion")
    
    # Create a simple daily recurring event
    event_data = {
        "title": "Debug Daily Event",
        "start_date": (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0).isoformat(),
        "end_date": (datetime.now() + timedelta(days=1)).replace(hour=11, minute=0, second=0, microsecond=0).isoformat(),
        "all_day": False,
        "event_type": "meeting",
        "color": "#9B7EBD",
        "icon": "briefcase",
        "recurrence": {
            "type": "daily",
            "interval": 1,
            "end_date": (datetime.now() + timedelta(days=3)).isoformat()
        },
        "reminders": []
    }
    
    # Create event
    response = requests.post(f"{BACKEND_URL}/events", json=event_data, timeout=10)
    if response.status_code != 200:
        print(f"❌ Failed to create event: {response.text}")
        return
    
    created_event = response.json()
    event_id = created_event.get("_id")
    print(f"✅ Created event: {event_id}")
    
    # Get events with expansion
    start_date = datetime.now().isoformat()
    end_date = (datetime.now() + timedelta(days=5)).isoformat()
    
    response = requests.get(f"{BACKEND_URL}/events", 
                          params={"start_date": start_date, "end_date": end_date},
                          timeout=10)
    
    if response.status_code == 200:
        events = response.json()
        debug_events = [e for e in events if "Debug Daily Event" in e.get("title", "")]
        
        print(f"\n🔍 Raw response data for {len(debug_events)} events:")
        for i, event in enumerate(debug_events):
            print(f"\nEvent {i+1}:")
            print(f"   _id: {event.get('_id')}")
            print(f"   title: {event.get('title')}")
            print(f"   start_date: {event.get('start_date')}")
            print(f"   is_recurring_instance: {event.get('is_recurring_instance', 'KEY_NOT_FOUND')}")
            print(f"   original_event_id: {event.get('original_event_id', 'KEY_NOT_FOUND')}")
            print(f"   ALL KEYS: {list(event.keys())}")
    else:
        print(f"❌ Failed to fetch events: {response.text}")
    
    # Cleanup
    try:
        requests.delete(f"{BACKEND_URL}/events/{event_id}", timeout=10)
    except:
        pass

if __name__ == "__main__":
    debug_recurring_expansion()