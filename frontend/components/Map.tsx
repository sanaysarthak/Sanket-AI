"use client";
import { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { api } from '@/lib/api';

// Dynamically import Leaflet with no SSR
import dynamic from 'next/dynamic';

const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const CircleMarker = dynamic(
    () => import('react-leaflet').then((mod) => mod.CircleMarker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

const locations: Record<string, [number, number]> = {
    "Hawa Mahal": [26.9239, 75.8267],
    "Ajmeri Gate": [26.9196, 75.8180],
    "City Palace": [26.9258, 75.8237],
    "Albert Hall Museum": [26.9116, 75.8195]
};

export default function LiveMap() {
    const [points, setPoints] = useState<any[]>([]);

    useEffect(() => {
        const fetchPoints = async () => {
            try {
                const feed = await api.getFeed();
                const mappable = feed.filter((item: any) => item.location && locations[item.location]);
                setPoints(mappable);
            } catch (e) {
                console.error(e);
            }
        };
        fetchPoints();
        const interval = setInterval(fetchPoints, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full w-full rounded-xl overflow-hidden shadow-lg border border-slate-800 bg-slate-900 relative">
            <MapContainer center={[26.9124, 75.7873]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />
                {points.map((pt, idx) => {
                    const coords = locations[pt.location];
                    return (
                        <CircleMarker
                            key={idx}
                            center={coords}
                            pathOptions={{
                                color: pt.source === 'cctv' ? '#ef4444' : '#3b82f6',
                                fillColor: pt.source === 'cctv' ? '#ef4444' : '#3b82f6',
                                fillOpacity: 0.6
                            }}
                            radius={8}
                        >
                            <Popup>
                                <div className="text-slate-800">
                                    <strong>{pt.location}</strong><br />
                                    {pt.content}
                                </div>
                            </Popup>
                        </CircleMarker>
                    )
                })}
            </MapContainer>
            <div className="absolute top-4 right-4 z-[400] bg-slate-900/90 backdrop-blur p-2 rounded border border-slate-700 text-xs">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500 opacity-60"></span>
                    <span className="text-slate-300">Social Media</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 opacity-60"></span>
                    <span className="text-slate-300">CCTV Anomaly</span>
                </div>
            </div>
        </div>
    );
}
