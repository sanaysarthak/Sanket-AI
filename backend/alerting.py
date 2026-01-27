from typing import List
from datetime import datetime
from .models import DataItem, Alert

class AlertingEngine:
    def __init__(self):
        self.alerts: List[Alert] = []

    def check_rules(self, items: List[DataItem]) -> List[Alert]:
        """Checks rules against new data items and generates alerts."""
        new_alerts = []
        
        # Rule 1: High Crowd Density + Protest Keyword
        protest_items = [i for i in items if "Protest" in i.topics]
        high_density_items = [i for i in items if i.source == "cctv" and i.metadata.get("density", 0) > 80]
        
        if protest_items and high_density_items:
            alert = Alert(
                id=f"alert_{len(self.alerts) + 1}",
                severity="HIGH",
                title="Potential Riot Risk",
                description=f"High crowd density detected at {high_density_items[0].location} coinciding with protest mentions.",
                timestamp=datetime.now(),
                related_items=[i.id for i in protest_items + high_density_items]
            )
            self.alerts.append(alert)
            new_alerts.append(alert)

        # Rule 2: Multiple Emergency Calls in same area (Mock logic)
        # ... (Add more rules here)
        
        return new_alerts

    def get_alerts(self) -> List[Alert]:
        return self.alerts

alerting_engine = AlertingEngine()
