import { useRef, useEffect, useState } from "react";
import { Maximize2, Mic, MicOff, Video, AlertTriangle } from "lucide-react";

// Mock Data for Jaipur CCTV Locations
const CAMERAS = [
    { id: "CAM-001", location: "Ajmeri Gate", status: "Live", type: "Traffic" },
    { id: "CAM-002", location: "MI Road (East)", status: "Live", type: "Traffic" },
    { id: "CAM-003", location: "Statue Circle", status: "Live", type: "Public" },
    { id: "CAM-004", location: "Walled City Entry", status: "Live", type: "Security" },
    { id: "CAM-005", location: "Jawahar Circle", status: "Live", type: "Traffic" },
    { id: "CAM-006", location: "Sindhi Camp Bus Stand", status: "Maintenance", type: "Transit" },
];

export default function CCTVGrid() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Only run on client
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-full flex flex-col bg-slate-100 p-6 overflow-hidden">
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Video className="text-blue-600" />
                        CCTV Surveillance Matrix
                    </h2>
                    <p className="text-sm text-slate-500">Live Feed Integration • Jaipur Smart City Network</p>
                </div>

                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 text-sm font-medium text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Network Status: Stable
                    </div>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm">
                        Add New Feed
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 grid grid-cols-3 gap-4 overflow-y-auto">
                {CAMERAS.map((cam, idx) => (
                    <div
                        key={cam.id}
                        className="relative bg-black rounded-lg overflow-hidden group border border-slate-300 shadow-sm aspect-video"
                    >
                        {/* Local Image from public/cctv/ folder */}
                        <img
                            src={`/cctv/img-${idx + 1}.jpg`}
                            alt={cam.location}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://loremflickr.com/640/360/traffic,city?random=${idx}`; // Fallback
                            }}
                            className={`w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity ${cam.status === 'Maintenance' ? 'grayscale opacity-30' : ''}`}
                        />

                        {/* Overlay UI */}
                        <div className="absolute top-0 left-0 w-full h-full p-3 flex flex-col justify-between bg-gradient-to-b from-black/60 via-transparent to-black/60">

                            {/* Top Bar */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm animate-pulse inline-flex items-center gap-1">
                                        {cam.status === 'Live' ? <span className="w-1.5 h-1.5 bg-white rounded-full"></span> : <AlertTriangle size={10} />}
                                        {cam.status === 'Live' ? 'REC' : 'OFFLINE'}
                                    </span>
                                    <p className="text-white text-xs font-mono mt-1 opacity-90">{cam.id}</p>
                                </div>
                                <div className="text-white text-[10px] font-mono text-right opacity-80">
                                    {currentTime.toLocaleDateString()}
                                    <br />
                                    {currentTime.toLocaleTimeString()}
                                </div>
                            </div>

                            {/* Bottom Bar */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="text-white font-bold text-sm drop-shadow-md">{cam.location}</h4>
                                    <span className="text-xs text-slate-300 font-mono">{cam.type} Zone</span>
                                </div>

                                <div className="flex gap-2">
                                    <button className="p-1.5 bg-black/40 text-white rounded hover:bg-white/20 backdrop-blur-sm transition-colors">
                                        <MicOff size={14} />
                                    </button>
                                    <button className="p-1.5 bg-black/40 text-white rounded hover:bg-white/20 backdrop-blur-sm transition-colors">
                                        <Maximize2 size={14} />
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* Maintenance Overlay */}
                        {cam.status === 'Maintenance' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                                <div className="text-center">
                                    <AlertTriangle className="mx-auto text-yellow-500 mb-2" size={32} />
                                    <p className="text-yellow-500 font-bold font-mono text-sm">SIGNAL LOST</p>
                                    <p className="text-xs text-slate-400 mt-1">Reconnecting...</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
