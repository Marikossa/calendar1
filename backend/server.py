from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper to convert ObjectId to string
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

# Define Models
class RecurrenceRule(BaseModel):
    type: str  # 'none', 'daily', 'weekly', 'monthly', 'yearly'
    interval: int = 1  # Every X days/weeks/months/years
    end_date: Optional[str] = None
    days_of_week: Optional[List[int]] = None  # For weekly: 0=Mon, 6=Sun

class Reminder(BaseModel):
    minutes_before: int
    notification_id: Optional[str] = None

class Event(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: Optional[str] = None
    start_date: str  # ISO format
    end_date: Optional[str] = None
    all_day: bool = False
    event_type: str  # 'meeting', 'birthday', 'appointment', 'social', 'personal', 'other'
    color: str
    icon: str
    recurrence: Optional[RecurrenceRule] = None
    reminders: List[Reminder] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    all_day: bool = False
    event_type: str
    color: str
    icon: str
    recurrence: Optional[RecurrenceRule] = None
    reminders: List[Reminder] = []

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    all_day: Optional[bool] = None
    event_type: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    recurrence: Optional[RecurrenceRule] = None
    reminders: Optional[List[Reminder]] = None

# Utility functions
def event_helper(event) -> dict:
    result = {
        "_id": str(event["_id"]),
        "title": event["title"],
        "description": event.get("description"),
        "start_date": event["start_date"],
        "end_date": event.get("end_date"),
        "all_day": event.get("all_day", False),
        "event_type": event["event_type"],
        "color": event["color"],
        "icon": event["icon"],
        "recurrence": event.get("recurrence"),
        "reminders": event.get("reminders", []),
        "created_at": event.get("created_at"),
        "updated_at": event.get("updated_at"),
        "is_recurring_instance": event.get("is_recurring_instance", False),
        "original_event_id": event.get("original_event_id"),
    }
    
    # Debug: Log when we have recurring instance data
    if event.get("is_recurring_instance"):
        print(f"DEBUG: Processing recurring instance for event {event.get('_id')}")
    
    return result

def expand_recurring_events(event: dict, start_date: datetime, end_date: datetime) -> List[dict]:
    """Expand a recurring event into individual occurrences within the date range"""
    print(f"DEBUG: Expanding event {event.get('_id')} with recurrence {event.get('recurrence')}")
    
    if not event.get("recurrence") or event["recurrence"].get("type") == "none":
        print("DEBUG: No recurrence, returning original event")
        return [event]
    
    recurrence = event["recurrence"]
    event_start = datetime.fromisoformat(event["start_date"].replace('Z', '+00:00'))
    
    # Determine recurrence rule
    freq_map = {
        "daily": DAILY,
        "weekly": WEEKLY,
        "monthly": MONTHLY,
        "yearly": YEARLY
    }
    
    freq = freq_map.get(recurrence["type"])
    if not freq:
        print(f"DEBUG: Unknown frequency {recurrence['type']}")
        return [event]
    
    # Set up rrule parameters
    rrule_params = {
        "freq": freq,
        "dtstart": event_start,
        "interval": recurrence.get("interval", 1)
    }
    
    # Add end date if specified
    if recurrence.get("end_date"):
        rrule_params["until"] = datetime.fromisoformat(recurrence["end_date"].replace('Z', '+00:00'))
    else:
        # Limit to end_date of query
        rrule_params["until"] = end_date
    
    # Add days of week for weekly recurrence
    if recurrence["type"] == "weekly" and recurrence.get("days_of_week"):
        rrule_params["byweekday"] = recurrence["days_of_week"]
    
    print(f"DEBUG: rrule params: {rrule_params}")
    
    # Generate occurrences
    occurrences = []
    first_occurrence = True
    for occurrence_date in rrule(**rrule_params):
        print(f"DEBUG: Processing occurrence at {occurrence_date}")
        if start_date <= occurrence_date <= end_date:
            occurrence_event = event.copy()
            # Calculate duration
            if event.get("end_date"):
                original_end = datetime.fromisoformat(event["end_date"].replace('Z', '+00:00'))
                duration = original_end - event_start
                new_end = occurrence_date + duration
                occurrence_event["end_date"] = new_end.isoformat()
            
            occurrence_event["start_date"] = occurrence_date.isoformat()
            
            # First occurrence is the original event, subsequent ones are recurring instances
            if first_occurrence:
                occurrence_event["is_recurring_instance"] = False
                print(f"DEBUG: First occurrence (original) at {occurrence_date}")
                first_occurrence = False
            else:
                occurrence_event["is_recurring_instance"] = True
                occurrence_event["original_event_id"] = str(event["_id"])
                print(f"DEBUG: Recurring instance at {occurrence_date}")
            
            occurrences.append(occurrence_event)
    
    print(f"DEBUG: Generated {len(occurrences)} occurrences")
    return occurrences

# Routes
@api_router.get("/")
async def root():
    return {"message": "Bridgerton Calendar API"}

@api_router.post("/events", response_model=Event)
async def create_event(event: EventCreate):
    event_dict = event.dict()
    event_dict["created_at"] = datetime.utcnow().isoformat()
    event_dict["updated_at"] = datetime.utcnow().isoformat()
    
    result = await db.events.insert_one(event_dict)
    new_event = await db.events.find_one({"_id": result.inserted_id})
    return event_helper(new_event)

@api_router.get("/events", response_model=List[Event])
async def get_events(start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    
    if start_date and end_date:
        # Get events that overlap with the date range
        query["start_date"] = {"$lte": end_date}
        # For events without end_date, use start_date for comparison
        # For events with end_date, use end_date for comparison
    
    events = await db.events.find(query).to_list(1000)
    
    # If date range specified, expand recurring events
    if start_date and end_date:
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        expanded_events = []
        for event in events:
            occurrences = expand_recurring_events(event, start_dt, end_dt)
            expanded_events.extend(occurrences)
        
        return [event_helper(event) for event in expanded_events]
    
    return [event_helper(event) for event in events]

@api_router.get("/events/day/{date}")
async def get_events_for_day(date: str):
    """Get all events for a specific day"""
    # Parse the date
    day_start = datetime.fromisoformat(date.replace('Z', '+00:00')).replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)
    
    # Query events that fall on this day
    events = await db.events.find().to_list(1000)
    
    day_events = []
    for event in events:
        event_start = datetime.fromisoformat(event["start_date"].replace('Z', '+00:00'))
        event_end = event_start
        
        if event.get("end_date"):
            event_end = datetime.fromisoformat(event["end_date"].replace('Z', '+00:00'))
        
        # Check if event overlaps with this day
        if event_start.date() == day_start.date() or (event_end.date() >= day_start.date() and event_start.date() <= day_start.date()):
            # Expand recurring events
            occurrences = expand_recurring_events(event, day_start, day_end)
            day_events.extend(occurrences)
    
    return [event_helper(event) for event in day_events]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return event_helper(event)

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_update: EventUpdate):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    update_data = {k: v for k, v in event_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = await db.events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    updated_event = await db.events.find_one({"_id": ObjectId(event_id)})
    return event_helper(updated_event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    result = await db.events.delete_one({"_id": ObjectId(event_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Event deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
