import json
import asyncio
from typing import List
from datetime import datetime
from .models import DataItem

class IngestionService:
    def __init__(self):
        self.data_store: List[DataItem] = []
        
    def load_mock_data(self):
        """Loads mock data from JSON files."""
        try:
            with open("data/social_media.json", "r") as f:
                social_data = json.load(f)
                for item in social_data:
                    self.data_store.append(DataItem(**item))
            
            with open("data/cctv_logs.json", "r") as f:
                cctv_data = json.load(f)
                for item in cctv_data:
                    self.data_store.append(DataItem(**item))
                    
            print(f"Loaded {len(self.data_store)} items.")
        except Exception as e:
            print(f"Error loading data: {e}")

    def get_all_data(self) -> List[DataItem]:
        return self.data_store

    def add_data(self, item: DataItem):
        self.data_store.append(item)

ingestion_service = IngestionService()
