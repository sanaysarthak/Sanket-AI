import os
import json
import logging
import platform
import subprocess
import random
from fastapi import FastAPI, Depends, BackgroundTasks
from datetime import datetime

from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from .models import DataItem, Alert, AgencyAlertRequest
from .email_utils import send_email_alert
from .ingestion import ingestion_service
from .ingestion import ingestion_service
from .ai_engine import ai_engine
from .alerting import alerting_engine
from .auth import auth_handler
from .scrapers import run_all_scrapers
from .analytics import get_full_analytics, get_cross_source_insights, analyze_cctv, analyze_emergency, analyze_fir, analyze_social_media
from .link_analysis import (
    get_link_analysis_summary, get_correlations, get_timeline, 
    get_threats, get_network, get_hotspots, get_event_flow
)
from .nlp_processor import (
    get_entity_extraction, get_topic_detection, get_word_cloud_data,
    get_bag_of_words, get_full_nlp_analysis
)
from .video_analysis import router as video_router

app = FastAPI(
    title="Shield Intelligence Dashboard",
    description="Backend for Shield 1.0 Hackathon Project",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(video_router, prefix="/api", tags=["video"])

# --- Startup ---
@app.on_event("startup")
async def startup_event():
    print("Booting up Shield System...")
    ingestion_service.load_mock_data()
    
    # Initial processing
    data = ingestion_service.get_all_data()
    for item in data:
        # Enrich
        if not item.entities:
            item.entities = ai_engine.extract_entities(item.content)
        if not item.topics:
            item.topics = ai_engine.detect_topics(item.content)
            
    # Build Graph
    ai_engine.build_graph(data)
    
    # Check Alerts
    alerting_engine.check_rules(data)
    print("System Ready.")

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "Shield System Operational", "version": "1.0.0"}

@app.get("/api/feed", response_model=List[DataItem])
def get_feed(user=Depends(auth_handler.verify_token)):
    """Returns the intelligence feed."""
    return ingestion_service.get_all_data()

@app.get("/api/alerts", response_model=List[Alert])
def get_alerts(user=Depends(auth_handler.verify_token)):
    """Returns generated alerts."""
    return alerting_engine.get_alerts()

@app.post("/api/alert/send")
def send_agency_alert(request: AgencyAlertRequest, user=Depends(auth_handler.verify_token)):
    """Sends an email alert to the agency."""
    import os
    RECIPIENT = os.getenv('RECIPIENT_EMAIL')
    SENDER = os.getenv('SENDER_EMAIL')
    
    # Friendly Name Mapping
    AGENCY_NAMES = {
        "police": "Jaipur Police",
        "fire": "Fire Department",
        "act": "Anti-Terror Cell",
        "ib": "Intelligence Bureau",
        "bomb_squad": "Bomb Squad",
        "women_cell": "Women Police Cell"
    }
    
    to_name = AGENCY_NAMES.get(request.agency_id.lower(), request.agency_id.replace('_', ' ').title())
    from_name = "BPRD Central Command"

    subject = f"URGENT: {request.intensity.upper()} Alert for {request.agency_id.upper()}"
    body = f"""
    PRIORITY: {request.intensity.upper()}
    AGENCY: {to_name.upper()}
    
    INTELLIGENCE REPORT / MESSAGE:
    {request.message}
    
    ----------------------------------------------------
    Sent via Sanket Intelligence Platform
    From: {from_name}
    To: {to_name}
    """
    
    # Pass the sender explicitly
    # Note: We still send to the actual configured email recipients (siddheshsakle@gmail.com) 
    # but the text displayed in the body is now the friendly names.
    success = send_email_alert(RECIPIENT, subject, body, sender_email=SENDER)
    return {"status": "success", "message": f"Alert dispatched to {to_name}"}

@app.get("/api/graph")
def get_graph_data(user=Depends(auth_handler.verify_token)):
    """Returns graph data for visualization."""
    # Only Intel and Admin can see the full graph (RBAC Demo)
    if user["role"] not in ["intel", "admin"]:
         # Return limited view for others if needed, or just allow for demo simplicity
         pass 
    return ai_engine.get_graph_data()

@app.get("/api/stats")
def get_stats(user=Depends(auth_handler.verify_token)):
    """Returns dashboard statistics."""
    data = ingestion_service.get_all_data()
    alerts = alerting_engine.get_alerts()
    
    return {
        "total_events": len(data),
        "active_alerts": len(alerts),
        "sources": {
            "social_media": len([i for i in data if i.source == "social_media"]),
            "cctv": len([i for i in data if i.source == "cctv"]),
            "police": len([i for i in data if i.source == "police"])
        },
        "top_topics": ["Protest", "Traffic"] # Mocked for now or calculate real
    }

# ============================================================
# AI-ML ANALYTICS ENDPOINTS
# ============================================================

@app.get("/api/analytics/full")
def get_analytics_full(user=Depends(auth_handler.verify_token)):
    """Returns comprehensive AI-ML analytics for all data sources."""
    try:
        return get_full_analytics()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/cctv")
def get_analytics_cctv(user=Depends(auth_handler.verify_token)):
    """Returns CCTV anomaly detection results."""
    try:
        return analyze_cctv()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/emergency")
def get_analytics_emergency(user=Depends(auth_handler.verify_token)):
    """Returns emergency call analytics."""
    try:
        return analyze_emergency()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/fir")
def get_analytics_fir(user=Depends(auth_handler.verify_token)):
    """Returns FIR analytics."""
    try:
        return analyze_fir()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/social")
def get_analytics_social(user=Depends(auth_handler.verify_token)):
    """Returns social media NLP analytics."""
    try:
        return analyze_social_media()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/correlations")
def get_analytics_correlations(user=Depends(auth_handler.verify_token)):
    """Returns cross-source correlation insights for link analysis."""
    try:
        return get_cross_source_insights()
    except Exception as e:
        return {"error": str(e)}

# ============================================================
# LINK ANALYSIS ENDPOINTS
# ============================================================

@app.get("/api/link-analysis/full")
def get_link_analysis_full(user=Depends(auth_handler.verify_token)):
    """Returns complete link analysis summary combining all analyses."""
    try:
        return get_link_analysis_summary()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/link-analysis/correlations")
def get_link_correlations(user=Depends(auth_handler.verify_token)):
    """Returns spatial-temporal correlations between data sources."""
    try:
        return get_correlations()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/link-analysis/timeline")
def get_link_timeline(user=Depends(auth_handler.verify_token)):
    """Returns unified timeline of events from all sources."""
    try:
        return get_timeline()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/link-analysis/threats")
def get_link_threats(user=Depends(auth_handler.verify_token)):
    """Returns detected threat vectors and risk assessment."""
    try:
        return get_threats()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/link-analysis/network")
def get_link_network(user=Depends(auth_handler.verify_token)):
    """Returns entity network graph data for visualization."""
    try:
        return get_network()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/link-analysis/hotspots")
def get_link_hotspots(user=Depends(auth_handler.verify_token)):
    """Returns geographic hotspots where multiple sources overlap."""
    try:
        return get_hotspots()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/link-analysis/flow")
def get_link_flow(user=Depends(auth_handler.verify_token)):
    """Returns event flow and treemap data for visualization."""
    try:
        return get_event_flow()
    except Exception as e:
        return {"error": str(e)}

# ============================================================
# NLP / ENTITY EXTRACTION ENDPOINTS
# ============================================================

@app.get("/api/nlp/full")
def get_nlp_full(user=Depends(auth_handler.verify_token)):
    """Returns complete NLP analysis including entities, topics, word cloud, and bag of words."""
    try:
        return get_full_nlp_analysis()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/nlp/entities")
def get_nlp_entities(user=Depends(auth_handler.verify_token)):
    """Returns extracted entities from all data sources."""
    try:
        return get_entity_extraction()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/nlp/topics")
def get_nlp_topics(user=Depends(auth_handler.verify_token)):
    """Returns detected topics and their distribution."""
    try:
        return get_topic_detection()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/nlp/wordcloud")
def get_nlp_wordcloud(user=Depends(auth_handler.verify_token)):
    """Returns word frequency data for word cloud visualization."""
    try:
        return get_word_cloud_data()
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/nlp/bow")
def get_nlp_bow(user=Depends(auth_handler.verify_token)):
    """Returns bag of words analysis with TF-IDF scoring."""
    try:
        return get_bag_of_words()
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/ingest")
async def ingest_data(item: DataItem, background_tasks: BackgroundTasks, user=Depends(auth_handler.verify_token)):
    """Endpoint to ingest real-time data."""
    ingestion_service.add_data(item)
    
    # Trigger processing in background
    # Trigger processing in background
    background_tasks.add_task(process_new_item, item)
    return {"status": "queued"}

@app.post("/api/scrape/start")
async def start_scraping(background_tasks: BackgroundTasks, user=Depends(auth_handler.verify_token)):
    """Triggers the real-time social media scraper."""
    background_tasks.add_task(run_scraper_job)
    return {"status": "Scraping started...", "message": "Collecting data from Reddit, Telegram, and News."}

@app.post("/api/scrape/open-folder")
def open_scraped_folder(user=Depends(auth_handler.verify_token)):
    """Opens the folder containing scraped logs."""
    folder_path = os.path.abspath("scraped_logs")
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        
    try:
        if platform.system() == "Windows":
            os.startfile(folder_path)
        elif platform.system() == "Darwin":
            subprocess.Popen(["open", folder_path])
        else:
            subprocess.Popen(["xdg-open", folder_path])
        return {"status": "success", "message": "Folder opened."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def run_scraper_job():
    print("Running scraper job...")
    new_data = run_all_scrapers()
    print(f"Scraper found {len(new_data)} items.")
    
    # SAVE TO FILE
    try:
        if not os.path.exists("scraped_logs"):
            os.makedirs("scraped_logs")
        
        filename = f"scraped_logs/scrape_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Serialize datetime objects to string
        data_to_save = []
        for item in new_data:
             data_to_save.append({
                 **item,
                 "timestamp": item.get('timestamp') or datetime.now().isoformat()
             })
             
        with open(filename, "w") as f:
            json.dump(data_to_save, f, indent=4)
        print(f"Saved scrape logs to {filename}")
    except Exception as e:
        print(f"Error saving scrape logs: {e}")
    
    for item_dict in new_data:
        # Update timestamp to NOW for demo purposes so it shows up in "Live Feed"
        # (Real items might be hours old, and our frontend filter is strict)
        live_timestamp = datetime.now().isoformat()
        
        # Convert to DataItem
        item = DataItem(
            id=f"{item_dict['source']}_{random.randint(1000,9999)}",
            source=f"social_media_{item_dict['source']}",
            content=f"{item_dict.get('author', 'Unknown')}: {item_dict['content']}",
            timestamp=live_timestamp, # FORCE timestamp to now
            location="Jaipur", 
            type="text"
        )
        ingestion_service.add_data(item)
        ai_engine.process_single_item(item) # Helper to process immediately
    
    print("Scraper job finished.")

def process_new_item(item: DataItem):
    # Enrich
    item.entities = ai_engine.extract_entities(item.content)
    item.topics = ai_engine.detect_topics(item.content)
    
    ai_engine.detect_topics(item.content) # Assuming side-effects or update logic inside
    
    # Rebuild graph (incremental update would be better but full rebuild is fine for demo)
    all_data = ingestion_service.get_all_data()
    ai_engine.build_graph(all_data)
    alerting_engine.check_rules(all_data)
