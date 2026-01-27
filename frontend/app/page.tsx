"use client";
import Feed from '@/components/Feed';
import LiveMap from '@/components/Map';
import Stats from '@/components/Stats';
import GraphViz from '@/components/GraphViz';
import SocialScraper from '@/components/SocialScraper';
import CCTVGrid from '@/components/CCTVGrid';
import FIRSystem from '@/components/FIRSystem';
import CDRAnalyzer from '@/components/CDRAnalyzer';
import AIMLEngine from '@/components/AIMLEngine';
import LinkAnalysis from '@/components/LinkAnalysis';
import CrossAgencyDashboard from '@/components/CrossAgencyDashboard';
import EntityExtraction from '@/components/EntityExtraction';
import VideoIntel from '@/components/VideoIntel';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { LayoutDashboard, Database, Network, Cpu, Shield, ArrowLeft, Link2, LogOut, User, Brain, MonitorPlay, AlertCircle } from 'lucide-react';
import { getRoleBadgeColor, getAgencyColor } from '@/lib/auth';

export default function Home() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated, logout } = useAuth();

    const [alerts, setAlerts] = useState<any[]>([]);
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    // Default view is Ingestion as per user request to focus there first
    const [activeView, setActiveView] = useState('ingestion');
    const [subView, setSubView] = useState<string | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const data = await api.getAlerts();
                setAlerts(data);

                const gData = await api.getGraph();
                setGraphData(prev => {
                    if (prev.nodes.length !== gData.nodes.length || prev.links.length !== gData.links.length) {
                        return gData;
                    }
                    return prev;
                });
            } catch (e) { }
        };

        // Always do a one-time fetch on mount / view change
        fetchAlerts();

        // Only enable background polling on views that actually need live alerts
        // Disable polling on heavy analytics views like AI Engine and Link Analysis
        if (activeView === 'ingestion' || activeView === 'dashboard') {
            const intervalId = setInterval(() => {
                fetchAlerts();
            }, 30000); // 30s polling only for operational views

            return () => clearInterval(intervalId);
        }

        return undefined;
    }, [activeView]);

    // Placeholder View Components
    const IngestionView = () => (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 font-sans">Data Ingestion Pipelines</h2>
            <div className="grid grid-cols-2 gap-6">
                {/* CCTV */}
                <div
                    onClick={() => setSubView('cctv')}
                    className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-blue-200"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l5-5V21l-5-5" /><path d="M14 10l-10 0a2 2 0 0 0 -2 2l0 8a2 2 0 0 0 2 2l10 0a2 2 0 0 0 2 -2l0 -8a2 2 0 0 0 -2 -2z" /></svg>
                        </div>
                        <h3 className="font-semibold text-slate-900">CCTV Surveillance</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Connect to automated video feed analysis for anomaly detection.</p>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded text-sm hover:bg-slate-800 transition-colors">Manage Feeds</button>
                    <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Active: 6 Cameras
                    </div>
                </div>

                {/* Social Scraper */}
                <div
                    onClick={() => setSubView('social-scraper')}
                    className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-indigo-200"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3" /></svg>
                        </div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Social Media Scraper</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 group-hover:text-slate-600">Real-time keyword monitoring on X, Instagram, and Telegram.</p>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded text-sm group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors border border-slate-200 group-hover:border-indigo-100">Configure Scrapers</button>
                    <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Status: Idle
                    </div>
                </div>

                {/* FIR Records */}
                <div
                    onClick={() => setSubView('fir')}
                    className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-orange-200"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><line x1="9" y1="9" x2="10" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>
                        </div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-orange-700 transition-colors">FIR Records</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 group-hover:text-slate-600">Sync with CCTNS database for criminal records and FIRs.</p>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded text-sm hover:bg-slate-800 transition-colors">Access CCTNS</button>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 font-medium">
                        Last Sync: 2 hours ago
                    </div>
                </div>

                {/* CDR Logs */}
                <div
                    onClick={() => setSubView('cdr')}
                    className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-purple-200"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" /></svg>
                        </div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">CDR Analysis</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 group-hover:text-slate-600">Upload and analyze Call Detail Records for link mapping.</p>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded text-sm hover:bg-slate-800 transition-colors">Upload Logs</button>
                    <div className="mt-4 flex items-center gap-2 text-xs text-purple-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                        AI Engine Ready
                    </div>
                </div>
            </div>
        </div>
    );

    const AIView = () => (
        <AIMLEngine />
    );

    const LinkAnalysisView = () => (
        <LinkAnalysis />
    );

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">

            {/* Sidebar - Light Mode Government Style */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-3">
                        <img src="/bprd-logo.png" alt="BPRD Logo" className="w-8 h-auto object-contain" />
                        <span className="tracking-tight font-extrabold text-slate-800 uppercase">Sanket</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavButton
                        active={activeView === 'ingestion'}
                        onClick={() => { setActiveView('ingestion'); setSubView(null); }}
                        icon={<Database size={18} />}
                        label="Data Ingestion"
                    />
                    <NavButton
                        active={activeView === 'ai'}
                        onClick={() => { setActiveView('ai'); setSubView(null); }}
                        icon={<Cpu size={18} />}
                        label="AI-ML Engine"
                    />
                    <NavButton
                        active={activeView === 'video-intel'}
                        onClick={() => { setActiveView('video-intel'); setSubView(null); }}
                        icon={<MonitorPlay size={18} />}
                        label="Video Intel"
                    />
                    <NavButton
                        active={activeView === 'entity-extraction'}
                        onClick={() => { setActiveView('entity-extraction'); setSubView(null); }}
                        icon={<Brain size={18} />}
                        label="Entity Extraction"
                    />
                    <NavButton
                        active={activeView === 'link-analysis'}
                        onClick={() => { setActiveView('link-analysis'); setSubView(null); }}
                        icon={<Link2 size={18} />}
                        label="Link Analysis"
                    />
                    <NavButton
                        active={activeView === 'graph'}
                        onClick={() => { setActiveView('graph'); setSubView(null); }}
                        icon={<Network size={18} />}
                        label="Graph View"
                    />
                    <NavButton
                        active={activeView === 'dashboard'}
                        onClick={() => { setActiveView('dashboard'); setSubView(null); }}
                        icon={<LayoutDashboard size={18} />}
                        label="Dashboard"
                    />
                </nav>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    {user && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-lg text-white flex items-center justify-center font-bold text-xs"
                                    style={{ backgroundColor: getAgencyColor(user.agency) }}
                                >
                                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                                    <p className="text-[10px] text-slate-500">{user.agencyName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getRoleBadgeColor(user.role)}`}>
                                    {user.role.toUpperCase()}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-600 font-medium">
                                    {user.clearance}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 z-10 shadow-sm">
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg uppercase tracking-tight">
                            {activeView === 'ingestion' && 'Data Ingestion'}
                            {activeView === 'ai' && 'AI Intelligence Engine'}
                            {activeView === 'video-intel' && 'Video Pipeline & Stream Analysis'}
                            {activeView === 'entity-extraction' && 'Entity Extraction & NLP'}
                            {activeView === 'link-analysis' && 'Link Analysis'}
                            {activeView === 'graph' && 'Graph View'}
                            {activeView === 'dashboard' && 'Operational Dashboard'}
                        </h2>
                        <span className="text-xs text-slate-500 font-medium">Inter-Agency Intelligence Platform</span>
                    </div>
                    <div className="flex items-center gap-6">
                        {alerts.length > 0 && (
                            <div className="flex items-center gap-3 px-3 py-1.5 bg-red-50/80 border border-red-200/60 rounded-lg shadow-sm backdrop-blur-sm cursor-pointer hover:bg-red-100/50 transition-colors group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20"></div>
                                    <div className="relative p-1 bg-red-100 rounded-full">
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-extrabold text-red-800 uppercase tracking-wider">Active Threat Detected</span>
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white shadow-sm">{alerts.length}</span>
                                    </div>
                                    <span className="text-xs font-medium text-red-700/90 max-w-[240px] truncate group-hover:underline decoration-red-400/50 underline-offset-2">
                                        {alerts[alerts.length - 1].title}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="h-8 w-[1px] bg-slate-200"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs font-semibold text-slate-600">SYSTEM ONLINE</span>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 p-0 overflow-hidden flex flex-col">
                    {activeView === 'ingestion' && (
                        subView === 'social-scraper' ? (
                            <div className="h-full flex flex-col">
                                <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-2 bg-white sticky top-0 z-10">
                                    <button onClick={() => setSubView(null)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                        <ArrowLeft size={18} />
                                    </button>
                                    <span className="text-sm font-semibold text-slate-700">Back to Ingestion</span>
                                    <span className="text-slate-300 mx-2">|</span>
                                    <span className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                        Social Media Intelligence
                                    </span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <SocialScraper />
                                </div>
                            </div>
                        ) : subView === 'cctv' ? (
                            <div className="h-full flex flex-col">
                                <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-2 bg-white sticky top-0 z-10">
                                    <button onClick={() => setSubView(null)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                        <ArrowLeft size={18} />
                                    </button>
                                    <span className="text-sm font-semibold text-slate-700">Back to Ingestion</span>
                                    <span className="text-slate-300 mx-2">|</span>
                                    <span className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        CCTV Surveillance Matrix
                                    </span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <CCTVGrid />
                                </div>
                            </div>
                        ) : subView === 'fir' ? (
                            <div className="h-full flex flex-col">
                                <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-2 bg-white sticky top-0 z-10">
                                    <button onClick={() => setSubView(null)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                        <ArrowLeft size={18} />
                                    </button>
                                    <span className="text-sm font-semibold text-slate-700">Back to Ingestion</span>
                                    <span className="text-slate-300 mx-2">|</span>
                                    <span className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                        CCTNS Digital Records
                                    </span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <FIRSystem />
                                </div>
                            </div>
                        ) : subView === 'cdr' ? (
                            <div className="h-full flex flex-col">
                                <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-2 bg-white sticky top-0 z-10">
                                    <button onClick={() => setSubView(null)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                        <ArrowLeft size={18} />
                                    </button>
                                    <span className="text-sm font-semibold text-slate-700">Back to Ingestion</span>
                                    <span className="text-slate-300 mx-2">|</span>
                                    <span className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                        CDR Analysis Suite
                                    </span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <CDRAnalyzer />
                                </div>
                            </div>
                        ) : (
                            <IngestionView />
                        )
                    )}
                    {activeView === 'ai' && <AIView />}
                    {activeView === 'video-intel' && <VideoIntel />}
                    {activeView === 'entity-extraction' && <EntityExtraction />}
                    {activeView === 'link-analysis' && <LinkAnalysisView />}
                    {activeView === 'graph' && (
                        <div className="flex-1 overflow-hidden p-6">
                            {/* Temporary dark mode wrapper for graph until Component updated */}
                            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                <GraphViz data={graphData} />
                            </div>
                        </div>
                    )}
                    {activeView === 'dashboard' && (
                        <CrossAgencyDashboard />
                    )}
                </div>
            </main>
        </div>
    );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${active
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
