import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileVideo, Play, CheckCircle, BarChart as BarChartIcon, MonitorPlay, AlertTriangle, Download } from 'lucide-react';

export default function VideoIntel() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('idle'); // idle, processing, completed, failed
    const [metadata, setMetadata] = useState<any[]>([]);
    const VideoRef = useRef<HTMLVideoElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:9000/api/analyze/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setTaskId(data.task_id);
                setStatus('processing');
                startPolling(data.task_id);
            } else {
                alert("Upload failed");
                setStatus('idle');
            }
        } catch (error) {
            console.error(error);
            alert("Error uploading file");
            setStatus('idle');
        } finally {
            setUploading(false);
        }
    };

    const startPolling = (tid: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:9000/api/analyze/status/${tid}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await res.json();

                if (data.status === 'completed') {
                    setStatus('completed');
                    setMetadata(data.metadata);
                    clearInterval(interval);
                } else if (data.status === 'failed') {
                    setStatus('failed');
                    clearInterval(interval);
                }
            } catch (e) {
                console.error(e);
            }
        }, 2000);
    };

    // Derived Stats
    const totalEvents = metadata.length;
    const uniqueEvents = Array.from(new Set(metadata.map(m => m.event)));
    const avgCrowd = metadata.length ? Math.round(metadata.reduce((a, b) => a + b.crowd_count, 0) / metadata.length) : 0;
    const maxCrowd = metadata.length ? Math.max(...metadata.map(m => m.crowd_count)) : 0;

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MonitorPlay className="w-6 h-6 text-blue-600" />
                        Video Intelligence Pipeline
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Upload raw CCTV footage for automated behavioral analysis and anomaly detection.
                    </p>
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                {/* Upload Section */}
                {status === 'idle' && (
                    <div className="max-w-2xl mx-auto mt-10">
                        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center hover:border-blue-400 transition-colors">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Surveillance Footage</h3>
                            <p className="text-slate-500 mb-6">Drag and drop your video file here, or click to browse. Supports MP4, AVI, MOV.</p>

                            <input
                                type="file"
                                id="video-upload"
                                className="hidden"
                                accept="video/*"
                                onChange={handleFileChange}
                            />

                            {!file ? (
                                <label
                                    htmlFor="video-upload"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-sm"
                                >
                                    <FileVideo className="w-5 h-5" />
                                    Select Video File
                                </label>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-2 text-slate-700 font-medium">
                                        <FileVideo className="w-5 h-5 text-blue-600" />
                                        {file.name}
                                    </div>
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                                    >
                                        {uploading ? 'Uploading & Initializing...' : 'Start Analysis Pipeline'}
                                    </button>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="block mx-auto text-sm text-slate-400 hover:text-red-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Processing State */}
                {status === 'processing' && (
                    <div className="max-w-xl mx-auto mt-20 text-center">
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                            <MonitorPlay className="absolute inset-0 m-auto text-blue-600 w-8 h-8 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Processing Video Stream</h3>
                        <p className="text-slate-500">
                            AI Engine is analyzing frames for behavioral anomalies, crowd density, and vehicle patterns.
                            <br />This may take several minutes depending on video length.
                        </p>
                    </div>
                )}

                {/* Completed State */}
                {status === 'completed' && taskId && (
                    <div className="grid grid-cols-12 gap-6 h-full">
                        {/* Left: Video Player */}
                        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
                            <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video relative group">
                                <video
                                    className="w-full h-full object-contain"
                                    controls
                                    src={`http://localhost:9000/api/analyze/video/${taskId}`}
                                />
                                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    AI Overlay Active
                                </div>
                            </div>

                            {/* Metrics Cards */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Processed</p>
                                    <p className="text-2xl font-bold text-slate-900">{metadata.length}</p>
                                    <p className="text-xs text-slate-400 mt-1">Total Frames analyzed</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Crowd Peak</p>
                                    <p className="text-2xl font-bold text-blue-600">{maxCrowd}</p>
                                    <p className="text-xs text-slate-400 mt-1">Persons detected</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Events Discovered</p>
                                    <p className="text-2xl font-bold text-indigo-600">{uniqueEvents.length}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {uniqueEvents.map(e => (
                                            <span key={e} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded capitalize">{e}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setTaskId(null);
                                            setStatus('idle');
                                        }}
                                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                        <Upload className="w-5 h-5" />
                                        <span className="text-sm font-medium">New Analysis</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Timeline & Logs */}
                        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px]">
                            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-800">Event Timeline</h3>
                                <Download className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {metadata.map((log, idx) => (
                                    <div key={idx} className="flex gap-3 text-sm p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                        <div className="font-mono text-xs text-slate-400 w-12 shrink-0 pt-0.5">
                                            {new Date(log.timestamp_sec * 1000).toISOString().substr(14, 5)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-2 h-2 rounded-full ${log.event === 'normal_activity' ? 'bg-slate-300' :
                                                        log.event === 'panic_movement_detected' ? 'bg-red-500 animate-pulse' :
                                                            'bg-amber-400'
                                                    }`} />
                                                <span className={`font-semibold capitalize ${log.event === 'panic_movement_detected' ? 'text-red-700' : 'text-slate-700'
                                                    }`}>{log.event.replace(/_/g, ' ')}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 flex gap-3">
                                                <span>Crowd: {log.crowd_count}</span>
                                                <span>•</span>
                                                <span>Avg Speed: {log.avg_speed.toFixed(1)} px/s</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
