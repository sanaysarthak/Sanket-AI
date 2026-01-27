"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Stats() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getStats();
                setStats(data);
            } catch (e) { }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return <div className="h-24 animate-pulse bg-slate-800/50 rounded-xl"></div>;

    return (
        <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-[#0f172a] border border-[#1e293b] p-4 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Total Events</p>
                <div className="flex items-end justify-between mt-2">
                    <p className="text-2xl font-mono font-bold text-slate-100">{stats.total_events}</p>
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1 h-3 ${i < 3 ? 'bg-blue-600' : 'bg-slate-800'}`}></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] p-4 flex flex-col justify-between hover:border-red-500/50 transition-colors">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Active Alerts</p>
                <div className="flex items-end justify-between mt-2">
                    <p className="text-2xl font-mono font-bold text-red-500">{stats.active_alerts}</p>
                    {stats.active_alerts > 0 && <span className="text-[10px] bg-red-900/20 text-red-500 px-1 border border-red-900/50 font-mono">CRITICAL</span>}
                </div>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] p-4 flex flex-col justify-between">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Sources Active</p>
                <div className="flex gap-2 mt-2">
                    <div className="flex-1 bg-[#1e293b] p-1 text-center border border-[#334155]">
                        <p className="text-[9px] text-slate-500 font-mono uppercase">Social</p>
                        <p className="text-base font-mono font-bold text-blue-400">{stats.sources.social_media}</p>
                    </div>
                    <div className="flex-1 bg-[#1e293b] p-1 text-center border border-[#334155]">
                        <p className="text-[9px] text-slate-500 font-mono uppercase">CCTV</p>
                        <p className="text-base font-mono font-bold text-red-400">{stats.sources.cctv}</p>
                    </div>
                </div>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Threat Level</p>
                <p className="text-2xl font-mono font-bold text-amber-500 tracking-tight mt-1">ELEVATED</p>
                <p className="text-[10px] text-amber-500/70 font-mono truncate">Pattern: Protest + Density</p>
            </div>
        </div>
    );
}
