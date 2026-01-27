"use client";

import { useState, useEffect } from 'react';
import { 
    Cpu, RefreshCw, AlertTriangle, TrendingUp, Activity, 
    Camera, Phone, FileText, MessageSquare, Zap, Target,
    BarChart3, PieChart, LineChart, Map, Users, Radio,
    Shield, Flame, Eye, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPie, Pie, Cell, Legend,
    LineChart as RechartsLine, Line, AreaChart, Area,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ScatterChart, Scatter, ZAxis
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const SEVERITY_COLORS = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };

// Type definitions
interface AnalyticsData {
    cctv: any;
    emergency: any;
    fir: any;
    social_media: any;
    timestamp: string;
}

// Simple in-memory cache so revisiting the view is instant
let cachedAnalytics: AnalyticsData | null = null;


export default function AIMLEngine() {
    const [data, setData] = useState<AnalyticsData | null>(() => cachedAnalytics);
    const [loading, setLoading] = useState(!cachedAnalytics);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'cctv' | 'emergency' | 'fir' | 'social'>('overview');

    const fetchAnalytics = async (showLoader: boolean = !cachedAnalytics) => {
        if (showLoader) setLoading(true);
        setError(null);
        try {
            const result = await api.getFullAnalytics();
            if (result.error) {
                setError(result.error);
            } else {
                setData(result);
                cachedAnalytics = result;
            }
        } catch (e: any) {
            setError(e.message || 'Failed to fetch analytics');
        }
        if (showLoader) setLoading(false);
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" style={{ animationDuration: '0.6s' }}></div>
                    <h3 className="text-lg font-bold text-slate-800">Running AI-ML Analysis...</h3>
                    <p className="text-sm text-slate-500 mt-2">Processing 4 data sources with anomaly detection</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center text-red-600">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-lg font-bold">Analysis Error</h3>
                    <p className="text-sm mt-2">{error}</p>
                    <button onClick={() => fetchAnalytics(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                        <Cpu size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">AI-ML Analytics Engine</h2>
                        <p className="text-xs text-slate-500">Real-time anomaly detection across 4 data sources</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-500">
                        Last Updated: {new Date(data.timestamp).toLocaleTimeString()}
                    </div>
                    <button 
                        onClick={() => fetchAnalytics(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Refresh Analysis
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-slate-200 px-6 flex gap-1">
                {[
                    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
                    { id: 'cctv', label: 'CCTV Analysis', icon: <Camera size={16} /> },
                    { id: 'emergency', label: 'Emergency Calls', icon: <Phone size={16} /> },
                    { id: 'fir', label: 'FIR Records', icon: <FileText size={16} /> },
                    { id: 'social', label: 'Social Media', icon: <MessageSquare size={16} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id 
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && <OverviewTab data={data} />}
                {activeTab === 'cctv' && <CCTVTab data={data.cctv} />}
                {activeTab === 'emergency' && <EmergencyTab data={data.emergency} />}
                {activeTab === 'fir' && <FIRTab data={data.fir} />}
                {activeTab === 'social' && <SocialTab data={data.social_media} />}
            </div>
        </div>
    );
}

// ============================================================
// OVERVIEW TAB
// ============================================================
function OverviewTab({ data }: { data: AnalyticsData }) {
    const summaryCards = [
        {
            title: 'CCTV Events',
            value: data.cctv.total_records,
            anomalies: data.cctv.anomaly_count,
            icon: <Camera className="w-6 h-6" />,
            color: 'blue'
        },
        {
            title: 'Emergency Calls',
            value: data.emergency.total_records,
            anomalies: data.emergency.anomalies.length,
            icon: <Phone className="w-6 h-6" />,
            color: 'red'
        },
        {
            title: 'FIR Records',
            value: data.fir.total_records,
            anomalies: data.fir.high_priority_cases,
            icon: <FileText className="w-6 h-6" />,
            color: 'orange'
        },
        {
            title: 'Social Posts',
            value: data.social_media.total_records,
            anomalies: data.social_media.anomalies.length,
            icon: <MessageSquare className="w-6 h-6" />,
            color: 'purple'
        }
    ];

    // Prepare chart data
    const sourceComparisonData = [
        { name: 'CCTV', total: data.cctv.total_records, anomalies: data.cctv.anomaly_count },
        { name: 'Emergency', total: data.emergency.total_records, anomalies: data.emergency.anomalies.length },
        { name: 'FIR', total: data.fir.total_records, anomalies: data.fir.high_priority_cases },
        { name: 'Social', total: data.social_media.total_records, anomalies: data.social_media.anomalies.length }
    ];

    const severityData = Object.entries(data.cctv.severity_distribution).map(([key, value]) => ({
        name: key,
        value: value as number
    }));

    const crimeData = Object.entries(data.fir.crime_distribution).map(([key, value]) => ({
        name: key,
        value: value as number
    }));

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                {summaryCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg bg-${card.color}-100 text-${card.color}-600`} 
                                 style={{ backgroundColor: COLORS[i] + '20', color: COLORS[i] }}>
                                {card.icon}
                            </div>
                            <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded">
                                {card.anomalies} Anomalies
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                        <p className="text-sm text-slate-500 mt-1">{card.title} Analyzed</p>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-2 gap-6">
                {/* Source Comparison Bar Chart */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-blue-500" />
                        Data Source Analysis
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={sourceComparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="total" fill="#3b82f6" name="Total Records" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="anomalies" fill="#ef4444" name="Anomalies" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Severity Distribution Pie */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <PieChart size={18} className="text-orange-500" />
                        CCTV Severity Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                            <Pie
                                data={severityData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {severityData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={Object.values(SEVERITY_COLORS)[index] || COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-3 gap-6">
                {/* Crime Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Shield size={18} className="text-red-500" />
                        Crime Type Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={crimeData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" fontSize={12} />
                            <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Emergency Priority */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-yellow-500" />
                        Emergency Call Priority
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <RechartsPie>
                            <Pie
                                data={Object.entries(data.emergency.priority_distribution).map(([k, v]) => ({ name: k, value: v as number }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                dataKey="value"
                                label
                            >
                                {Object.keys(data.emergency.priority_distribution).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>

                {/* Social Sentiment */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-purple-500" />
                        Social Media Sentiment
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <RechartsPie>
                            <Pie
                                data={Object.entries(data.social_media.sentiment_distribution).map(([k, v]) => ({ name: k, value: v as number }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                dataKey="value"
                            >
                                {Object.keys(data.social_media.sentiment_distribution).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Key Insights */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Target size={20} />
                    Key AI Insights
                </h3>
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-2xl font-bold">{data.cctv.critical_event_count}</p>
                        <p className="text-sm text-white/80">Critical CCTV Events</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-2xl font-bold">{data.emergency.critical_analysis.total_critical}</p>
                        <p className="text-sm text-white/80">Critical Emergency Calls</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-2xl font-bold">{data.social_media.misinformation_analysis.total_count}</p>
                        <p className="text-sm text-white/80">Misinformation Detected</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-2xl font-bold">{data.fir.rioting_analysis.total_cases}</p>
                        <p className="text-sm text-white/80">Rioting Cases Filed</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// CCTV TAB
// ============================================================
function CCTVTab({ data }: { data: any }) {
    const eventData = Object.entries(data.event_distribution).map(([key, value]) => ({
        name: key.replace(/_/g, ' '),
        count: value as number
    })).sort((a, b) => b.count - a.count);

    const zoneData = Object.entries(data.zone_analysis).map(([key, value]: [string, any]) => ({
        zone: key,
        ...value
    }));

    const movementData = Object.entries(data.movement_patterns).map(([key, value]) => ({
        pattern: key,
        count: value as number
    }));

    const temporalData = Object.entries(data.temporal_pattern).map(([key, value]) => ({
        minute: parseInt(key),
        score: value as number
    })).sort((a, b) => a.minute - b.minute);

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-4">
                <StatCard label="Total Events" value={data.total_records} icon={<Camera />} color="blue" />
                <StatCard label="Anomalies Detected" value={data.anomaly_count} icon={<AlertTriangle />} color="red" />
                <StatCard label="Critical Events" value={data.critical_event_count} icon={<Flame />} color="orange" />
                <StatCard label="Avg Anomaly Score" value={data.mean_anomaly_score} icon={<TrendingUp />} color="purple" />
                <StatCard label="Danger Movements" value={data.danger_movement_count} icon={<Activity />} color="yellow" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-6">
                {/* Event Type Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Event Type Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={eventData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" fontSize={12} />
                            <YAxis type="category" dataKey="name" fontSize={10} width={150} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Temporal Pattern */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Anomaly Score Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={temporalData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="minute" fontSize={12} label={{ value: 'Minute', position: 'bottom' }} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Area type="monotone" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Zone Analysis Radar */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Zone Risk Analysis</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={zoneData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="zone" fontSize={11} />
                            <PolarRadiusAxis fontSize={10} />
                            <Radar name="Severity" dataKey="severity_score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                            <Radar name="Density" dataKey="density_score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                            <Legend />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Movement Patterns */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Movement Pattern Analysis</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPie>
                            <Pie
                                data={movementData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="count"
                                nameKey="pattern"
                                label={({ pattern, percent }) => `${pattern} ${(percent * 100).toFixed(0)}%`}
                            >
                                {movementData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Anomalies Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-500" />
                        Detected Anomalies (Top 15)
                    </h3>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                        Threshold: {data.anomaly_threshold}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Camera</th>
                                <th className="px-4 py-3 text-left">Location</th>
                                <th className="px-4 py-3 text-left">Event Type</th>
                                <th className="px-4 py-3 text-left">Crowd Density</th>
                                <th className="px-4 py-3 text-left">Severity</th>
                                <th className="px-4 py-3 text-left">Object</th>
                                <th className="px-4 py-3 text-left">Anomaly Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.anomalies.map((a: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs">{a.camera_id}</td>
                                    <td className="px-4 py-3 font-medium">{a.location}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                            {a.event_type.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            a.crowd_density === 'critical' || a.crowd_density === 'very_high' 
                                                ? 'bg-red-100 text-red-700' 
                                                : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {a.crowd_density}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            a.severity_level === 'critical' ? 'bg-red-100 text-red-700' :
                                            a.severity_level === 'high' ? 'bg-orange-100 text-orange-700' :
                                            a.severity_level === 'medium' ? 'bg-blue-100 text-blue-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {a.severity_level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs">{a.object_detected}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-slate-200 rounded-full h-2">
                                                <div 
                                                    className="bg-red-500 h-2 rounded-full" 
                                                    style={{ width: `${a.anomaly_score}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-bold text-red-600">{a.anomaly_score.toFixed(1)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// EMERGENCY TAB
// ============================================================
function EmergencyTab({ data }: { data: any }) {
    const callTypeData = Object.entries(data.call_type_distribution).map(([key, value]) => ({
        name: key,
        count: value as number
    }));

    const locationData = Object.entries(data.location_hotspots).map(([key, value]: [string, any]) => ({
        location: key,
        ...value
    }));

    const temporalData = Object.entries(data.temporal_pattern).map(([key, value]) => ({
        minute: key,
        calls: value as number
    }));

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-5 gap-4">
                <StatCard label="Total Calls" value={data.total_records} icon={<Phone />} color="blue" />
                <StatCard label="Critical Calls" value={data.critical_analysis.total_critical} icon={<AlertTriangle />} color="red" />
                <StatCard label="High Priority %" value={`${data.high_priority_percentage}%`} icon={<Zap />} color="orange" />
                <StatCard label="Avg Priority" value={data.stats.avg_priority_score} icon={<TrendingUp />} color="purple" />
                <StatCard label="Surge Threshold" value={data.surge_detection.threshold} icon={<Activity />} color="yellow" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
                {/* Call Type */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Call Type Distribution</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={callTypeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Location Hotspots */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Location Risk Scores</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={locationData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" fontSize={12} />
                            <YAxis type="category" dataKey="location" fontSize={11} width={120} />
                            <Tooltip />
                            <Bar dataKey="risk_score" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Temporal */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm col-span-2">
                    <h3 className="font-bold text-slate-800 mb-4">Call Volume Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsLine data={temporalData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="minute" fontSize={11} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        </RechartsLine>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Critical Anomalies */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-red-50">
                    <h3 className="font-bold text-red-800 flex items-center gap-2">
                        <Flame size={18} />
                        High-Risk Emergency Calls
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Call ID</th>
                                <th className="px-4 py-3 text-left">Time</th>
                                <th className="px-4 py-3 text-left">Location</th>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-left">Priority</th>
                                <th className="px-4 py-3 text-left">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.anomalies.map((a: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs">{a.call_id}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{a.timestamp}</td>
                                    <td className="px-4 py-3 font-medium">{a.location}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                            {a.call_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                                            {a.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">{a.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// FIR TAB
// ============================================================
function FIRTab({ data }: { data: any }) {
    const crimeData = Object.entries(data.crime_distribution).map(([key, value]) => ({
        name: key,
        count: value as number
    }));

    const stationData = Object.entries(data.station_analysis).map(([key, value]: [string, any]) => ({
        station: key,
        ...value
    }));

    const resolutionData = Object.entries(data.resolution_by_crime).map(([key, value]) => ({
        crime: key,
        rate: value as number
    }));

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-5 gap-4">
                <StatCard label="Total FIRs" value={data.total_records} icon={<FileText />} color="blue" />
                <StatCard label="High Priority" value={data.high_priority_cases} icon={<AlertTriangle />} color="red" />
                <StatCard label="Rioting Cases" value={data.rioting_analysis.total_cases} icon={<Users />} color="orange" />
                <StatCard label="Emergency Linked" value={data.emergency_linkage.linked_count} icon={<Radio />} color="purple" />
                <StatCard label="Linkage Rate" value={`${data.emergency_linkage.linkage_rate}%`} icon={<TrendingUp />} color="green" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-3 gap-6">
                {/* Crime Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Crime Type Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                            <Pie
                                data={crimeData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="count"
                                label
                            >
                                {crimeData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>

                {/* Resolution Rate */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Case Resolution Rate (%)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={resolutionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="crime" fontSize={11} />
                            <YAxis fontSize={12} domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Case Status</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                            <Pie
                                data={Object.entries(data.status_distribution).map(([k, v]) => ({ name: k, value: v as number }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                            >
                                {Object.keys(data.status_distribution).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Station Analysis */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Police Station Workload Analysis</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="station" fontSize={10} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_cases" fill="#3b82f6" name="Total Cases" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="closed_cases" fill="#10b981" name="Closed Cases" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* High Priority Cases Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-orange-50">
                    <h3 className="font-bold text-orange-800 flex items-center gap-2">
                        <Shield size={18} />
                        High Priority Cases (Active Investigation)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">FIR ID</th>
                                <th className="px-4 py-3 text-left">Station</th>
                                <th className="px-4 py-3 text-left">Crime Type</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Emergency Link</th>
                                <th className="px-4 py-3 text-left">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.anomalies.map((a: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs font-bold">{a.fir_id}</td>
                                    <td className="px-4 py-3 text-xs">{a.station_name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            a.crime_type === 'Rioting' ? 'bg-red-100 text-red-700' :
                                            a.crime_type === 'Assault' ? 'bg-orange-100 text-orange-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {a.crime_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            a.status === 'Investigating' ? 'bg-blue-100 text-blue-700' :
                                            a.status === 'Filed' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {a.emergency_call_linked ? (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-mono">
                                                {a.emergency_call_linked}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">{a.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// SOCIAL MEDIA TAB
// ============================================================
function SocialTab({ data }: { data: any }) {
    const platformData = Object.entries(data.platform_distribution).map(([key, value]) => ({
        name: key,
        count: value as number
    }));

    const topicData = Object.entries(data.topic_distribution).map(([key, value]) => ({
        topic: key.replace(/_/g, ' '),
        count: value as number
    })).sort((a, b) => b.count - a.count);

    const keywordData = Object.entries(data.keyword_frequency).slice(0, 12).map(([key, value]) => ({
        word: key,
        frequency: value as number
    }));

    const locationSentimentData = Object.entries(data.location_sentiment).map(([key, value]) => ({
        location: key,
        sentiment: value as number
    }));

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-6 gap-4">
                <StatCard label="Total Posts" value={data.total_records} icon={<MessageSquare />} color="blue" />
                <StatCard label="Avg Sentiment" value={data.stats.avg_sentiment} icon={<Activity />} color="purple" />
                <StatCard label="Misinformation" value={data.misinformation_analysis.total_count} icon={<AlertTriangle />} color="red" />
                <StatCard label="Viral Posts" value={data.virality_analysis.viral_count} icon={<TrendingUp />} color="orange" />
                <StatCard label="Crisis Posts" value={data.crisis_analysis.total_crisis_posts} icon={<Flame />} color="yellow" />
                <StatCard label="Negative %" value={`${data.stats.negative_post_pct}%`} icon={<XCircle />} color="pink" />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-3 gap-6">
                {/* Platform Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Platform Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                            <Pie
                                data={platformData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="count"
                                label
                            >
                                {platformData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>

                {/* Topic Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Topic Analysis</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topicData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" fontSize={12} />
                            <YAxis type="category" dataKey="topic" fontSize={10} width={100} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Keyword Cloud (as bar chart) */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Top Keywords (NLP)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={keywordData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" fontSize={12} />
                            <YAxis type="category" dataKey="word" fontSize={10} width={80} />
                            <Tooltip />
                            <Bar dataKey="frequency" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-2 gap-6">
                {/* Location Sentiment */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Sentiment by Location</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={locationSentimentData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="location" fontSize={10} />
                            <YAxis fontSize={12} domain={[-1, 1]} />
                            <Tooltip />
                            <Bar dataKey="sentiment" radius={[4, 4, 0, 0]}>
                                {locationSentimentData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.sentiment < 0 ? '#ef4444' : '#10b981'} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Misinformation Analysis */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-500" />
                        Misinformation Analysis
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-50 rounded-lg p-4">
                            <p className="text-3xl font-bold text-red-600">{data.misinformation_analysis.total_count}</p>
                            <p className="text-sm text-red-700">Total Flagged</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                            <p className="text-3xl font-bold text-orange-600">{data.misinformation_analysis.percentage}%</p>
                            <p className="text-sm text-orange-700">Of All Posts</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-slate-500 mb-2 font-medium">By Platform:</p>
                            <div className="flex gap-2 flex-wrap">
                                {Object.entries(data.misinformation_analysis.by_platform).map(([k, v]) => (
                                    <span key={k} className="px-2 py-1 bg-slate-100 rounded text-xs">
                                        {k}: <strong>{v as number}</strong>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Anomalies Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-purple-50">
                    <h3 className="font-bold text-purple-800 flex items-center gap-2">
                        <Eye size={18} />
                        Flagged Social Media Posts (High Risk)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Post ID</th>
                                <th className="px-4 py-3 text-left">Platform</th>
                                <th className="px-4 py-3 text-left">Content</th>
                                <th className="px-4 py-3 text-left">Location</th>
                                <th className="px-4 py-3 text-left">Topic</th>
                                <th className="px-4 py-3 text-left">Sentiment</th>
                                <th className="px-4 py-3 text-left">Engagement</th>
                                <th className="px-4 py-3 text-left">Misinfo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.anomalies.map((a: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs">{a.post_id}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                            {a.platform}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs max-w-xs truncate">{a.post_text}</td>
                                    <td className="px-4 py-3 text-xs">{a.location}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                            {a.detected_topic?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            a.sentiment_score < -0.3 ? 'bg-red-100 text-red-700' :
                                            a.sentiment_score > 0.3 ? 'bg-green-100 text-green-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {a.sentiment_score?.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">{a.engagement_count}</td>
                                    <td className="px-4 py-3">
                                        {a.is_misinformation === 1 ? (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">YES</span>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================
function StatCard({ label, value, icon, color }: { label: string; value: any; icon: React.ReactNode; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        red: 'bg-red-100 text-red-600',
        orange: 'bg-orange-100 text-orange-600',
        purple: 'bg-purple-100 text-purple-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        pink: 'bg-pink-100 text-pink-600',
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
        </div>
    );
}
