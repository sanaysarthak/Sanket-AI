"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Network, RefreshCw, AlertTriangle, TrendingUp, Activity,
    Link2, Target, Zap, Map, Shield, Eye, Clock,
    GitBranch, Layers, Radio, Crosshair, BarChart3,
    AlertCircle, CheckCircle, XCircle, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, Legend,
    Treemap, RadialBarChart, RadialBar,
    AreaChart, Area, ComposedChart, Bar, Line,
    PieChart, Pie, Sankey, Rectangle
} from 'recharts';
import dynamic from 'next/dynamic';

// Dynamic import for force graph (client-side only)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// Color palettes
const SEVERITY_COLORS = {
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', fill: '#ef4444' },
    high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', fill: '#f97316' },
    medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', fill: '#eab308' },
    low: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', fill: '#22c55e' }
};

const SOURCE_COLORS = {
    cctv: '#3b82f6',
    emergency: '#ef4444',
    fir: '#f59e0b',
    social: '#8b5cf6'
};

const GRADIENT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308'];

// Type definitions
interface LinkAnalysisData {
    timestamp: string;
    data_sources: string[];
    correlations: any;
    timeline: any;
    threats: any;
    network: any;
    hotspots: any;
    event_flow: any;
    summary: any;
}

// In-memory cache so revisiting the Link Analysis view is instant
let cachedLinkAnalysis: LinkAnalysisData | null = null;

// Custom Treemap content renderer
const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, value, depth } = props;
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];
    const color = colors[depth % colors.length];
    
    if (width < 30 || height < 30) return null;
    
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: color,
                    stroke: '#1e293b',
                    strokeWidth: 2,
                    opacity: 0.85
                }}
                rx={4}
            />
            {width > 50 && height > 30 && (
                <>
                    <text
                        x={x + width / 2}
                        y={y + height / 2 - 6}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={12}
                        fontWeight="bold"
                    >
                        {name?.substring(0, 15)}
                    </text>
                    <text
                        x={x + width / 2}
                        y={y + height / 2 + 10}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={10}
                        opacity={0.8}
                    >
                        {value}
                    </text>
                </>
            )}
        </g>
    );
};

// Card component adapted for light theme
const GlassCard = ({ children, className = '', gradient = false }: { children: React.ReactNode, className?: string, gradient?: boolean }) => (
    <div className={`
        relative overflow-hidden rounded-xl 
        ${gradient ? 'bg-gradient-to-br from-white via-slate-50 to-slate-100' : 'bg-white'}
        border border-slate-200 shadow-sm
        ${className}
    `}>
        {gradient && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        )}
        <div className="relative z-10">{children}</div>
    </div>
);

// Stat Badge Component
const StatBadge = ({ label, value, icon: Icon, color = 'blue', trend = '' }: any) => (
    <GlassCard className="p-4" gradient>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
                {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
            </div>
            <div className={`p-2 rounded-lg bg-${color}-50`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
        </div>
    </GlassCard>
);

// Threat Level Indicator
const ThreatLevelIndicator = ({ level, score }: { level: string, score: number }) => {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const activeIndex = levels.indexOf(level);
    
    return (
        <GlassCard className="p-6" gradient>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Overall Threat Level</h3>
                <span className={`
                    px-3 py-1 rounded-full text-sm font-bold
                    ${level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                      level === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                      level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'}
                `}>
                    {level}
                </span>
            </div>
            <div className="flex gap-2 mb-4">
                {levels.map((l, i) => (
                    <div
                        key={l}
                        className={`
                            flex-1 h-3 rounded-full transition-all duration-500
                            ${i <= activeIndex ? 
                              (l === 'CRITICAL' ? 'bg-red-500' :
                               l === 'HIGH' ? 'bg-orange-500' :
                               l === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500') :
                              'bg-slate-200'}
                        `}
                    />
                ))}
            </div>
            <p className="text-sm text-slate-600">
                Composite Score: <span className="text-slate-900 font-bold">{score}</span> / 20
            </p>
        </GlassCard>
    );
};

// Timeline Event Component
const TimelineEvent = ({ event, index }: { event: any, index: number }) => (
    <div className="flex gap-4 group">
        <div className="flex flex-col items-center">
            <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg"
                style={{ backgroundColor: event.color + '30', borderColor: event.color, borderWidth: 2 }}
            >
                {event.icon}
            </div>
            {index < 9 && <div className="w-0.5 h-16 bg-slate-200 group-hover:bg-slate-300 transition-colors" />}
        </div>
        <div className="flex-1 pb-6">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-500">{event.timestamp?.substring(11, 19)}</span>
                <span className={`
                    px-2 py-0.5 rounded text-xs font-medium
                    ${SEVERITY_COLORS[event.severity as keyof typeof SEVERITY_COLORS]?.bg}
                    ${SEVERITY_COLORS[event.severity as keyof typeof SEVERITY_COLORS]?.text}
                `}>
                    {event.severity?.toUpperCase()}
                </span>
            </div>
            <p className="text-sm text-slate-700">{event.description}</p>
            <p className="text-xs text-slate-500 mt-1">{event.location}</p>
        </div>
    </div>
);

// Correlation Matrix Component
const CorrelationMatrix = ({ matrix }: { matrix: any }) => {
    const sources = Object.keys(matrix || {});
    if (sources.length === 0) return null;
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr>
                        <th className="p-2 text-left text-xs text-slate-500"></th>
                        {sources.map(s => (
                            <th key={s} className="p-2 text-center text-xs text-slate-400 uppercase">{s}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sources.map(s1 => (
                        <tr key={s1}>
                            <td className="p-2 text-xs text-slate-400 uppercase font-medium">{s1}</td>
                            {sources.map(s2 => {
                                const val = matrix[s1]?.[s2] || (s1 === s2 ? 1 : 0);
                                const opacity = Math.min(val, 1);
                                return (
                                    <td key={s2} className="p-2">
                                        <div 
                                            className="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
                                            style={{ 
                                                backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                                                color: opacity > 0.5 ? '#fff' : '#94a3b8'
                                            }}
                                        >
                                            {(val * 100).toFixed(0)}%
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Tab components
type TabType = 'overview' | 'correlations' | 'timeline' | 'threats' | 'network' | 'hotspots';

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
            ${active 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
        `}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

export default function LinkAnalysis() {
    const [data, setData] = useState<LinkAnalysisData | null>(() => cachedLinkAnalysis);
    const [loading, setLoading] = useState(!cachedLinkAnalysis);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const graphRef = useRef<any>(null);

    const fetchData = useCallback(async (showLoader: boolean = !cachedLinkAnalysis) => {
        if (showLoader) setLoading(true);
        setError(null);
        try {
            const result = await api.getLinkAnalysisFull();
            if (result.error) {
                setError(result.error);
            } else {
                setData(result);
                cachedLinkAnalysis = result;
            }
        } catch (e: any) {
            setError(e.message || 'Failed to fetch link analysis');
        }
        if (showLoader) setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" style={{ animationDuration: '0.6s' }}></div>
                        <Network className="absolute inset-0 m-auto w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Cross-Source Links...</h3>
                    <p className="text-sm text-slate-600">Building entity relationships and correlations</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Analysis Error</h3>
                    <p className="text-sm text-slate-600 mb-4">{error}</p>
                    <button 
                        onClick={() => fetchData(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Retry Analysis
                    </button>
                </div>
            </div>
        );
    }

    const summary = data?.summary || {};
    const correlations = data?.correlations || {};
    const timeline = data?.timeline || {};
    const threats = data?.threats || {};
    const network = data?.network || {};
    const hotspots = data?.hotspots || {};
    const eventFlow = data?.event_flow || {};

    // Overview Tab
    const OverviewTab = () => (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBadge 
                    label="Total Records" 
                    value={summary.total_records?.toLocaleString() || 0} 
                    icon={Layers}
                    color="blue"
                />
                <StatBadge 
                    label="Correlations Found" 
                    value={summary.correlations_found || 0} 
                    icon={Link2}
                    color="purple"
                />
                <StatBadge 
                    label="Hotspots Detected" 
                    value={summary.hotspots_detected || 0} 
                    icon={Crosshair}
                    color="orange"
                />
                <StatBadge 
                    label="Network Nodes" 
                    value={summary.network_nodes || 0} 
                    icon={GitBranch}
                    color="cyan"
                />
            </div>

            {/* Threat Level + Correlation Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ThreatLevelIndicator 
                    level={threats.overall_threat_level || 'LOW'} 
                    score={threats.overall_threat_score || 0}
                />
                
                <GlassCard className="p-6" gradient>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Source Correlation Matrix</h3>
                    <CorrelationMatrix matrix={correlations.correlation_matrix} />
                </GlassCard>
            </div>

            {/* Treemap + Flow Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-6" gradient>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Event Distribution Treemap</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={eventFlow.treemap_data || []}
                                dataKey="value"
                                aspectRatio={4/3}
                                stroke="#1e293b"
                                content={<CustomTreemapContent />}
                            />
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard className="p-6" gradient>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Event Flow Pipeline</h3>
                    <div className="space-y-4">
                        {(eventFlow.flow_data || []).map((flow: any, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-slate-900">{flow.source}</span>
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-medium text-slate-900">{flow.target}</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                            style={{ width: `${Math.min((flow.value / 50) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{flow.value} events linked</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Scatter Plot - Hotspots */}
            <GlassCard className="p-6" gradient>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Geographic Hotspot Analysis (Scatter)</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                                type="number" 
                                dataKey="x" 
                                name="Longitude" 
                                domain={['auto', 'auto']}
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                label={{ value: 'Longitude', position: 'bottom', fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis 
                                type="number" 
                                dataKey="y" 
                                name="Latitude"
                                domain={['auto', 'auto']}
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                label={{ value: 'Latitude', angle: -90, position: 'left', fill: '#64748b', fontSize: 12 }}
                            />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} name="Score" />
                            <Tooltip 
                                cursor={{ strokeDasharray: '3 3', stroke: '#64748b' }}
                                contentStyle={{ 
                                    backgroundColor: '#ffffff', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 40px rgba(15,23,42,0.08)'
                                }}
                                labelStyle={{ color: '#0f172a' }}
                            />
                            <Scatter name="Hotspots" data={hotspots.scatter_data || []} fill="#ef4444">
                                {(hotspots.scatter_data || []).map((entry: any, index: number) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={
                                            entry.severity === 'critical' ? '#ef4444' :
                                            entry.severity === 'high' ? '#f97316' :
                                            entry.severity === 'medium' ? '#eab308' : '#22c55e'
                                        }
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
    );

    // Correlations Tab
    const CorrelationsTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBadge label="Total Correlations" value={correlations.total_correlations || 0} icon={Link2} color="blue" />
                <StatBadge label="Strong Links" value={correlations.strong_correlations || 0} icon={Zap} color="yellow" />
                <StatBadge label="Sources Linked" value={summary.sources_analyzed || 0} icon={Layers} color="purple" />
                <StatBadge label="Avg Strength" value={`${((correlations.correlations?.[0]?.strength || 0.5) * 100).toFixed(0)}%`} icon={Activity} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-6" gradient>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Correlation Matrix</h3>
                    <CorrelationMatrix matrix={correlations.correlation_matrix} />
                </GlassCard>

                <GlassCard className="p-6" gradient>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Correlation Strength Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={(correlations.correlations || []).slice(0, 20).map((c: any, i: number) => ({
                                index: i + 1,
                                strength: c.strength * 100,
                                distance: c.distance_km
                            }))}>
                                <defs>
                                    <linearGradient id="strengthGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="index" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="strength" 
                                    stroke="#8b5cf6" 
                                    fill="url(#strengthGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>

            {/* Top Correlations Table */}
            <GlassCard className="p-6" gradient>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Top Correlations</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 uppercase">
                                <th className="p-3">Source 1</th>
                                <th className="p-3">Source 2</th>
                                <th className="p-3">Distance</th>
                                <th className="p-3">Time Diff</th>
                                <th className="p-3">Strength</th>
                                <th className="p-3">Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(correlations.correlations || []).slice(0, 15).map((c: any, i: number) => (
                                <tr key={i} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                                    <td className="p-3">
                                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: SOURCE_COLORS[c.source1 as keyof typeof SOURCE_COLORS] + '30', color: SOURCE_COLORS[c.source1 as keyof typeof SOURCE_COLORS] }}>
                                            {c.source1}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: SOURCE_COLORS[c.source2 as keyof typeof SOURCE_COLORS] + '30', color: SOURCE_COLORS[c.source2 as keyof typeof SOURCE_COLORS] }}>
                                            {c.source2}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-slate-600">{c.distance_km} km</td>
                                    <td className="p-3 text-sm text-slate-600">{c.time_diff_hours}h</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                                                    style={{ width: `${c.strength * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-500">{(c.strength * 100).toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-slate-600">{c.location}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );

    // Timeline Tab
    const TimelineTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBadge label="Total Events" value={timeline.total_events || 0} icon={Clock} color="blue" />
                <StatBadge label="CCTV Events" value={timeline.source_counts?.cctv || 0} icon={Eye} color="cyan" />
                <StatBadge label="Emergency Calls" value={timeline.source_counts?.emergency || 0} icon={Radio} color="red" />
                <StatBadge label="FIR Records" value={timeline.source_counts?.fir || 0} icon={Shield} color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hourly Distribution */}
                <div className="lg:col-span-2">
                    <GlassCard className="p-6" gradient>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Hourly Event Distribution</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={timeline.hourly_distribution || []}>
                                    <defs>
                                        <linearGradient id="cctvGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        </linearGradient>
                                        <linearGradient id="emergencyGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} interval={2} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="cctv" name="CCTV" fill="url(#cctvGrad)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="emergency" name="Emergency" fill="url(#emergencyGrad)" radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="total" name="Total" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </div>

                {/* Event Timeline */}
                <GlassCard className="p-6 max-h-[450px] overflow-y-auto" gradient>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 sticky top-0 bg-white/95 border-b border-slate-200 py-2">Event Timeline</h3>
                    <div className="space-y-1">
                        {(timeline.events || []).slice(0, 10).map((event: any, i: number) => (
                            <TimelineEvent key={i} event={event} index={i} />
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );

    // Threats Tab
    const ThreatsTab = () => (
        <div className="space-y-6">
            <ThreatLevelIndicator 
                level={threats.overall_threat_level || 'LOW'} 
                score={threats.overall_threat_score || 0}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBadge label="Critical Threats" value={threats.severity_distribution?.critical || 0} icon={AlertCircle} color="red" />
                <StatBadge label="High Threats" value={threats.severity_distribution?.high || 0} icon={AlertTriangle} color="orange" />
                <StatBadge label="Medium Threats" value={threats.severity_distribution?.medium || 0} icon={Activity} color="yellow" />
                <StatBadge label="Detected Patterns" value={threats.detected_count || 0} icon={Target} color="purple" />
            </div>

            {/* Threat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(threats.threats || []).map((threat: any, i: number) => (
                    <GlassCard key={i} className={`p-5 ${threat.detected ? '' : 'opacity-50'}`} gradient>
                        <div className="flex items-start gap-4">
                            <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                                ${SEVERITY_COLORS[threat.severity as keyof typeof SEVERITY_COLORS]?.bg}
                                ${SEVERITY_COLORS[threat.severity as keyof typeof SEVERITY_COLORS]?.border}
                                border
                            `}>
                                {threat.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-slate-900">{threat.name}</h4>
                                    {threat.detected ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-slate-500" />
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 mb-3">{threat.description}</p>
                                
                                {/* Confidence Bar */}
                                <div className="mb-2">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-slate-500">Confidence</span>
                                        <span className={SEVERITY_COLORS[threat.severity as keyof typeof SEVERITY_COLORS]?.text}>
                                            {(threat.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ 
                                                width: `${threat.confidence * 100}%`,
                                                backgroundColor: SEVERITY_COLORS[threat.severity as keyof typeof SEVERITY_COLORS]?.fill
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Sources */}
                                <div className="flex flex-wrap gap-1">
                                    {(threat.sources_involved || []).map((src: string) => (
                                        <span 
                                            key={src}
                                            className="px-2 py-0.5 rounded text-xs"
                                            style={{ 
                                                backgroundColor: SOURCE_COLORS[src as keyof typeof SOURCE_COLORS] + '30',
                                                color: SOURCE_COLORS[src as keyof typeof SOURCE_COLORS]
                                            }}
                                        >
                                            {src}
                                        </span>
                                    ))}
                                </div>

                                {/* Evidence */}
                                {threat.evidence?.length > 0 && (
                                    <div className="mt-2 text-xs text-slate-500">
                                        {threat.evidence.map((e: string, j: number) => (
                                            <p key={j}>• {e}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );

    // Network Tab
    const NetworkTab = () => {
        const nodes = network.nodes || [];
        const links = network.links || [];

        const getConnectedStats = () => {
            if (!selectedNode) return null;
            const connectedNodeIds = new Set<string>();

            (links || []).forEach((link: any) => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                if (sourceId === selectedNode.id) connectedNodeIds.add(String(targetId));
                if (targetId === selectedNode.id) connectedNodeIds.add(String(sourceId));
            });

            const connectedNodes = nodes.filter((n: any) => connectedNodeIds.has(n.id));
            const locationCount = connectedNodes.filter((n: any) => n.type === 'location').length;
            const eventCount = connectedNodes.filter((n: any) => n.type === 'event').length;
            const sourceCount = connectedNodes.filter((n: any) => n.type === 'source').length;

            return {
                total: connectedNodes.length,
                locations: locationCount,
                events: eventCount,
                sources: sourceCount,
            };
        };

        const connectedStats = getConnectedStats();

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBadge label="Total Nodes" value={network.statistics?.total_nodes || 0} icon={GitBranch} color="blue" />
                    <StatBadge label="Total Links" value={network.statistics?.total_links || 0} icon={Link2} color="purple" />
                    <StatBadge label="Locations" value={network.statistics?.locations || 0} icon={Map} color="green" />
                    <StatBadge label="Multi-Source Hotspots" value={network.statistics?.multi_source_hotspots || 0} icon={Crosshair} color="red" />
                </div>

                <GlassCard className="p-6" gradient>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Entity Relationship Network</h3>
                    <div className="h-[500px] bg-slate-50 rounded-xl overflow-hidden">
                        {typeof window !== 'undefined' && nodes.length > 0 && (
                            <ForceGraph2D
                                ref={graphRef}
                                graphData={{
                                    nodes,
                                    links,
                                }}
                                nodeLabel={(node: any) => {
                                    const base = `${node.label || node.id}`;
                                    const type = node.type ? `\nType: ${node.type}` : '';
                                    const sources = node.sources?.length ? `\nSources: ${node.sources.join(', ')}` : '';
                                    return base + type + sources;
                                }}
                                nodeColor={(node: any) => node.color || '#3b82f6'}
                                nodeRelSize={4}
                                nodeVal={(node: any) => node.size || 10}
                                linkColor={(link: any) => {
                                    if (!selectedNode) return '#cbd5f5';
                                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                                    return sourceId === selectedNode.id || targetId === selectedNode.id ? '#0f766e' : '#e2e8f0';
                                }}
                                linkWidth={(link: any) => {
                                    if (!selectedNode) return 1;
                                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                                    return sourceId === selectedNode.id || targetId === selectedNode.id ? 2.5 : 1;
                                }}
                                linkDirectionalParticles={(link: any) => {
                                    if (!selectedNode) return 1;
                                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                                    return sourceId === selectedNode.id || targetId === selectedNode.id ? 4 : 1;
                                }}
                                linkDirectionalParticleSpeed={0.006}
                                linkDirectionalParticleWidth={2}
                                linkDirectionalParticleColor={() => '#22c55e'}
                                backgroundColor="transparent"
                                onNodeClick={(node: any) => {
                                    setSelectedNode(node);
                                    if (graphRef.current) {
                                        graphRef.current.centerAt(node.x, node.y, 1000);
                                        graphRef.current.zoom(2, 1000);
                                    }
                                }}
                            />
                        )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-xs text-slate-600">CCTV Source</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-xs text-slate-600">Emergency Source</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500" />
                                <span className="text-xs text-slate-600">FIR Source</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                <span className="text-xs text-slate-600">Social Source</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-xs text-slate-600">Multi-source Location</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                                <span className="text-xs text-slate-600">Event Type</span>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg p-3 bg-white/70">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Selected Node</h4>
                                {selectedNode && (
                                    <button
                                        className="text-[10px] text-slate-500 hover:text-slate-700 underline"
                                        onClick={() => setSelectedNode(null)}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            {!selectedNode && (
                                <p className="text-xs text-slate-500">Click on a node in the network to inspect its details and relationships.</p>
                            )}
                            {selectedNode && (
                                <div className="space-y-1 text-xs text-slate-600">
                                    <p className="text-sm font-semibold text-slate-900">{selectedNode.label || selectedNode.id}</p>
                                    {selectedNode.type && (
                                        <p><span className="font-medium">Type:</span> {selectedNode.type === 'source' ? 'Data Source' : selectedNode.type === 'location' ? 'Location' : 'Event Type'}</p>
                                    )}
                                    {selectedNode.sources?.length > 0 && (
                                        <p><span className="font-medium">Sources here:</span> {selectedNode.sources.join(', ')}</p>
                                    )}
                                    {connectedStats && (
                                        <>
                                            <p><span className="font-medium">Connected nodes:</span> {connectedStats.total}</p>
                                            <p className="text-[11px] text-slate-500">
                                                {connectedStats.sources} sources • {connectedStats.locations} locations • {connectedStats.events} event types
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </div>
        );
    };

    // Hotspots Tab
    const HotspotsTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBadge label="Total Hotspots" value={hotspots.total_hotspots || 0} icon={Crosshair} color="blue" />
                <StatBadge label="Critical" value={hotspots.critical_hotspots || 0} icon={AlertCircle} color="red" />
                <StatBadge label="High Risk" value={hotspots.high_hotspots || 0} icon={AlertTriangle} color="orange" />
                <StatBadge label="Medium Risk" value={hotspots.medium_hotspots || 0} icon={Activity} color="yellow" />
            </div>

            {/* Scatter Plot */}
            <GlassCard className="p-6" gradient>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Hotspot Scatter Analysis</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                                type="number" 
                                dataKey="x" 
                                name="Longitude" 
                                domain={['auto', 'auto']}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                            />
                            <YAxis 
                                type="number" 
                                dataKey="y" 
                                name="Latitude"
                                domain={['auto', 'auto']}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                            />
                            <ZAxis type="number" dataKey="z" range={[100, 500]} name="Score" />
                            <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                formatter={(value: any, name: string) => [
                                    name === 'z' ? `Score: ${value}` : value,
                                    name === 'x' ? 'Longitude' : name === 'y' ? 'Latitude' : 'Score'
                                ]}
                            />
                            <Scatter name="Hotspots" data={hotspots.scatter_data || []}>
                                {(hotspots.scatter_data || []).map((entry: any, index: number) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={
                                            entry.severity === 'critical' ? '#ef4444' :
                                            entry.severity === 'high' ? '#f97316' :
                                            entry.severity === 'medium' ? '#eab308' : '#22c55e'
                                        }
                                        fillOpacity={0.8}
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            {/* Hotspots Table */}
            <GlassCard className="p-6" gradient>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Hotspot Details</h3>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-slate-50">
                            <tr className="text-left text-xs text-slate-500 uppercase">
                                <th className="p-3">Severity</th>
                                <th className="p-3">Score</th>
                                <th className="p-3">Events</th>
                                <th className="p-3">Sources</th>
                                <th className="p-3">Breakdown</th>
                                <th className="p-3">Coordinates</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(hotspots.hotspots || []).map((h: any, i: number) => (
                                <tr key={i} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                                    <td className="p-3">
                                        <span className={`
                                            px-2 py-1 rounded text-xs font-bold
                                            ${SEVERITY_COLORS[h.severity as keyof typeof SEVERITY_COLORS]?.bg}
                                            ${SEVERITY_COLORS[h.severity as keyof typeof SEVERITY_COLORS]?.text}
                                        `}>
                                            {h.severity?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-3 font-bold text-slate-900">{h.hotspot_score}</td>
                                    <td className="p-3 text-slate-600">{h.total_events}</td>
                                    <td className="p-3 text-slate-600">{h.source_diversity}</td>
                                    <td className="p-3">
                                        <div className="flex gap-1 flex-wrap">
                                            {Object.entries(h.source_breakdown || {}).map(([src, count]: [string, any]) => (
                                                <span 
                                                    key={src}
                                                    className="px-2 py-0.5 rounded text-xs"
                                                    style={{ 
                                                        backgroundColor: SOURCE_COLORS[src as keyof typeof SOURCE_COLORS] + '30',
                                                        color: SOURCE_COLORS[src as keyof typeof SOURCE_COLORS]
                                                    }}
                                                >
                                                    {src}: {count}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 text-xs text-slate-500 font-mono">
                                        {h.latitude?.toFixed(4)}, {h.longitude?.toFixed(4)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );

    return (
        <div className="flex-1 bg-slate-100 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/90 border-b border-slate-200">
                <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                                    <Network className="w-6 h-6" />
                                </div>
                                Link Analysis Engine
                            </h1>
                            <p className="text-slate-600 text-sm mt-1">Cross-source correlation, entity linking & threat detection</p>
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Layers} label="Overview" />
                        <TabButton active={activeTab === 'correlations'} onClick={() => setActiveTab('correlations')} icon={Link2} label="Correlations" />
                        <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={Clock} label="Timeline" />
                        <TabButton active={activeTab === 'threats'} onClick={() => setActiveTab('threats')} icon={Shield} label="Threats" />
                        <TabButton active={activeTab === 'network'} onClick={() => setActiveTab('network')} icon={GitBranch} label="Network" />
                        <TabButton active={activeTab === 'hotspots'} onClick={() => setActiveTab('hotspots')} icon={Crosshair} label="Hotspots" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'correlations' && <CorrelationsTab />}
                {activeTab === 'timeline' && <TimelineTab />}
                {activeTab === 'threats' && <ThreatsTab />}
                {activeTab === 'network' && <NetworkTab />}
                {activeTab === 'hotspots' && <HotspotsTab />}
            </div>

            {/* Footer */}
            <div className="p-4 text-center text-xs text-slate-500">
                Last Updated: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
            </div>
        </div>
    );
}
