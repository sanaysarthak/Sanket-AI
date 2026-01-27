"""
SHIELD AI-ML Analytics Engine
Performs anomaly detection, NLP analysis, and statistical analysis on all data sources.
"""

import pandas as pd
import numpy as np
from collections import Counter
from datetime import datetime
from typing import Dict, List, Any, Tuple
import os
import re
import json

# ============================================================
# HELPER FUNCTION TO CONVERT NUMPY TYPES FOR JSON SERIALIZATION
# ============================================================

def convert_to_serializable(obj):
    """Recursively convert numpy types to Python native types for JSON serialization"""
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
    elif isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    elif pd.isna(obj):
        return None
    else:
        return obj

# ============================================================
# DATA LOADING
# ============================================================

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")

def load_cctv_data() -> pd.DataFrame:
    """Load CCTV metadata"""
    path = os.path.join(DATA_DIR, "jaipur_cctv_metadata_500.csv")
    df = pd.read_csv(path)
    df['timestamp'] = pd.to_datetime(df['timestamp'], format='%H:%M:%S')
    return df

def load_emergency_data() -> pd.DataFrame:
    """Load emergency calls data"""
    path = os.path.join(DATA_DIR, "jaipur_emergency_calls.csv")
    df = pd.read_csv(path)
    df['timestamp'] = pd.to_datetime(df['timestamp'], format='%H:%M:%S')
    return df

def load_fir_data() -> pd.DataFrame:
    """Load FIR records data"""
    path = os.path.join(DATA_DIR, "jaipur_police_firs.csv")
    df = pd.read_csv(path)
    df['time_filed'] = pd.to_datetime(df['time_filed'], format='%H:%M:%S')
    return df

def load_social_media_data() -> pd.DataFrame:
    """Load social media data"""
    path = os.path.join(DATA_DIR, "jaipur_social_media_500.csv")
    df = pd.read_csv(path)
    df['timestamp'] = pd.to_datetime(df['timestamp'], format='%H:%M:%S')
    return df


# ============================================================
# CCTV ANALYTICS - Anomaly Detection using Statistical Methods
# ============================================================

def analyze_cctv() -> Dict[str, Any]:
    """
    Perform comprehensive CCTV anomaly detection using:
    - Z-Score based anomaly detection for confidence scores
    - Frequency analysis for event patterns
    - Severity scoring algorithm
    """
    df = load_cctv_data()
    
    # 1. EVENT TYPE DISTRIBUTION
    event_counts = df['event_type'].value_counts().to_dict()
    
    # 2. SEVERITY ANALYSIS
    severity_map = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
    df['severity_score'] = df['severity_level'].map(severity_map)
    
    # 3. CROWD DENSITY ANALYSIS
    density_map = {'low': 1, 'medium': 2, 'high': 3, 'very_high': 4, 'critical': 5}
    df['density_score'] = df['crowd_density'].map(density_map)
    
    # 4. Z-SCORE ANOMALY DETECTION on confidence
    mean_conf = df['confidence'].mean()
    std_conf = df['confidence'].std()
    df['conf_zscore'] = (df['confidence'] - mean_conf) / std_conf
    
    # 5. COMPOSITE ANOMALY SCORE (weighted combination)
    # High severity + High density + Critical events = Anomaly
    critical_events = ['stampede_risk_detected', 'panic_movement_detected', 
                       'crowd_density_critical', 'emergency_corridor_blocked']
    df['is_critical_event'] = df['event_type'].isin(critical_events).astype(int)
    
    df['anomaly_score'] = (
        df['severity_score'] * 0.3 +
        df['density_score'] * 0.3 +
        df['is_critical_event'] * 2.0 +
        df['confidence'] * 1.5
    )
    
    # Normalize anomaly score to 0-100
    df['anomaly_score'] = ((df['anomaly_score'] - df['anomaly_score'].min()) / 
                           (df['anomaly_score'].max() - df['anomaly_score'].min()) * 100)
    
    # 6. DETECT ANOMALIES (top 10% as anomalies)
    threshold = df['anomaly_score'].quantile(0.90)
    anomalies = df[df['anomaly_score'] >= threshold].copy()
    
    # 7. ZONE HOTSPOT ANALYSIS
    zone_severity = df.groupby('zone').agg({
        'severity_score': 'mean',
        'density_score': 'mean',
        'anomaly_score': 'mean',
        'camera_id': 'count'
    }).rename(columns={'camera_id': 'event_count'}).round(2).to_dict('index')
    
    # 8. HOURLY PATTERN
    df['hour'] = df['timestamp'].dt.hour
    df['minute'] = df['timestamp'].dt.minute
    hourly_pattern = df.groupby('minute')['anomaly_score'].mean().round(2).to_dict()
    
    # 9. OBJECT DETECTION STATS
    object_stats = df['object_detected'].value_counts().to_dict()
    
    # 10. MOVEMENT PATTERN ANALYSIS
    movement_stats = df['movement_pattern'].value_counts().to_dict()
    danger_movements = ['chaotic', 'erratic', 'increasing_fast']
    danger_movement_count = df[df['movement_pattern'].isin(danger_movements)].shape[0]
    
    # 11. CAMERA PERFORMANCE
    camera_stats = df.groupby('camera_id').agg({
        'anomaly_score': ['mean', 'max', 'count']
    }).round(2)
    camera_stats.columns = ['avg_anomaly', 'max_anomaly', 'total_events']
    top_cameras = camera_stats.nlargest(5, 'avg_anomaly').to_dict('index')
    
    # Format anomalies for output
    anomaly_list = anomalies.nlargest(15, 'anomaly_score')[
        ['camera_id', 'location', 'event_type', 'crowd_density', 
         'severity_level', 'object_detected', 'anomaly_score', 'confidence']
    ].to_dict('records')
    
    return convert_to_serializable({
        "source": "cctv",
        "total_records": len(df),
        "anomaly_count": len(anomalies),
        "anomaly_threshold": round(float(threshold), 2),
        "mean_anomaly_score": round(float(df['anomaly_score'].mean()), 2),
        "event_distribution": event_counts,
        "severity_distribution": df['severity_level'].value_counts().to_dict(),
        "crowd_density_distribution": df['crowd_density'].value_counts().to_dict(),
        "zone_analysis": zone_severity,
        "temporal_pattern": hourly_pattern,
        "object_detection": object_stats,
        "movement_patterns": movement_stats,
        "danger_movement_count": int(danger_movement_count),
        "top_risk_cameras": top_cameras,
        "anomalies": anomaly_list,
        "critical_event_count": int(df['is_critical_event'].sum()),
        "stats": {
            "avg_confidence": round(float(mean_conf), 3),
            "std_confidence": round(float(std_conf), 3),
            "avg_severity": round(float(df['severity_score'].mean()), 2),
            "avg_density": round(float(df['density_score'].mean()), 2)
        }
    })


# ============================================================
# EMERGENCY CALLS ANALYTICS
# ============================================================

def analyze_emergency() -> Dict[str, Any]:
    """
    Perform emergency call analysis:
    - Call clustering by location and time
    - Priority distribution analysis
    - Hotspot detection using geographic clustering
    """
    df = load_emergency_data()
    
    # 1. CALL TYPE DISTRIBUTION
    call_type_dist = df['call_type'].value_counts().to_dict()
    
    # 2. PRIORITY DISTRIBUTION
    priority_dist = df['priority'].value_counts().to_dict()
    priority_map = {'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4}
    df['priority_score'] = df['priority'].map(priority_map)
    
    # 3. LOCATION HOTSPOT ANALYSIS
    location_stats = df.groupby('location').agg({
        'call_id': 'count',
        'priority_score': 'mean',
        'latitude': 'first',
        'longitude': 'first'
    }).rename(columns={'call_id': 'call_count'}).round(2)
    
    # Calculate location risk score
    location_stats['risk_score'] = (
        location_stats['call_count'] * 0.5 + 
        location_stats['priority_score'] * 10
    ).round(2)
    
    location_hotspots = location_stats.to_dict('index')
    
    # 4. TEMPORAL ANALYSIS
    df['minute'] = df['timestamp'].dt.hour * 60 + df['timestamp'].dt.minute
    temporal_pattern = df.groupby(df['timestamp'].dt.minute)['call_id'].count().to_dict()
    
    # 5. CALL SURGE DETECTION (Anomaly: >2 std deviations from mean)
    minute_counts = df.groupby('minute')['call_id'].count()
    mean_calls = minute_counts.mean()
    std_calls = minute_counts.std()
    surge_threshold = mean_calls + 2 * std_calls
    surge_minutes = minute_counts[minute_counts > surge_threshold].to_dict()
    
    # 6. CRITICAL CALLS ANALYSIS
    critical_calls = df[df['priority'] == 'Critical'].copy()
    critical_by_type = critical_calls['call_type'].value_counts().to_dict()
    critical_by_location = critical_calls['location'].value_counts().to_dict()
    
    # 7. GEOGRAPHIC CLUSTERING (simple distance-based)
    # Group calls within 0.01 degree (~1km) radius
    df['lat_bin'] = (df['latitude'] * 100).astype(int)
    df['lon_bin'] = (df['longitude'] * 100).astype(int)
    geo_clusters = df.groupby(['lat_bin', 'lon_bin']).agg({
        'call_id': 'count',
        'location': 'first',
        'latitude': 'mean',
        'longitude': 'mean'
    }).rename(columns={'call_id': 'cluster_size'}).reset_index()
    
    major_clusters = geo_clusters[geo_clusters['cluster_size'] > 10].to_dict('records')
    
    # 8. RESPONSE PRIORITY ANALYSIS
    high_priority = df[df['priority'].isin(['High', 'Critical'])]
    high_priority_pct = len(high_priority) / len(df) * 100
    
    # 9. ANOMALY DETECTION - Unusual call patterns
    # Calls with Critical priority + certain types = High Risk
    high_risk_types = ['Fire', 'Public Disturbance', 'Suspicious Object']
    df['risk_flag'] = (
        (df['priority'] == 'Critical') & 
        (df['call_type'].isin(high_risk_types))
    ).astype(int)
    
    anomalies = df[df['risk_flag'] == 1][
        ['call_id', 'timestamp', 'location', 'call_type', 'priority', 'description']
    ].head(15).to_dict('records')
    
    # Format timestamp for JSON
    for a in anomalies:
        a['timestamp'] = str(a['timestamp'].time())
    
    return convert_to_serializable({
        "source": "emergency_calls",
        "total_records": len(df),
        "call_type_distribution": call_type_dist,
        "priority_distribution": priority_dist,
        "location_hotspots": location_hotspots,
        "temporal_pattern": {str(k): int(v) for k, v in temporal_pattern.items()},
        "surge_detection": {
            "threshold": round(float(surge_threshold), 2),
            "surge_periods": {str(k): int(v) for k, v in surge_minutes.items()}
        },
        "critical_analysis": {
            "total_critical": len(critical_calls),
            "by_type": critical_by_type,
            "by_location": critical_by_location
        },
        "geographic_clusters": major_clusters,
        "high_priority_percentage": round(float(high_priority_pct), 2),
        "anomalies": anomalies,
        "stats": {
            "avg_priority_score": round(float(df['priority_score'].mean()), 2),
            "mean_calls_per_minute": round(float(mean_calls), 2),
            "std_calls": round(float(std_calls), 2)
        }
    })


# ============================================================
# FIR ANALYTICS
# ============================================================

def analyze_fir() -> Dict[str, Any]:
    """
    Analyze FIR records:
    - Crime type classification
    - Station-wise workload analysis
    - Case resolution efficiency
    - Link analysis with emergency calls
    """
    df = load_fir_data()
    
    # 1. CRIME TYPE DISTRIBUTION
    crime_dist = df['crime_type'].value_counts().to_dict()
    
    # 2. STATUS DISTRIBUTION
    status_dist = df['status'].value_counts().to_dict()
    
    # 3. STATION WORKLOAD ANALYSIS
    station_stats = df.groupby('station_name').agg({
        'fir_id': 'count',
        'status': lambda x: (x == 'Closed').sum()
    }).rename(columns={'fir_id': 'total_cases', 'status': 'closed_cases'})
    
    station_stats['resolution_rate'] = (
        station_stats['closed_cases'] / station_stats['total_cases'] * 100
    ).round(2)
    
    station_analysis = station_stats.to_dict('index')
    
    # 4. CRIME SEVERITY SCORING
    severity_map = {
        'Theft': 2, 'Cyber Fraud': 3, 'Assault': 4, 'Rioting': 5
    }
    df['crime_severity'] = df['crime_type'].map(severity_map)
    
    # 5. TEMPORAL ANALYSIS
    df['hour'] = df['time_filed'].dt.hour
    hourly_pattern = df.groupby('hour')['fir_id'].count().to_dict()
    
    # 6. EMERGENCY CALL LINKAGE ANALYSIS
    linked_firs = df[df['emergency_call_linked'].notna()]
    linkage_rate = len(linked_firs) / len(df) * 100
    
    # Most linked crime types
    linked_crime_types = linked_firs['crime_type'].value_counts().to_dict()
    
    # 7. RIOTING ANALYSIS (High priority for law enforcement)
    rioting_cases = df[df['crime_type'] == 'Rioting']
    rioting_stats = {
        'total_cases': len(rioting_cases),
        'linked_to_emergency': len(rioting_cases[rioting_cases['emergency_call_linked'].notna()]),
        'by_station': rioting_cases['station_name'].value_counts().to_dict(),
        'by_status': rioting_cases['status'].value_counts().to_dict()
    }
    
    # 8. CASE RESOLUTION ANALYSIS
    resolution_by_crime = df.groupby('crime_type').apply(
        lambda x: (x['status'] == 'Closed').sum() / len(x) * 100
    ).round(2).to_dict()
    
    # 9. HIGH PRIORITY CASES (Rioting + Assault with Investigation status)
    high_priority = df[
        (df['crime_type'].isin(['Rioting', 'Assault'])) & 
        (df['status'].isin(['Filed', 'Investigating']))
    ]
    
    anomalies = high_priority[
        ['fir_id', 'station_name', 'crime_type', 'status', 'description', 'emergency_call_linked']
    ].head(15).to_dict('records')
    
    return convert_to_serializable({
        "source": "fir_records",
        "total_records": len(df),
        "crime_distribution": crime_dist,
        "status_distribution": status_dist,
        "station_analysis": station_analysis,
        "temporal_pattern": {str(k): int(v) for k, v in hourly_pattern.items()},
        "emergency_linkage": {
            "linked_count": len(linked_firs),
            "linkage_rate": round(float(linkage_rate), 2),
            "linked_crime_types": linked_crime_types
        },
        "rioting_analysis": rioting_stats,
        "resolution_by_crime": resolution_by_crime,
        "high_priority_cases": len(high_priority),
        "anomalies": anomalies,
        "stats": {
            "avg_severity": round(float(df['crime_severity'].mean()), 2),
            "total_stations": int(df['station_name'].nunique()),
            "cases_per_station": round(float(len(df) / df['station_name'].nunique()), 2)
        }
    })


# ============================================================
# SOCIAL MEDIA NLP ANALYTICS
# ============================================================

def analyze_social_media() -> Dict[str, Any]:
    """
    Perform NLP and sentiment analysis on social media:
    - Sentiment analysis (already provided, analyze distribution)
    - Topic modeling/classification
    - Misinformation detection
    - Virality analysis
    - Geographic spread analysis
    """
    df = load_social_media_data()
    
    # 1. PLATFORM DISTRIBUTION
    platform_dist = df['platform'].value_counts().to_dict()
    
    # 2. SENTIMENT ANALYSIS
    df['sentiment_class'] = pd.cut(
        df['sentiment_score'],
        bins=[-1, -0.5, -0.1, 0.1, 0.5, 1],
        labels=['Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive']
    )
    sentiment_dist = df['sentiment_class'].value_counts().to_dict()
    
    # Average sentiment by location
    location_sentiment = df.groupby('location')['sentiment_score'].mean().round(3).to_dict()
    
    # 3. TOPIC ANALYSIS
    topic_dist = df['detected_topic'].value_counts().to_dict()
    
    # Topic sentiment correlation
    topic_sentiment = df.groupby('detected_topic')['sentiment_score'].mean().round(3).to_dict()
    
    # 4. MISINFORMATION ANALYSIS
    misinfo_posts = df[df['is_misinformation'] == 1]
    misinfo_stats = {
        'total_count': len(misinfo_posts),
        'percentage': round(len(misinfo_posts) / len(df) * 100, 2),
        'by_platform': misinfo_posts['platform'].value_counts().to_dict(),
        'by_topic': misinfo_posts['detected_topic'].value_counts().to_dict(),
        'avg_engagement': round(misinfo_posts['engagement_count'].mean(), 2),
        'by_location': misinfo_posts['location'].value_counts().to_dict()
    }
    
    # 5. VIRALITY ANALYSIS
    # Posts with engagement > 2 std from mean
    mean_engagement = df['engagement_count'].mean()
    std_engagement = df['engagement_count'].std()
    viral_threshold = mean_engagement + 2 * std_engagement
    
    viral_posts = df[df['engagement_count'] > viral_threshold]
    viral_analysis = {
        'threshold': round(viral_threshold, 2),
        'viral_count': len(viral_posts),
        'viral_by_topic': viral_posts['detected_topic'].value_counts().to_dict(),
        'viral_by_platform': viral_posts['platform'].value_counts().to_dict()
    }
    
    # 6. PANIC/CRISIS DETECTION
    crisis_topics = ['crowd_panic', 'fire_rumor', 'protest_gathering']
    crisis_posts = df[df['detected_topic'].isin(crisis_topics)]
    
    crisis_analysis = {
        'total_crisis_posts': len(crisis_posts),
        'avg_sentiment': round(crisis_posts['sentiment_score'].mean(), 3),
        'avg_engagement': round(crisis_posts['engagement_count'].mean(), 2),
        'by_location': crisis_posts['location'].value_counts().to_dict(),
        'by_platform': crisis_posts['platform'].value_counts().to_dict()
    }
    
    # 7. GEOGRAPHIC SPREAD
    location_stats = df.groupby('location').agg({
        'post_id': 'count',
        'sentiment_score': 'mean',
        'engagement_count': 'sum',
        'is_misinformation': 'sum',
        'latitude': 'first',
        'longitude': 'first'
    }).rename(columns={
        'post_id': 'post_count',
        'is_misinformation': 'misinfo_count'
    }).round(3).to_dict('index')
    
    # 8. TEMPORAL ANALYSIS
    df['minute'] = df['timestamp'].dt.minute
    temporal_sentiment = df.groupby('minute')['sentiment_score'].mean().round(3).to_dict()
    temporal_volume = df.groupby('minute')['post_id'].count().to_dict()
    
    # 9. KEYWORD FREQUENCY (Simple NLP)
    all_text = ' '.join(df['post_text'].str.lower())
    # Remove common words
    stop_words = {'the', 'at', 'is', 'a', 'an', 'and', 'or', 'but', 'as', 'near', 'for', 'to', 'of'}
    words = re.findall(r'\b[a-z]+\b', all_text)
    words = [w for w in words if w not in stop_words and len(w) > 3]
    word_freq = dict(Counter(words).most_common(20))
    
    # 10. ANOMALY DETECTION - High engagement negative posts
    df['anomaly_score'] = (
        (df['sentiment_score'] < -0.5).astype(int) * 2 +
        (df['engagement_count'] > mean_engagement).astype(int) * 2 +
        (df['is_misinformation'] == 1).astype(int) * 3 +
        (df['detected_topic'].isin(crisis_topics)).astype(int) * 2
    )
    
    anomalies = df[df['anomaly_score'] >= 4].nlargest(15, 'anomaly_score')[
        ['post_id', 'platform', 'post_text', 'location', 'detected_topic', 
         'sentiment_score', 'engagement_count', 'is_misinformation']
    ].to_dict('records')
    
    return convert_to_serializable({
        "source": "social_media",
        "total_records": len(df),
        "platform_distribution": platform_dist,
        "sentiment_distribution": {str(k): int(v) for k, v in sentiment_dist.items()},
        "location_sentiment": location_sentiment,
        "topic_distribution": topic_dist,
        "topic_sentiment": topic_sentiment,
        "misinformation_analysis": misinfo_stats,
        "virality_analysis": viral_analysis,
        "crisis_analysis": crisis_analysis,
        "geographic_spread": location_stats,
        "temporal_sentiment": {str(k): float(v) for k, v in temporal_sentiment.items()},
        "temporal_volume": {str(k): int(v) for k, v in temporal_volume.items()},
        "keyword_frequency": word_freq,
        "anomalies": anomalies,
        "stats": {
            "avg_sentiment": round(float(df['sentiment_score'].mean()), 3),
            "avg_engagement": round(float(mean_engagement), 2),
            "std_engagement": round(float(std_engagement), 2),
            "total_engagement": int(df['engagement_count'].sum()),
            "negative_post_pct": round(float((df['sentiment_score'] < 0).sum() / len(df) * 100), 2)
        }
    })


# ============================================================
# MASTER ANALYTICS FUNCTION
# ============================================================

def get_full_analytics() -> Dict[str, Any]:
    """Run all analytics and return comprehensive results"""
    return {
        "timestamp": datetime.now().isoformat(),
        "cctv": analyze_cctv(),
        "emergency": analyze_emergency(),
        "fir": analyze_fir(),
        "social_media": analyze_social_media()
    }


# ============================================================
# CROSS-SOURCE CORRELATION (For Link Analysis preparation)
# ============================================================

def get_cross_source_insights() -> Dict[str, Any]:
    """
    Identify correlations across data sources for link analysis.
    This will be used for the next phase.
    """
    cctv = load_cctv_data()
    emergency = load_emergency_data()
    fir = load_fir_data()
    social = load_social_media_data()
    
    # Location-based correlation
    cctv_locations = set(cctv['zone'].unique())
    emergency_locations = set(emergency['location'].unique())
    social_locations = set(social['location'].unique())
    
    # Time-based event correlation (within same minute)
    cctv['minute'] = cctv['timestamp'].dt.minute
    emergency['minute'] = emergency['timestamp'].dt.minute
    social['minute'] = social['timestamp'].dt.minute
    
    # Critical events by minute
    cctv_critical = cctv[cctv['severity_level'] == 'critical'].groupby('minute').size()
    emergency_critical = emergency[emergency['priority'] == 'Critical'].groupby('minute').size()
    social_negative = social[social['sentiment_score'] < -0.5].groupby('minute').size()
    
    # Find correlated minutes (events in all 3 sources)
    correlated_minutes = []
    for minute in range(60):
        cctv_count = cctv_critical.get(minute, 0)
        emg_count = emergency_critical.get(minute, 0)
        social_count = social_negative.get(minute, 0)
        
        if cctv_count > 0 and emg_count > 0 and social_count > 0:
            correlated_minutes.append({
                'minute': minute,
                'cctv_critical': int(cctv_count),
                'emergency_critical': int(emg_count),
                'social_negative': int(social_count),
                'correlation_score': int(cctv_count + emg_count + social_count)
            })
    
    return convert_to_serializable({
        "location_overlap": {
            "cctv_zones": list(cctv_locations),
            "emergency_locations": list(emergency_locations),
            "social_locations": list(social_locations)
        },
        "temporal_correlations": sorted(correlated_minutes, key=lambda x: -x['correlation_score']),
        "fir_emergency_links": int(fir['emergency_call_linked'].notna().sum())
    })
