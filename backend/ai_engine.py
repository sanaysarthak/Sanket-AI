try:
    import spacy
except ImportError:
    spacy = None
except Exception:
    # Handle config errors like pydantic.v1.errors.ConfigError
    spacy = None

import networkx as nx
from typing import List, Dict, Tuple
from .models import DataItem

class AIEngine:
    def __init__(self):
        self.nlp = None
        if spacy:
            try:
                try:
                    self.nlp = spacy.load("en_core_web_sm")
                except OSError:
                    print("Downloading spaCy model...")
                    from spacy.cli import download
                    download("en_core_web_sm")
                    self.nlp = spacy.load("en_core_web_sm")
            except Exception as e:
                print(f"Failed to load spaCy: {e}")
        
        self.graph = nx.Graph()

    def extract_entities(self, text: str) -> List[Dict]:
        """Extracts entities using spaCy."""
        if not self.nlp:
            # Fallback mock entity extraction
            return [{"text": "Mock Entity", "label": "PERSON"}]
            
        doc = self.nlp(text)
        entities = []
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "GPE", "ORG", "FAC"]:
                entities.append({"text": ent.text, "label": ent.label_})
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
            # Add item node with rich metadata for visualization
            self.graph.add_node(
                item.id,
                type="event",
                label=item.source,
                source=item.source,
                location=item.location,
                timestamp=str(item.timestamp),
                topics=item.topics or [],
            )
            
            # Add entity nodes and edges
            for ent in item.entities:
                ent_id = f"{ent['label']}:{ent['text']}"
                self.graph.add_node(
                    ent_id,
                    type="entity",
                    label=ent['label'],
                    text=ent['text'],
                )
                self.graph.add_edge(item.id, ent_id)
                
            # Link items by location
            if item.location:
                loc_id = f"LOC:{item.location}"
                self.graph.add_node(
                    loc_id,
                    type="location",
                    label="Location",
                    name=item.location,
                )
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
