from datetime import datetime
from typing import List, Dict, Optional

class GoogleCalendarClient:
    """
    MCP Tool for Google Calendar.
    - Connects to Google API (if credentials exist).
    - Falls back to In-Memory Mock (for MVP/Dev).
    """
    def __init__(self):
        self.mock_mode = True  # Default to Mock for MVP Safety

    async def get_busy_slots(self, email: str, start_dt: datetime, end_dt: datetime) -> List[Dict]:
        """
        Returns list of busy time ranges: [{'start': dt, 'end': dt}]
        """
        if self.mock_mode:
            # Return some fake busy slots for testing "Conflict Resolution"
            mock_busy = []
            
            # Simulate a Lunch Break (13:00 - 14:00)
            lunch_start = start_dt.replace(hour=13, minute=0, second=0)
            lunch_end = start_dt.replace(hour=14, minute=0, second=0)
            
            if start_dt <= lunch_start < end_dt:
                mock_busy.append({
                    "start": lunch_start,
                    "end": lunch_end,
                    "summary": "Lunch Break (GCal)"
                })
            
            return mock_busy
        
        # Real API logic would go here
        return []

    async def create_event(self, email: str, start_dt: datetime, end_dt: datetime, summary: str) -> Optional[str]:
        """
        Creates an event and returns the Event ID.
        """
        if self.mock_mode:
            event_id = f"gcal_mock_{int(datetime.now().timestamp())}"
            print(f"[GOOGLE CALENDAR] Created Mock Event: {summary} | {start_dt} - {end_dt}")
            return event_id
        
        return None

# Singleton Instance
calendar_tool = GoogleCalendarClient()