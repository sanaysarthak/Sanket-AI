"use client";

import { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Square, Activity, Globe, Hash, LayoutList, FileJson } from 'lucide-react';
import { api } from '../lib/api';

const JAIPUR_TARGETS = [
    { id: 1, handle: "@jaipur_police", platform: "X (Twitter)", type: "Official", status: "Active" },
    { id: 2, handle: "@Traffic_JPR", platform: "X (Twitter)", type: "Traffic", status: "Active" },
    { id: 3, handle: "@JaipurBuzz", platform: "Instagram", type: "City Info", status: "Idle" },
    { id: 4, handle: "r/jaipur", platform: "Reddit", type: "Community", status: "Active" },
    { id: 5, handle: "@NagarNigamJpr", platform: "X (Twitter)", type: "Official", status: "Active" },
];

export default function SocialScraper() {
    const [isScraping, setIsScraping] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [logQueue, setLogQueue] = useState<any[]>([]);
    const [scrapedItems, setScrapedItems] = useState<any[]>([]); // Store actual data items
    const [viewMode, setViewMode] = useState<'terminal' | 'data'>('terminal'); // Toggle view
    const logEndRef = useRef<HTMLDivElement>(null);

    // Queue Processor: Consumes one item at a time with random delay
    useEffect(() => {
        if (logQueue.length === 0) return;

        const timer = setTimeout(() => {
            const item = logQueue[0];
            const contentPreview = item.content.length > 80 ? item.content.substring(0, 80) + "..." : item.content;
            let sourceTag = item.source.replace('social_media_', '').toUpperCase();

            // Format: [SOURCE] Content
            const logMessage = `[${sourceTag}] ${contentPreview || 'No content preview available'}`;
            const time = new Date().toLocaleTimeString();

            setLogs(prev => [...prev, `[${time}] ${logMessage}`]);
            setScrapedItems(prev => [item, ...prev]); // Add to data view list
            setLogQueue(prev => prev.slice(1)); // Remove processed item
        }, Math.random() * 1500 + 500); // Random delay 500ms - 2000ms

        return () => clearTimeout(timer);
    }, [logQueue]);

    // Real Scrape Integration
    const startScraping = async () => {
        setIsScraping(true);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Initializing Scraper Engine...`]);
        try {
            await api.triggerScrape();
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Scrape Job Dispatched to Backend.`]);

            // Poll for updates
            let checks = 0;
            const interval = setInterval(async () => {
                checks++;
                const feed: any[] = await api.getFeed();

                // Get recent social media items
                const recent = feed
                    .filter((f: any) => f.source.startsWith('social_media'))
                    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 10);

                if (recent.length > 0) {
                    recent.forEach((item: any) => {
                        setLogQueue(prevQueue => {
                            // Check existence in queue or logs to avoid dups
                            if (prevQueue.some(q => q.id === item.id)) return prevQueue;
                            return [...prevQueue, item];
                        });
                    });
                }

                if (checks > 20) {
                    setIsScraping(false);
                    clearInterval(interval);
                    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Scrape Cycle Complete.`]);
                }
            }, 2000);

        } catch (e) {
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: Failed to start scraper.`]);
            setIsScraping(false);
        }
    };

    // Auto-scroll logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="flex h-full gap-6 p-6 bg-slate-50">
            {/* Left Panel: Controls & Targets */}
            <div className="w-1/3 flex flex-col gap-6">

                {/* Control Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg ${isScraping ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Activity size={24} className={isScraping ? "animate-pulse" : ""} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Scraper Engine</h3>
                            <p className="text-xs text-slate-500">{isScraping ? "Running / Data Ingress Active" : "Engine Standby"}</p>
                        </div>
                    </div>

                    <button
                        onClick={startScraping}
                        disabled={isScraping}
                        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${isScraping
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                            }`}
                    >
                        {isScraping ? <><Square size={18} fill="currentColor" /> Stop Extraction</> : <><Play size={18} fill="currentColor" /> Start Scrapers</>}
                    </button>

                    <button
                        onClick={() => api.openScrapeFolder()}
                        className="w-full mt-3 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
                    >
                        <FileJson size={18} />
                        Open Data Folder
                    </button>
                </div>

                {/* Targets List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h4 className="font-bold text-sm text-slate-700">Jaipur Targets</h4>
                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">5 Active</span>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                        {JAIPUR_TARGETS.map((target) => (
                            <div key={target.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        {target.platform === 'X (Twitter)' ? <Hash size={14} /> : <Globe size={14} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-800">{target.handle}</p>
                                        <p className="text-[10px] text-slate-400">{target.type} • {target.platform}</p>
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${target.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Right Panel: Output View */}
            <div className="w-2/3 bg-slate-900 rounded-xl overflow-hidden flex flex-col shadow-lg shadow-slate-300/50 border border-slate-800">
                {/* Header with Toggle */}
                <div className="bg-slate-950 p-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Terminal size={16} className="text-slate-400" />
                        <span className="text-xs font-mono text-slate-300">root@shield-scraper:~</span>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setViewMode('terminal')}
                            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'terminal' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Terminal size={14} /> Terminal
                        </button>
                        <button
                            onClick={() => setViewMode('data')}
                            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${viewMode === 'data' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <LayoutList size={14} /> Live Feed
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[#0f172a]">

                    {viewMode === 'terminal' ? (
                        // TERMINAL VIEW
                        <div className="font-mono text-sm space-y-1">
                            <div className="text-slate-500 mb-4">
                                # Shield Intelligence Scraper v2.4.0<br />
                                # Targeting: Jaipur Region [IN]<br />
                                # Status: {isScraping ? <span className="text-green-400">ONLINE</span> : <span className="text-orange-400">STANDBY</span>}
                            </div>

                            {logs.map((log, i) => (
                                <div key={i} className="text-slate-300 border-l-2 border-slate-800 pl-3">
                                    <span className="text-slate-600 mr-2">{log.substring(0, log.indexOf(']') + 1)}</span>
                                    <span className={log.includes('Success') ? 'text-green-400' : log.includes('detected') ? 'text-blue-400' : ''}>
                                        {log.substring(log.indexOf(']') + 1)}
                                    </span>
                                </div>
                            ))}

                            {isScraping && (
                                <div className="animate-pulse text-blue-500 mt-2">_</div>
                            )}
                            <div ref={logEndRef}></div>
                        </div>
                    ) : (
                        // DATA VIEW
                        <div className="space-y-3">
                            {scrapedItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                    <Activity size={48} className="mb-4 opacity-20" />
                                    <p>No data captured yet.</p>
                                    <p className="text-xs">Start the scraper to begin data ingress.</p>
                                </div>
                            ) : (
                                scrapedItems.map((item, i) => (
                                    <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.source.includes('reddit') ? 'bg-orange-500/20 text-orange-400' :
                                                    item.source.includes('news') ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                    {item.source.replace('social_media_', '').toUpperCase()}
                                                </span>
                                                <span className="text-xs text-slate-400 font-mono">
                                                    {new Date(item.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                                Open <Globe size={10} />
                                            </a>
                                        </div>
                                        <p className="text-slate-200 text-sm font-medium mb-1">{item.content}</p>
                                        <p className="text-xs text-slate-500">Author: {item.author || 'Unknown'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
