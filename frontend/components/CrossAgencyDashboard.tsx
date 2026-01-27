"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import {
    Shield, Users, Radio, AlertTriangle, MapPin, Clock, Building2, Flame,
    TrendingUp, FileText, Bell, CheckCircle2, ArrowUpRight, Activity, Siren,
    Eye, UserCheck, Send, ChevronRight, XCircle, Volume2, AlertOctagon,
    Zap, Target, Phone, Truck, Timer, ShieldAlert, Lock, History, X, Microscope
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { EventDrawer, DispatchModal } from './OperationalOverlays';
import AgencyAlertComposer from './AgencyAlertComposer';
import { useMap } from 'react-leaflet';

// Dynamic imports for Leaflet (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const HeatmapLayer = dynamic(() => import('./HeatmapLayer'), { ssr: false });

// ==================== TYPE DEFINITIONS ====================
type AgencyId = 'police' | 'ib' | 'act' | 'fire' | 'bomb_squad' | 'women_cell';
type Role = 'viewer' | 'analyst' | 'commander';
type Clearance = 'L1' | 'L2' | 'L3' | 'L4';
type EventType = 'fire' | 'bomb_threat' | 'women_safety' | 'crowd_violence' | 'medical' | 'terror_pattern' | 'unknown';
type Severity = 'low' | 'medium' | 'high' | 'critical';
type EventStatus = 'detected' | 'classified' | 'routed' | 'acknowledged' | 'action' | 'closed';

interface UserContext {
    agency: AgencyId; agencyName: string; role: Role; clearance: Clearance; userId: string; name: string;
}

interface DetectedEvent {
    id: string; type: EventType; severity: Severity; confidence: number; location: string;
    coordinates: [number, number]; timestamp: Date; primaryAgency: AgencyId; secondaryAgency?: AgencyId;
    status: EventStatus; description: string; aiReasoning: string; acknowledgedBy?: string; acknowledgedAt?: Date;
    timeline: { status: EventStatus; timestamp: Date; actor?: string }[];
}

interface AuditLog { agency: AgencyId; eventId: string; action: string; timestamp: Date; }

// ==================== CONSTANTS ====================
const AGENCIES: Record<AgencyId, { name: string; icon: any; color: string; shortName: string }> = {
    police: { name: 'Jaipur Police', icon: Shield, color: '#3b82f6', shortName: 'POL' },
    ib: { name: 'Intelligence Bureau', icon: Eye, color: '#6366f1', shortName: 'IB' },
    act: { name: 'Anti-Terror Cell', icon: Target, color: '#dc2626', shortName: 'ACT' },
    fire: { name: 'Fire Department', icon: Flame, color: '#f97316', shortName: 'FIRE' },
    bomb_squad: { name: 'Bomb Squad', icon: AlertOctagon, color: '#b91c1c', shortName: 'BOMB' },
    women_cell: { name: 'Women Police Cell', icon: ShieldAlert, color: '#ec4899', shortName: 'WPC' },
};

const EVENT_AGENCY_MAPPING: Record<EventType, { primary: AgencyId; secondary?: AgencyId }> = {
    fire: { primary: 'fire', secondary: 'police' },
    bomb_threat: { primary: 'bomb_squad', secondary: 'police' },
    women_safety: { primary: 'women_cell', secondary: 'police' },
    crowd_violence: { primary: 'police', secondary: 'ib' },
    terror_pattern: { primary: 'act', secondary: 'police' },
    medical: { primary: 'police' },
    unknown: { primary: 'police' },
};

const JAIPUR_LOCATIONS: Record<string, [number, number]> = {
    "Hawa Mahal": [26.9239, 75.8267], "City Palace": [26.9258, 75.8237], "Jantar Mantar": [26.9248, 75.8246],
    "Albert Hall Museum": [26.9116, 75.8195], "Nahargarh Fort": [26.9372, 75.8154], "Jal Mahal": [26.9532, 75.8466],
    "Amer Fort": [26.9855, 75.8513], "Birla Mandir": [26.8924, 75.8132], "Ajmeri Gate": [26.9196, 75.8180],
    "Chandpole": [26.9211, 75.8113], "Johari Bazaar": [26.9207, 75.8221], "MI Road": [26.9154, 75.8017],
    "Raja Park": [26.8998, 75.7856], "Mansarovar": [26.8668, 75.7564], "Sanganer": [26.8284, 75.7878],
    "Vaishali Nagar": [26.9123, 75.7423], "Malviya Nagar": [26.8512, 75.8123], "C-Scheme": [26.9056, 75.7912],
    "Jaipur Junction": [26.9198, 75.7878], "SMS Hospital": [26.9112, 75.7978], "Tonk Road": [26.8734, 75.7989],
    "Sodala": [26.9089, 75.7734], "Bani Park": [26.9312, 75.7934], "Sitapura": [26.7912, 75.8234],
};

const SLA_TIMEOUT_SECONDS = 30;

const getEventDescription = (type: EventType, location: string): string => {
    const d: Record<EventType, string> = {
        fire: `Fire outbreak detected at ${location}. Multiple heat signatures and smoke detected via CCTV.`,
        bomb_threat: `Suspicious unattended package reported at ${location}. Area requires immediate sweep.`,
        women_safety: `Distress signal received from ${location}. Female victim reports harassment.`,
        crowd_violence: `Aggressive crowd gathering detected at ${location}. Risk of civil unrest.`,
        terror_pattern: `Unusual pattern detected at ${location}. Multiple suspects identified via facial recognition.`,
        medical: `Medical emergency reported at ${location}. Victim requires immediate assistance.`,
        unknown: `Unclassified incident at ${location}. Requires manual assessment.`,
    };
    return d[type];
};

const getAIReasoning = (type: EventType): string => {
    const r: Record<EventType, string> = {
        fire: 'CCTV thermal analysis detected temperature spike >200°C. Smoke pattern consistent with structural fire.',
        bomb_threat: 'Object detection AI flagged unattended bag. Behavioral analysis shows suspect fled scene.',
        women_safety: 'Audio analysis detected distress keywords. GPS location matches reported area.',
        crowd_violence: 'Crowd density exceeded 500/100sqm. Movement patterns show aggressive behavior.',
        terror_pattern: 'Multiple flagged individuals detected in proximity. Movement pattern matches surveillance evasion.',
        medical: 'Emergency call audio analysis detected medical distress.',
        unknown: 'Multiple anomalies detected but pattern does not match known categories.',
    };
    return r[type];
};

interface HeatPoint { lat: number; lng: number; intensity: number; source: string; location: string; count: number; }

// ==================== MAP CONTROLLER ====================
function MapController({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16, { duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

// ==================== MAIN COMPONENT ====================
export default function CrossAgencyDashboard() {
    // Event and dashboard state (simplified)
    const [stats, setStats] = useState<any>(null);
    const [feed, setFeed] = useState<any[]>([]);
    const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
    const [mapReady, setMapReady] = useState(false);
    const [fusionRunning, setFusionRunning] = useState(false);
    const [fusionSummary, setFusionSummary] = useState<string>('');
    const [detectedPatterns, setDetectedPatterns] = useState<string[]>([]);
    const [shareTarget, setShareTarget] = useState<AgencyId | 'all'>('all');

    // Operational Overlay State
    const { user } = useAuth();
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
    const [mapFocus, setMapFocus] = useState<[number, number] | null>(null);
    const [notificationLog, setNotificationLog] = useState<string[]>([]);

    const handleEventClick = (point: HeatPoint) => {
        // Hydrate point with mock reasoning for the demo
        const type = point.intensity > 0.8 ? 'fire' : point.intensity > 0.6 ? 'crowd_violence' : 'unknown';
        const richEvent = {
            ...point,
            type,
            typeLabel: type === 'fire' ? 'Fire Emergency' : type === 'crowd_violence' ? 'Crowd Unrest' : 'Anomaly Detected',
            severity: point.intensity > 0.7 ? 'critical' : 'high',
            primaryAgency: type === 'fire' ? 'fire' : 'police',
            aiReasoning: point.intensity > 0.8
                ? "Thermal anomaly >400°C detected coordinating with smoke sensor activation."
                : "Abnormal movement patterns detected. Crowd density > 4ppl/m²."
        };
        setSelectedEvent(richEvent);
        setIsDrawerOpen(true);
    };

    const handleDispatch = (message: string, priority: string) => {
        console.log(`[DISPATCH] Priority: ${priority} | Msg: ${message}`);
        setNotificationLog(prev => [`[${new Date().toLocaleTimeString()}] ${priority.toUpperCase()}: ${message}`, ...prev]);
    };

    // Fetch dashboard data
    const fetchData = useCallback(async () => {
        try {
            const [statsData, feedData] = await Promise.all([api.getStats(), api.getFeed()]);
            setStats(statsData);
            setFeed(feedData.slice(0, 15));

            // Generate heat points from feed data
            const locationCounts: Record<string, { count: number; sources: Set<string> }> = {};
            feedData.forEach((item: any) => {
                const loc = item.location;
                if (loc && JAIPUR_LOCATIONS[loc]) {
                    if (!locationCounts[loc]) locationCounts[loc] = { count: 0, sources: new Set() };
                    locationCounts[loc].count++;
                    locationCounts[loc].sources.add(item.source);
                }
            });

            const points: HeatPoint[] = [];
            Object.entries(JAIPUR_LOCATIONS).forEach(([loc, coords]) => {
                let baseIntensity = 0.15;
                if (loc.includes('Bazaar') || loc.includes('Market') || loc.includes('Road')) baseIntensity = 0.4 + Math.random() * 0.3;
                else if (loc.includes('Fort') || loc.includes('Palace') || loc.includes('Mahal')) baseIntensity = 0.35 + Math.random() * 0.25;
                else if (loc.includes('Gate')) baseIntensity = 0.3 + Math.random() * 0.2;
                else if (loc.includes('Hospital') || loc.includes('Station')) baseIntensity = 0.45 + Math.random() * 0.3;
                if (locationCounts[loc]) baseIntensity = Math.min(locationCounts[loc].count / 5 + 0.3, 1.0);

                points.push({
                    lat: coords[0], lng: coords[1], intensity: baseIntensity,
                    source: locationCounts[loc] ? Array.from(locationCounts[loc].sources).join(', ') : 'monitoring',
                    location: loc, count: locationCounts[loc]?.count || 1
                });
                // Add surrounding micro-points
                for (let i = 0; i < 2; i++) {
                    points.push({
                        lat: coords[0] + (Math.random() - 0.5) * 0.008,
                        lng: coords[1] + (Math.random() - 0.5) * 0.008,
                        intensity: baseIntensity * (0.5 + Math.random() * 0.3),
                        source: 'ambient', location: loc, count: 1
                    });
                }
            });
            setHeatPoints(points);
        } catch (e) { console.error('Dashboard fetch error:', e); }
    }, []);

    // Initial load
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        const timer = setTimeout(() => setMapReady(true), 500);
        return () => { clearInterval(interval); clearTimeout(timer); };
    }, [fetchData]);

    // Intelligent fusion and sharing
    const runFusionAndShare = () => {
        if (fusionRunning) return;
        setFusionRunning(true);

        // Very lightweight "fusion" over current feed and heat points
        const sources = new Set(feed.map((f) => f.source));
        const highIntensityZones = heatPoints.filter((p) => p.intensity > 0.6).length;
        const socialAroundHotspots = feed.filter(
            (f) => f.source === 'social_media' && f.location && JAIPUR_LOCATIONS[f.location]
        ).length;

        const patterns: string[] = [];
        if (socialAroundHotspots > 5) {
            patterns.push('Possible misinformation / panic build-up near critical hotspots');
        }
        if (highIntensityZones > 10) {
            patterns.push('City-wide event escalation pattern across multiple zones');
        }
        if (sources.has('social_media') && sources.has('cctv') && sources.has('emergency')) {
            patterns.push('Cross-platform corroboration between CCTV, emergency calls and social chatter');
        }
        if (patterns.length === 0) {
            patterns.push('No strong cross-platform anomaly. Continue routine monitoring.');
        }

        setDetectedPatterns(patterns);

        const totalItems = feed.length;
        const shareLabel = shareTarget === 'all' ? 'all partner agencies' : AGENCIES[shareTarget].name;
        setFusionSummary(
            `Shared a fused intelligence snapshot (${totalItems} signals) with ${shareLabel}. ` +
            `AI fusion engine prioritised zones with overlapping CCTV, social and emergency signals ` +
            `to support coordinated, real-time response.`
        );

        setTimeout(() => setFusionRunning(false), 800);
    };

    // Helper functions
    const getSeverityColor = (severity: Severity) => {
        const c: Record<Severity, string> = { low: 'bg-blue-100 text-blue-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
        return c[severity];
    };

    const getEventTypeLabel = (type: EventType) => {
        const l: Record<EventType, { label: string; icon: any }> = {
            fire: { label: 'Fire Emergency', icon: Flame },
            bomb_threat: { label: 'Bomb Threat', icon: AlertOctagon },
            women_safety: { label: 'Women Safety', icon: ShieldAlert },
            crowd_violence: { label: 'Crowd Violence', icon: Users },
            terror_pattern: { label: 'Terror Pattern', icon: Target },
            medical: { label: 'Medical Emergency', icon: Activity },
            unknown: { label: 'Unknown Incident', icon: AlertTriangle },
        };
        return l[type];
    };

    const formatTime = (timestamp: string | Date) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        return date.toLocaleTimeString();
    };

    const getSourceBadge = (source: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            'social_media': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Social' },
            'cctv': { bg: 'bg-red-50', text: 'text-red-700', label: 'CCTV' },
            'emergency': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Emergency' },
            'police': { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Police' },
        };
        return badges[source] || { bg: 'bg-slate-100', text: 'text-slate-600', label: source };
    };

    return (
        <div className="flex-1 bg-slate-50 overflow-y-auto relative h-full">


            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">Cross-Agency Situational Awareness</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Real-time multi-agency view of Jaipur with AI-powered fusion across CCTV, social and emergency feeds.
                        </p>
                    </div>

                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Heatmap Section */}
                    <div className="col-span-8">
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">Jaipur Thermal Activity Map</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Cross-agency event density • Thermal imaging view</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 mr-1">Activity:</span>
                                    <div className="w-32 h-3 rounded-full" style={{ background: 'linear-gradient(to right, #000004, #4a0c6b, #a52c60, #ed6925, #f7d13d, #ffffcc)' }} />
                                    <div className="flex text-[10px] text-slate-500 gap-4 ml-1">
                                        <span>Cold</span><span>Hot</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[400px] relative">
                                {mapReady && (
                                    <MapContainer center={[26.9124, 75.7873]} zoom={12} style={{ height: '100%', width: '100%' }}>
                                        <MapController center={mapFocus} />
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                                        {heatPoints.length > 0 && <HeatmapLayer points={heatPoints.map(p => ({ lat: p.lat, lng: p.lng, intensity: p.intensity }))} />}
                                        {heatPoints.filter(p => p.count > 2).map((point, idx) => {
                                            const getThermalColor = (i: number) => {
                                                if (i > 0.8) return { fill: '#ffffcc', stroke: '#f7d13d' };
                                                if (i > 0.6) return { fill: '#fb9b06', stroke: '#ed6925' };
                                                if (i > 0.4) return { fill: '#cf4446', stroke: '#a52c60' };
                                                if (i > 0.25) return { fill: '#781c6d', stroke: '#4a0c6b' };
                                                return { fill: '#1b0c41', stroke: '#000004' };
                                            };
                                            const colors = getThermalColor(point.intensity);
                                            return (
                                                <CircleMarker key={idx} center={[point.lat, point.lng]} radius={Math.min(6 + point.count * 1.5, 18)}
                                                    pathOptions={{ fillColor: colors.fill, fillOpacity: 0.75, color: colors.stroke, weight: 2 }}
                                                    eventHandlers={{
                                                        click: () => {
                                                            // Also trigger drawer on click
                                                            handleEventClick(point);
                                                        }
                                                    }}
                                                >
                                                    <Popup>
                                                        <div className="text-slate-800 min-w-[160px]">
                                                            <p className="font-semibold text-sm">{point.location}</p>
                                                            <p className="text-xs text-slate-600 mt-1"><strong>{point.count}</strong> events</p>
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block mb-2"
                                                                style={{ backgroundColor: colors.fill, color: point.intensity > 0.5 ? '#000' : '#fff' }}>
                                                                {(point.intensity * 100).toFixed(0)}% Intensity
                                                            </span>
                                                            <button
                                                                onClick={() => handleEventClick(point)}
                                                                className="w-full mt-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                                                            >
                                                                <Microscope className="w-3 h-3" />
                                                                Operational View
                                                            </button>
                                                        </div>
                                                    </Popup>
                                                </CircleMarker>
                                            );
                                        })}
                                    </MapContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="col-span-4 space-y-4">
                        {/* Live Intel Feed */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-[400px] flex flex-col">
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Live Intel Feed</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium text-slate-500 uppercase">Real-time</span>
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-200" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                {feed.slice(0, 8).map((item, idx) => {
                                    const badge = getSourceBadge(item.source);
                                    return (
                                        <div key={idx} className="mb-2 last:mb-0 p-3 rounded-lg border border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${badge.bg} ${badge.text}`}>{badge.label}</span>
                                                <span className="text-[10px] text-slate-400 font-mono group-hover:text-blue-400 transition-colors">{formatTime(item.timestamp)}</span>
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed mb-2 font-medium">{item.content}</p>
                                            {item.location && (
                                                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50">
                                                    <MapPin className="w-3 h-3 text-slate-400" />
                                                    <span className="text-[10px] text-slate-500 font-medium">{item.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Fusion analytics & pattern detection */}

                    </div>
                </div>

                {/* Agency Alert Composer */}
                <AgencyAlertComposer />

            </div>
            {/* Overlays */}
            <EventDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                event={selectedEvent}
                userAgency={user?.agency || 'police'}
                onDispatch={() => setIsDispatchModalOpen(true)}
            />

            <DispatchModal
                isOpen={isDispatchModalOpen}
                onClose={() => setIsDispatchModalOpen(false)}
                event={selectedEvent}
                userAgency={user?.agency || 'police'}
                onSend={handleDispatch}
            />
        </div>
    );
}
