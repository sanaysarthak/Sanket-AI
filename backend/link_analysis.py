"""
SHIELD Link Analysis Engine
Cross-source correlation, entity linking, threat vector detection, and network graph generation.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict
import re
from pathlib import Path
import json
import math

# Data paths
DATA_DIR = Path(__file__).parent.parent / "data" / "raw"

def convert_to_serializable(obj):
    """Recursively convert numpy types to native Python types for JSON serialization."""
    if isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(i) for i in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.bool_,)):
        return bool(obj)
    elif pd.isna(obj):
        return None
    else:
        return obj

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km using Haversine formula."""
    R = 6371  # Earth's radius in km
    
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def extract_entities(text):
    """Extract entities (locations, keywords) from text."""
    if not isinstance(text, str):
        return {"locations": [], "keywords": []}
    
    # Common Jaipur locations
    jaipur_locations = [
        "hawa mahal", "city palace", "jantar mantar", "amber fort", "nahargarh",
        "jaigarh", "albert hall", "birla mandir", "galta ji", "sisodia rani",
        "jal mahal", "johari bazaar", "bapu bazaar", "mi road", "tonk road",
        "ajmeri gate", "chandpole", "sanganeri gate", "new gate", "statue circle",
        "ram nagar", "vaishali nagar", "mansarovar", "malviya nagar", "jagatpura",
        "sodala", "raja park", "c-scheme", "civil lines", "bani park"
    ]
    
    # Threat keywords
    threat_keywords = [
        "protest", "riot", "violence", "attack", "bomb", "threat", "fire",
        "accident", "crowd", "mob", "strike", "bandh", "curfew", "tension",
        "fight", "assault", "theft", "robbery", "murder", "kidnap", "missing"
    ]
    
    text_lower = text.lower()
    found_locations = [loc for loc in jaipur_locations if loc in text_lower]
    found_keywords = [kw for kw in threat_keywords if kw in text_lower]
    
    return {"locations": found_locations, "keywords": found_keywords}

def load_all_data():
    """Load all data sources with normalized fields."""
    data = {}
    
    # Load CCTV data
    cctv_path = DATA_DIR / "jaipur_cctv_metadata_500.csv"
    if cctv_path.exists():
        df = pd.read_csv(cctv_path)
        df['source'] = 'cctv'
        df['timestamp'] = pd.to_datetime(df['timestamp']) if 'timestamp' in df.columns else pd.Timestamp.now()
        # Normalize lat/lon if not present
        if 'latitude' not in df.columns:
            df['latitude'] = np.random.uniform(26.85, 26.95, len(df))
            df['longitude'] = np.random.uniform(75.75, 75.85, len(df))
        data['cctv'] = df
    
    # Load Emergency calls
    emergency_path = DATA_DIR / "jaipur_emergency_calls.csv"
    if emergency_path.exists():
        df = pd.read_csv(emergency_path)
        df['source'] = 'emergency'
        df['timestamp'] = pd.to_datetime(df['timestamp']) if 'timestamp' in df.columns else pd.Timestamp.now()
        data['emergency'] = df
    
    # Load FIR data
    fir_path = DATA_DIR / "jaipur_police_firs.csv"
    if fir_path.exists():
        df = pd.read_csv(fir_path)
        df['source'] = 'fir'
        df['timestamp'] = pd.to_datetime(df['filed_date']) if 'filed_date' in df.columns else pd.Timestamp.now()
        # Add approximate coordinates based on station
        station_coords = {
            'Jaipur Central': (26.9124, 75.7873),
            'MI Road': (26.9135, 75.7851),
            'Chandpole': (26.9234, 75.8163),
            'Johari Bazaar': (26.9198, 75.8236),
            'Sodala': (26.9012, 75.7543)
        }
        df['latitude'] = df['station_name'].apply(lambda x: station_coords.get(x, (26.91, 75.78))[0] if pd.notna(x) else 26.91)
        df['longitude'] = df['station_name'].apply(lambda x: station_coords.get(x, (26.91, 75.78))[1] if pd.notna(x) else 75.78)
        data['fir'] = df
    
    # Load Social Media data
    social_path = DATA_DIR / "jaipur_social_media_500.csv"
    if social_path.exists():
        df = pd.read_csv(social_path)
        df['source'] = 'social'
        df['timestamp'] = pd.to_datetime(df['post_time']) if 'post_time' in df.columns else pd.Timestamp.now()
        # Extract location from text
        if 'latitude' not in df.columns:
            df['latitude'] = np.random.uniform(26.85, 26.95, len(df))
            df['longitude'] = np.random.uniform(75.75, 75.85, len(df))
        data['social'] = df
    
    return data

def find_spatial_temporal_correlations(data, distance_threshold_km=2.0, time_threshold_hours=4):
    """Find events that occur close in space and time across different sources."""
    correlations = []
    correlation_matrix = defaultdict(lambda: defaultdict(int))
    
    sources = list(data.keys())
    
    for i, source1 in enumerate(sources):
        for source2 in sources[i+1:]:
            df1 = data[source1]
            df2 = data[source2]
            
            for _, row1 in df1.head(100).iterrows():  # Limit for performance
                for _, row2 in df2.head(100).iterrows():
                    try:
                        # Calculate spatial distance
                        dist = haversine_distance(
                            row1.get('latitude', 26.91), row1.get('longitude', 75.78),
                            row2.get('latitude', 26.91), row2.get('longitude', 75.78)
                        )
                        
                        # Calculate temporal distance
                        t1 = pd.to_datetime(row1.get('timestamp', datetime.now()))
                        t2 = pd.to_datetime(row2.get('timestamp', datetime.now()))
                        time_diff = abs((t1 - t2).total_seconds() / 3600)  # hours
                        
                        if dist <= distance_threshold_km and time_diff <= time_threshold_hours:
                            # Calculate correlation strength (0-1)
                            spatial_score = 1 - (dist / distance_threshold_km)
                            temporal_score = 1 - (time_diff / time_threshold_hours)
                            strength = (spatial_score + temporal_score) / 2
                            
                            correlation_matrix[source1][source2] += 1
                            correlation_matrix[source2][source1] += 1
                            
                            if strength > 0.5:  # Only record strong correlations
                                correlations.append({
                                    "source1": source1,
                                    "source2": source2,
                                    "distance_km": round(dist, 2),
                                    "time_diff_hours": round(time_diff, 2),
                                    "strength": round(strength, 3),
                                    "location": row1.get('location', row1.get('zone', 'Unknown')),
                                    "timestamp": str(t1)
                                })
                    except Exception:
                        continue
    
    # Normalize correlation matrix
    max_val = max([max(v.values()) if v else 1 for v in correlation_matrix.values()]) or 1
    normalized_matrix = {
        s1: {s2: round(v / max_val, 3) for s2, v in s1_dict.items()}
        for s1, s1_dict in correlation_matrix.items()
    }
    
    return {
        "correlations": sorted(correlations, key=lambda x: x['strength'], reverse=True)[:50],
        "correlation_matrix": normalized_matrix,
        "total_correlations": len(correlations),
        "strong_correlations": len([c for c in correlations if c['strength'] > 0.7])
    }

def generate_unified_timeline(data):
    """Generate a unified timeline of events from all sources."""
    events = []
    
    source_icons = {
        'cctv': '📹',
        'emergency': '📞',
        'fir': '📋',
        'social': '📱'
    }
    
    source_colors = {
        'cctv': '#3b82f6',
        'emergency': '#ef4444',
        'fir': '#f59e0b',
        'social': '#8b5cf6'
    }
    
    for source_name, df in data.items():
        for _, row in df.head(50).iterrows():  # Limit per source
            try:
                ts = pd.to_datetime(row.get('timestamp', datetime.now()))
                
                # Generate event description based on source
                if source_name == 'cctv':
                    desc = f"CCTV: {row.get('event_type', 'Detection')} at {row.get('zone', 'Unknown Zone')}"
                    severity = row.get('severity_level', 'low')
                elif source_name == 'emergency':
                    desc = f"Emergency Call: {row.get('call_type', 'Unknown')} - Priority: {row.get('priority', 'N/A')}"
                    severity = 'high' if row.get('priority', '').lower() == 'high' else 'medium'
                elif source_name == 'fir':
                    desc = f"FIR Filed: {row.get('crime_type', 'Unknown Crime')} at {row.get('station_name', 'Unknown Station')}"
                    severity = 'high' if row.get('crime_type', '') in ['Rioting', 'Murder', 'Kidnapping'] else 'medium'
                elif source_name == 'social':
                    desc = f"Social Media: {row.get('detected_topic', 'Post')} - Sentiment: {row.get('sentiment_score', 0):.2f}"
                    severity = 'high' if row.get('is_misinformation', False) else 'low'
                else:
                    desc = f"Event from {source_name}"
                    severity = 'low'
                
                events.append({
                    "timestamp": str(ts),
                    "hour": ts.hour,
                    "source": source_name,
                    "icon": source_icons.get(source_name, '📌'),
                    "color": source_colors.get(source_name, '#6b7280'),
                    "description": desc,
                    "severity": severity,
                    "location": row.get('location', row.get('zone', 'Unknown')),
                    "latitude": float(row.get('latitude', 26.91)),
                    "longitude": float(row.get('longitude', 75.78))
                })
            except Exception:
                continue
    
    # Sort by timestamp
    events.sort(key=lambda x: x['timestamp'])
    
    # Generate hourly distribution
    hourly_dist = defaultdict(lambda: defaultdict(int))
    for event in events:
        hourly_dist[event['hour']][event['source']] += 1
    
    hourly_data = []
    for hour in range(24):
        hourly_data.append({
            "hour": f"{hour:02d}:00",
            "cctv": hourly_dist[hour].get('cctv', 0),
            "emergency": hourly_dist[hour].get('emergency', 0),
            "fir": hourly_dist[hour].get('fir', 0),
            "social": hourly_dist[hour].get('social', 0),
            "total": sum(hourly_dist[hour].values())
        })
    
    return {
        "events": events[-100:],  # Latest 100 events
        "hourly_distribution": hourly_data,
        "total_events": len(events),
        "source_counts": {source: len(df) for source, df in data.items()}
    }

def detect_threat_vectors(data):
    """Detect and score threat vectors based on multi-source evidence."""
    threats = []
    
    # Define threat patterns
    threat_patterns = [
        {
            "name": "Event Escalation",
            "description": "Progressive escalation from social signals to physical incidents",
            "required_sources": ["social", "cctv", "emergency"],
            "severity": "critical",
            "icon": "🔴"
        },
        {
            "name": "Planned Gathering",
            "description": "Coordinated social media activity indicating planned event",
            "required_sources": ["social"],
            "severity": "high",
            "icon": "🟠"
        },
        {
            "name": "Hotspot Emergence",
            "description": "New location showing activity across multiple sources",
            "required_sources": ["cctv", "emergency"],
            "severity": "high",
            "icon": "🟡"
        },
        {
            "name": "Misinformation Spread",
            "description": "Viral misinformation posts detected",
            "required_sources": ["social"],
            "severity": "medium",
            "icon": "🟣"
        },
        {
            "name": "Crowd Formation",
            "description": "CCTV detecting unusual crowd patterns",
            "required_sources": ["cctv"],
            "severity": "medium",
            "icon": "🔵"
        }
    ]
    
    # Analyze each threat pattern
    for pattern in threat_patterns:
        evidence = []
        confidence = 0.0
        
        for source_name in pattern["required_sources"]:
            if source_name in data:
                df = data[source_name]
                
                # Count relevant evidence
                if source_name == "social":
                    misinfo_count = df[df.get('is_misinformation', False) == True].shape[0] if 'is_misinformation' in df.columns else 0
                    viral_count = df[df.get('viral_score', 0) > 100].shape[0] if 'viral_score' in df.columns else 0
                    evidence.append(f"{misinfo_count} misinformation posts, {viral_count} viral posts")
                    confidence += 0.3 if misinfo_count > 5 else 0.1
                    
                elif source_name == "cctv":
                    anomaly_count = df[df.get('severity_level', '') == 'critical'].shape[0] if 'severity_level' in df.columns else 0
                    crowd_count = df[df.get('event_type', '').str.contains('crowd', case=False, na=False)].shape[0] if 'event_type' in df.columns else 0
                    evidence.append(f"{anomaly_count} critical anomalies, {crowd_count} crowd events")
                    confidence += 0.3 if anomaly_count > 10 else 0.1
                    
                elif source_name == "emergency":
                    high_priority = df[df.get('priority', '').str.lower() == 'high'].shape[0] if 'priority' in df.columns else 0
                    evidence.append(f"{high_priority} high-priority calls")
                    confidence += 0.3 if high_priority > 5 else 0.1
                    
                elif source_name == "fir":
                    serious_crimes = df[df.get('crime_type', '').isin(['Rioting', 'Murder', 'Kidnapping'])].shape[0] if 'crime_type' in df.columns else 0
                    evidence.append(f"{serious_crimes} serious crime FIRs")
                    confidence += 0.3 if serious_crimes > 2 else 0.1
        
        threats.append({
            "name": pattern["name"],
            "description": pattern["description"],
            "severity": pattern["severity"],
            "icon": pattern["icon"],
            "sources_involved": pattern["required_sources"],
            "evidence": evidence,
            "confidence": min(round(confidence, 2), 1.0),
            "detected": confidence > 0.3
        })
    
    # Sort by confidence
    threats.sort(key=lambda x: x['confidence'], reverse=True)
    
    # Calculate threat scores by severity
    severity_scores = {
        "critical": len([t for t in threats if t['detected'] and t['severity'] == 'critical']),
        "high": len([t for t in threats if t['detected'] and t['severity'] == 'high']),
        "medium": len([t for t in threats if t['detected'] and t['severity'] == 'medium']),
        "low": len([t for t in threats if t['detected'] and t['severity'] == 'low'])
    }
    
    # Calculate overall threat level
    overall_score = (severity_scores['critical'] * 4 + severity_scores['high'] * 3 + 
                    severity_scores['medium'] * 2 + severity_scores['low'] * 1)
    
    if overall_score >= 10:
        overall_level = "CRITICAL"
    elif overall_score >= 6:
        overall_level = "HIGH"
    elif overall_score >= 3:
        overall_level = "MEDIUM"
    else:
        overall_level = "LOW"
    
    return {
        "threats": threats,
        "severity_distribution": severity_scores,
        "overall_threat_level": overall_level,
        "overall_threat_score": overall_score,
        "detected_count": len([t for t in threats if t['detected']])
    }

def generate_entity_network(data):
    """Generate network graph data for entity relationships."""
    nodes = []
    links = []
    node_ids = set()
    
    # Add source nodes
    source_nodes = {
        'cctv': {'id': 'source_cctv', 'label': 'CCTV System', 'type': 'source', 'color': '#3b82f6', 'size': 30},
        'emergency': {'id': 'source_emergency', 'label': 'Emergency Calls', 'type': 'source', 'color': '#ef4444', 'size': 30},
        'fir': {'id': 'source_fir', 'label': 'FIR Records', 'type': 'source', 'color': '#f59e0b', 'size': 30},
        'social': {'id': 'source_social', 'label': 'Social Media', 'type': 'source', 'color': '#8b5cf6', 'size': 30}
    }
    
    for source_name, node_data in source_nodes.items():
        if source_name in data:
            nodes.append(node_data)
            node_ids.add(node_data['id'])
    
    # Extract locations from each source and create location nodes
    location_sources = defaultdict(list)
    
    for source_name, df in data.items():
        locations = set()
        
        # Get unique locations
        if 'zone' in df.columns:
            locations.update(df['zone'].dropna().unique()[:15])
        if 'location' in df.columns:
            locations.update(df['location'].dropna().unique()[:15])
        if 'station_name' in df.columns:
            locations.update(df['station_name'].dropna().unique()[:15])
        
        for loc in locations:
            if loc and len(str(loc)) > 2:
                location_sources[str(loc)].append(source_name)
    
    # Create location nodes and links
    for location, sources in location_sources.items():
        loc_id = f"loc_{location.replace(' ', '_').lower()}"
        
        if loc_id not in node_ids:
            # Size based on how many sources mention this location
            size = 10 + len(sources) * 5
            
            # Color based on multi-source overlap
            if len(sources) >= 3:
                color = '#ef4444'  # Red for high overlap
            elif len(sources) == 2:
                color = '#f59e0b'  # Orange for medium
            else:
                color = '#10b981'  # Green for single source
            
            nodes.append({
                'id': loc_id,
                'label': location[:20],
                'type': 'location',
                'color': color,
                'size': size,
                'sources': sources
            })
            node_ids.add(loc_id)
            
            # Create links from sources to locations
            for source in sources:
                source_id = f"source_{source}"
                if source_id in node_ids:
                    links.append({
                        'source': source_id,
                        'target': loc_id,
                        'value': 1
                    })
    
    # Add event type nodes
    event_types = set()
    if 'cctv' in data and 'event_type' in data['cctv'].columns:
        event_types.update(data['cctv']['event_type'].dropna().unique()[:10])
    if 'emergency' in data and 'call_type' in data['emergency'].columns:
        event_types.update(data['emergency']['call_type'].dropna().unique()[:10])
    if 'fir' in data and 'crime_type' in data['fir'].columns:
        event_types.update(data['fir']['crime_type'].dropna().unique()[:10])
    
    for event_type in event_types:
        if event_type and len(str(event_type)) > 2:
            event_id = f"event_{str(event_type).replace(' ', '_').lower()}"
            if event_id not in node_ids:
                nodes.append({
                    'id': event_id,
                    'label': str(event_type)[:20],
                    'type': 'event',
                    'color': '#06b6d4',
                    'size': 15
                })
                node_ids.add(event_id)
    
    # Calculate network statistics
    multi_source_locations = len([l for l, s in location_sources.items() if len(s) > 1])
    
    return {
        "nodes": nodes,
        "links": links,
        "statistics": {
            "total_nodes": len(nodes),
            "total_links": len(links),
            "locations": len(location_sources),
            "multi_source_hotspots": multi_source_locations,
            "sources_connected": len([n for n in nodes if n['type'] == 'source'])
        }
    }

def detect_hotspots(data):
    """Detect geographic hotspots where multiple sources overlap."""
    # Grid-based hotspot detection
    grid_size = 0.01  # Approximately 1km grid
    grid_counts = defaultdict(lambda: defaultdict(int))
    grid_events = defaultdict(list)
    
    for source_name, df in data.items():
        for _, row in df.iterrows():
            try:
                lat = float(row.get('latitude', 26.91))
                lon = float(row.get('longitude', 75.78))
                
                # Snap to grid
                grid_lat = round(lat / grid_size) * grid_size
                grid_lon = round(lon / grid_size) * grid_size
                grid_key = f"{grid_lat:.3f},{grid_lon:.3f}"
                
                grid_counts[grid_key][source_name] += 1
                grid_events[grid_key].append({
                    'source': source_name,
                    'event': row.get('event_type', row.get('call_type', row.get('crime_type', 'Unknown')))
                })
            except Exception:
                continue
    
    # Calculate hotspot scores
    hotspots = []
    for grid_key, source_counts in grid_counts.items():
        lat, lon = map(float, grid_key.split(','))
        
        # Score = sum of events weighted by source diversity
        total_events = sum(source_counts.values())
        source_diversity = len(source_counts)
        hotspot_score = total_events * (1 + 0.5 * (source_diversity - 1))
        
        if hotspot_score >= 5:  # Minimum threshold
            hotspots.append({
                'latitude': lat,
                'longitude': lon,
                'grid_key': grid_key,
                'total_events': total_events,
                'source_diversity': source_diversity,
                'source_breakdown': dict(source_counts),
                'hotspot_score': round(hotspot_score, 2),
                'severity': 'critical' if hotspot_score > 50 else 'high' if hotspot_score > 20 else 'medium',
                'events': grid_events[grid_key][:10]  # Top 10 events
            })
    
    # Sort by score
    hotspots.sort(key=lambda x: x['hotspot_score'], reverse=True)
    
    # Generate scatter plot data (for frontend)
    scatter_data = []
    for h in hotspots[:50]:
        scatter_data.append({
            'x': h['longitude'],
            'y': h['latitude'],
            'z': h['hotspot_score'],
            'sources': h['source_diversity'],
            'severity': h['severity'],
            'label': f"Score: {h['hotspot_score']}"
        })
    
    return {
        'hotspots': hotspots[:30],
        'scatter_data': scatter_data,
        'total_hotspots': len(hotspots),
        'critical_hotspots': len([h for h in hotspots if h['severity'] == 'critical']),
        'high_hotspots': len([h for h in hotspots if h['severity'] == 'high']),
        'medium_hotspots': len([h for h in hotspots if h['severity'] == 'medium'])
    }

def generate_event_flow(data):
    """Generate Sankey-style event flow data showing how events progress across sources."""
    flow_data = []
    
    # Define flow stages
    stages = [
        ('social', 'Intelligence Signals'),
        ('cctv', 'Visual Detection'),
        ('emergency', 'Response Triggered'),
        ('fir', 'Case Filed')
    ]
    
    # Count events at each stage
    stage_counts = {}
    for source_name, df in data.items():
        stage_counts[source_name] = len(df)
    
    # Create flow connections
    for i in range(len(stages) - 1):
        src_key, src_label = stages[i]
        tgt_key, tgt_label = stages[i + 1]
        
        src_count = stage_counts.get(src_key, 0)
        tgt_count = stage_counts.get(tgt_key, 0)
        
        # Estimate flow (events that could have progressed)
        flow_value = min(src_count, tgt_count) * 0.3  # 30% flow-through assumption
        
        flow_data.append({
            'source': src_label,
            'target': tgt_label,
            'value': int(flow_value) or 5,
            'source_key': src_key,
            'target_key': tgt_key
        })
    
    # Generate treemap data for threat distribution
    treemap_data = []
    if 'social' in data and 'detected_topic' in data['social'].columns:
        topic_counts = data['social']['detected_topic'].value_counts().head(10)
        for topic, count in topic_counts.items():
            treemap_data.append({
                'name': str(topic),
                'value': int(count),
                'category': 'Social Topics'
            })
    
    if 'cctv' in data and 'event_type' in data['cctv'].columns:
        event_counts = data['cctv']['event_type'].value_counts().head(10)
        for event, count in event_counts.items():
            treemap_data.append({
                'name': str(event),
                'value': int(count),
                'category': 'CCTV Events'
            })
    
    if 'fir' in data and 'crime_type' in data['fir'].columns:
        crime_counts = data['fir']['crime_type'].value_counts().head(10)
        for crime, count in crime_counts.items():
            treemap_data.append({
                'name': str(crime),
                'value': int(count),
                'category': 'FIR Crimes'
            })
    
    return {
        'flow_data': flow_data,
        'treemap_data': treemap_data,
        'stage_counts': {stages[i][1]: stage_counts.get(stages[i][0], 0) for i in range(len(stages))}
    }

def get_link_analysis_summary():
    """Get complete link analysis summary combining all analyses."""
    data = load_all_data()
    
    if not data:
        return {"error": "No data sources available"}
    
    correlations = find_spatial_temporal_correlations(data)
    timeline = generate_unified_timeline(data)
    threats = detect_threat_vectors(data)
    network = generate_entity_network(data)
    hotspots = detect_hotspots(data)
    flow = generate_event_flow(data)
    
    result = {
        "timestamp": datetime.now().isoformat(),
        "data_sources": list(data.keys()),
        "correlations": correlations,
        "timeline": timeline,
        "threats": threats,
        "network": network,
        "hotspots": hotspots,
        "event_flow": flow,
        "summary": {
            "total_records": sum(len(df) for df in data.values()),
            "sources_analyzed": len(data),
            "correlations_found": correlations['total_correlations'],
            "strong_correlations": correlations['strong_correlations'],
            "threat_level": threats['overall_threat_level'],
            "hotspots_detected": hotspots['total_hotspots'],
            "network_nodes": network['statistics']['total_nodes']
        }
    }
    
    return convert_to_serializable(result)

# Individual endpoint functions
def get_correlations():
    """Get spatial-temporal correlations."""
    data = load_all_data()
    result = find_spatial_temporal_correlations(data)
    return convert_to_serializable(result)

def get_timeline():
    """Get unified timeline."""
    data = load_all_data()
    result = generate_unified_timeline(data)
    return convert_to_serializable(result)

def get_threats():
    """Get threat vectors."""
    data = load_all_data()
    result = detect_threat_vectors(data)
    return convert_to_serializable(result)

def get_network():
    """Get entity network graph."""
    data = load_all_data()
    result = generate_entity_network(data)
    return convert_to_serializable(result)

def get_hotspots():
    """Get geographic hotspots."""
    data = load_all_data()
    result = detect_hotspots(data)
    return convert_to_serializable(result)

def get_event_flow():
    """Get event flow and treemap data."""
    data = load_all_data()
    result = generate_event_flow(data)
    return convert_to_serializable(result)


if __name__ == "__main__":
    # Test the module
    import json
    result = get_link_analysis_summary()
    print(json.dumps(result, indent=2, default=str))
