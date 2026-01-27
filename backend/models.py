from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class DataItem(BaseModel):
    id: str
    source: str  # 'social_media', 'cctv', 'police', 'emergency'
    timestamp: datetime
    content: str
    location: Optional[str] = None
    geo: Optional[Dict[str, float]] = None  # {'lat': 0.0, 'lng': 0.0}
    metadata: Optional[Dict] = {}
    
    # AI Enrichment fields
    entities: List[Dict] = []  # [{'text': 'John', 'label': 'PERSON'}]
    topics: List[str] = []
    risk_score: float = 0.0

class Alert(BaseModel):
    id: str
    severity: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    title: str
    description: str
    timestamp: datetime
    related_items: List[str] = []

class AgencyAlertRequest(BaseModel):
    agency_id: str
    intensity: str
    message: str
