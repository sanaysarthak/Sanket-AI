import networkx as nx
from typing import List, Dict, Tuple
from .models import DataItem
import random

class AIEngine:
    def __init__(self):
        # MOCK: No spaCy loading
        print("AI Engine initialized (MOCK MODE due to Python 3.14)")
        self.graph = nx.Graph()

    def extract_entities(self, text: str) -> List[Dict]:
        """
        MOCK: Extracts dummy entities based on simple keyword matching
        to simulate NER without spaCy.
        """
        entities = []
        text_lower = text.lower()
        
        # Mock Entity Database
        mock_people = ["Amit", "Rahul", "Priya", "Suresh", "Police"]
        mock_locs = ["Jaipur", "Ajmeri Gate", "Malviya Nagar", "Vaishali Nagar", "Sindhi Camp"]
        mock_orgs = ["JDA", "Nagar Nigam", "Police Dept", "Hospital"]
        
        # Simple keyword matching
        for p in mock_people:
            if p.lower() in text_lower:
                entities.append({"text": p, "label": "PERSON"})
                
        for l in mock_locs:
            if l.lower() in text_lower:
                entities.append({"text": l, "label": "GPE"})
                
        for o in mock_orgs:
            if o.lower() in text_lower:
                entities.append({"text": o, "label": "ORG"})
                
        return entities

    def detect_topics(self, text: str) -> List[str]:
        """Simple keyword-based topic detection."""
        topics = []
        text_lower = text.lower()
        keywords = {
            "Protest": ["protest", "slogan", "crowd", "march"],
            "Violence": ["violence", "attack", "fight", "weapon"],
            "Traffic": ["traffic", "jam", "blocked", "road"],
            "Emergency": ["emergency", "ambulance", "fire", "help"]
        }
        
        for topic, words in keywords.items():
            if any(word in text_lower for word in words):
                topics.append(topic)
        return topics

    def build_graph(self, data_items: List[DataItem]):
        """Builds a NetworkX graph from data items."""
        self.graph.clear()
        for item in data_items:
            # Add item node
            self.graph.add_node(item.id, type="event", label=item.source)
            
            # Add entity nodes and edges
            for ent in item.entities:
                ent_id = f"{ent['label']}:{ent['text']}"
                self.graph.add_node(ent_id, type="entity", label=ent['label'])
                self.graph.add_edge(item.id, ent_id)
                
            # Link items by location
            if item.location:
                loc_id = f"LOC:{item.location}"
                self.graph.add_node(loc_id, type="location", label="Location")
                self.graph.add_edge(item.id, loc_id)

    def process_single_item(self, item):
        """Helper to process a single item immediately."""
        item.entities = self.extract_entities(item.content)
        item.topics = self.detect_topics(item.content)

    def get_graph_data(self) -> Dict:
        """Returns graph data in a format suitable for frontend visualization."""
        nodes = [{"id": n, **self.graph.nodes[n]} for n in self.graph.nodes()]
        links = [{"source": u, "target": v} for u, v in self.graph.edges()]
        return {"nodes": nodes, "links": links}

ai_engine = AIEngine()
