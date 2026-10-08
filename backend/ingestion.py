import csv
import json
import asyncio
import os
from typing import List, Callable
from datetime import date, datetime, time as dtime
from .models import DataItem

DATA_RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")


def _parse_csv_time(value: str) -> datetime:
    """CSV timestamps are time-of-day only (HH:MM:SS); anchor them to today."""
    try:
        return datetime.combine(date.today(), dtime.fromisoformat(value))
    except (ValueError, TypeError):
        return datetime.now()


class IngestionService:
    def __init__(self):
        self.data_store: List[DataItem] = []

    def load_mock_data(self):
        """
        Loads mock data from data/social_media.json and data/cctv_logs.json.
        Those files are developer-local and gitignored, so on a fresh checkout
        (e.g. a new deployment) they won't exist. In that case, fall back to
        generating the same shape of data from the bundled CSV samples in
        data/raw/ so the live feed is never empty.
        """
        self._load_source("data/social_media.json", self._load_social_media_from_csv)
        self._load_source("data/cctv_logs.json", self._load_cctv_from_csv)
        print(f"Loaded {len(self.data_store)} items.")

    def _load_source(self, json_path: str, csv_fallback: Callable[[], List[DataItem]]):
        try:
            with open(json_path, "r") as f:
                items = json.load(f)
            for item in items:
                self.data_store.append(DataItem(**item))
        except FileNotFoundError:
            try:
                self.data_store.extend(csv_fallback())
            except Exception as e:
                print(f"Error building fallback data from CSV for {json_path}: {e}")
        except Exception as e:
            print(f"Error loading {json_path}: {e}")

    def _load_social_media_from_csv(self) -> List[DataItem]:
        path = os.path.join(DATA_RAW_DIR, "jaipur_social_media_500.csv")
        items = []
        with open(path, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                lat, lng = row.get("latitude"), row.get("longitude")
                items.append(DataItem(
                    id=row["post_id"],
                    source="social_media",
                    timestamp=_parse_csv_time(row.get("timestamp")),
                    content=f"{row.get('username', 'unknown')}: {row.get('post_text', '')}",
                    location=row.get("location") or None,
                    geo={"lat": float(lat), "lng": float(lng)} if lat and lng else None,
                    metadata={
                        "platform": row.get("platform"),
                        "detected_topic": row.get("detected_topic"),
                        "sentiment_score": row.get("sentiment_score"),
                        "is_misinformation": row.get("is_misinformation"),
                        "engagement_count": row.get("engagement_count"),
                    },
                ))
        return items

    def _load_cctv_from_csv(self) -> List[DataItem]:
        path = os.path.join(DATA_RAW_DIR, "jaipur_cctv_metadata_500.csv")
        items = []
        with open(path, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                event = (row.get("event_type") or "unknown_event").replace("_", " ").title()
                obj = row.get("object_detected") or "unknown object"
                items.append(DataItem(
                    id=f"{row['camera_id']}_{row.get('timestamp', '').replace(':', '')}",
                    source="cctv",
                    timestamp=_parse_csv_time(row.get("timestamp")),
                    content=f"{event} - {obj} detected",
                    location=row.get("location") or None,
                    metadata={
                        "zone": row.get("zone"),
                        "crowd_density": row.get("crowd_density"),
                        "movement_pattern": row.get("movement_pattern"),
                        "severity_level": row.get("severity_level"),
                        "confidence": row.get("confidence"),
                    },
                ))
        return items

    def get_all_data(self) -> List[DataItem]:
        return self.data_store

    def add_data(self, item: DataItem):
        self.data_store.append(item)

ingestion_service = IngestionService()
