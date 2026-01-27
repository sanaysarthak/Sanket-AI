"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Feed() {
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const data = await api.getFeed();
                setItems(data.reverse());
            } catch (e) {
                console.error(e);
            }
        };
        fetchFeed();
        const interval = setInterval(fetchFeed, 5000);
        return () => clearInterval(interval);
    }, []);

    const getSourceColor = (source: string) => {
        const colors: Record<string, string> = {
            'social_media': 'text-blue-400',
            'cctv': 'text-red-400',
            'police': 'text-yellow-400'
        };
        return colors[source] || 'text-slate-400';
    };

    return (
        <div className="flex flex-col h-full bg-[#0f172a] border border-[#1e293b]">
            <div className="p-3 border-b border-[#1e293b] flex justify-between items-center bg-[#1e293b]/30">
                <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Intelligence Feed
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                {items.map((item, i) => (
                    <div key={i} className="p-3 border-b border-[#1e293b] hover:bg-[#1e293b]/50 transition-colors group">
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${getSourceColor(item.source)}`}>
                                [{item.source.replace('_', ' ').substring(0, 4)}]
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono group-hover:text-slate-400">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour12: false })}
                            </span>
                        </div>
                        <p className="text-slate-300 text-sm leading-snug font-light">
                            {/* Entity highlighting */}
                            {item.entities && item.entities.length > 0 ? (
                                <span>
                                    {item.content.split(' ').map((word: string, idx: number) => {
                                        const isEntity = item.entities.some((e: any) => e.text.includes(word.replace(/[.,]/g, '')));
                                        return isEntity ?
                                            <span key={idx} className="text-blue-200 bg-blue-900/30 px-1 border border-blue-900/50 text-xs font-medium mx-0.5">{word}</span>
                                            : word + ' ';
                                    })}
                                </span>
                            ) : item.content}
                        </p>
                        {item.location && (
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500 font-mono">
                                <span>COORD: {item.location.toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
