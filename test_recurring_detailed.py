#!/usr/bin/env python3
"""
Specific test to validate recurring event expansion logic
"""

import requests
import json
from datetime import datetime, timedelta

BACKEND_URL = "https://period-planner-7.preview.emergentagent.com/api"

def test_recurring_expansion_detailed():
    """Test the exact behavior of recurring event expansion"""
    print("🔄 Testing Recurring Event Expansion - Detailed Analysis")
    
    # Create a daily recurring event starting tomorrow
    tomorrow = datetime.now() + timedelta(days=1)
    start_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)
    
    event_data = {
        "title": "Daily Standup",
        "description": "Daily team standup meeting",
        "start_date": start_time.isoformat(),
        "end_date": (start_time + timedelta(hours=1)).isoformat(),
        "all_day": False,
        "event_type": "meeting",
        "color": "#9B7EBD", 
        "icon": "briefcase",
        "recurrence": {
            "type": "daily",
            "interval": 1,
            "end_date": (start_time + timedelta(days=5)).isoformat()
        },
        "reminders": []
    }
    
    # Create the recurring event
    response = requests.post(f"{BACKEND_URL}/events", 
                           json=event_data,
                           headers={"Content-Type": "application/json"},
                           timeout=10)
    
    if response.status_code != 200:
        print(f"❌ Failed to create recurring event: {response.text}")
        return
        
    created_event = response.json()
    event_id = created_event.get("_id")
    print(f"✅ Created daily recurring event: {event_id}")
    print(f"   📅 Original start: {created_event.get('start_date')}")
    print(f"   🔁 Recurrence type: {created_event.get('recurrence', {}).get('type')}")
    
    # Fetch events with date range to trigger expansion
    query_start = start_time.isoformat()
    query_end = (start_time + timedelta(days=7)).isoformat()
    
    response = requests.get(f"{BACKEND_URL}/events",
                          params={"start_date": query_start, "end_date": query_end},
                          timeout=10)
    
    if response.status_code == 200:
        events = response.json()
        
        # Filter events related to our recurring event
        standup_events = [e for e in events if "Daily Standup" in e.get("title", "")]
        
        print(f"\n📊 Found {len(standup_events)} occurrences:")
        for i, event in enumerate(standup_events):
            start_dt = datetime.fromisoformat(event.get("start_date").replace('Z', '+00:00'))
            is_recurring = event.get("is_recurring_instance", False)
            original_id = event.get("original_event_id")
            event_id_display = event.get("_id")
            
            print(f"   {i+1}. {start_dt.strftime('%Y-%m-%d %H:%M')}")
            print(f"      🆔 Event ID: {event_id_display}")
            print(f"      🔁 Is recurring instance: {is_recurring}")
            if original_id:
                print(f"      📌 Original event ID: {original_id}")
            print()
            
        # Validate the expansion logic
        recurring_instances = [e for e in standup_events if e.get("is_recurring_instance")]
        print(f"✅ Recurring instances found: {len(recurring_instances)}")
        print(f"✅ Total occurrences (including original): {len(standup_events)}")
        
        # Verify dates are correct (daily interval)
        if len(standup_events) > 1:
            dates = []
            for event in standup_events:
                start_dt = datetime.fromisoformat(event.get("start_date").replace('Z', '+00:00'))
                dates.append(start_dt.date())
            
            dates.sort()
            consecutive_days = all(
                (dates[i+1] - dates[i]).days == 1 
                for i in range(len(dates)-1)
            )
            print(f"✅ Consecutive daily events: {consecutive_days}")
    else:
        print(f"❌ Failed to fetch events: {response.text}")
    
    # Clean up
    try:
        requests.delete(f"{BACKEND_URL}/events/{event_id}", timeout=10)
        print(f"🗑️ Cleaned up test event: {event_id}")
    except:
        pass

if __name__ == "__main__":
    test_recurring_expansion_detailed()