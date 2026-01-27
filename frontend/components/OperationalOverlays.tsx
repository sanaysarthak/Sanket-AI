import React, { useState } from 'react';
import { 
    X, AlertTriangle, Shield, Radio, Share2, MessageSquare, 
    FileText, CheckCircle2, Siren, ArrowRight, Eye, Send, MapPin
} from 'lucide-react';

// --- Types ---
interface EventDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    event: any; // Using any for flexibility with existing types
    onDispatch: () => void;
    userAgency: string;
}

interface IncidentStripProps {
    incidents: any[];
    onFocus: (location: string, coordinates: [number, number]) => void;
    userAgency: string;
}

interface DispatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
    onSend: (message: string, recipients: string) => void;
    userAgency: string;
}

// --- Helper for Agency Colors ---
const getAgencyColor = (agency: string) => {
    const colors: Record<string, string> = {
        police: 'bg-blue-600',
        ib: 'bg-indigo-600',
        act: 'bg-red-600',
        fire: 'bg-orange-600',
        bomb_squad: 'bg-red-700',
        women_cell: 'bg-pink-600'
    };
    return colors[agency] || 'bg-slate-600';
};

// --- active Incident Strip ---
export const ActiveIncidentStrip: React.FC<IncidentStripProps> = ({ incidents, onFocus, userAgency }) => {
    if (!incidents || incidents.length === 0) return null;

    return (
        <div className="w-full bg-slate-900 border-b border-slate-700 h-10 flex items-center px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div className="flex items-center gap-2 mr-4 text-xs font-bold text-red-400 uppercase tracking-wider">
                <Siren className="w-3.5 h-3.5 animate-pulse" />
                Active Incidents
            </div>
            {incidents.map((incident, idx) => {
                const isMyAgency = incident.primaryAgency === userAgency || incident.secondaryAgency === userAgency;
                // Agency-Aware Alerting: Reduced visibility for non-relevant agencies
                const opacity = isMyAgency ? 'opacity-100' : 'opacity-60 grayscale';
                
                return (
                    <button
                        key={idx}
                        onClick={() => onFocus(incident.location, incident.coordinates)}
                        className={`flex items-center gap-2 px-3 py-1 mr-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all ${opacity}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${incident.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`} />
                        <span className="text-xs font-medium text-slate-200">{incident.type.replace('_', ' ')}</span>
                        <span className="text-[10px] text-slate-400 border-l border-slate-600 pl-2 ml-1">{incident.location}</span>
                    </button>
                );
            })}
        </div>
    );
};

// --- Event Drawer ---
export const EventDrawer: React.FC<EventDrawerProps> = ({ isOpen, onClose, event, onDispatch, userAgency }) => {
    if (!event) return null;

    const isMyAgency = event.primaryAgency === userAgency || event.secondaryAgency === userAgency;

    return (
        <div 
            className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out border-l border-slate-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50">
                <div>
                    <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider">Operational Detail</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${event.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
                        <span className="text-lg font-bold text-slate-900">{event.typeLabel || 'Incident'}</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto h-[calc(100%-4rem)]">
                
                {/* Agency Awareness Filter */}
                {!isMyAgency && (
                    <div className="mb-4 p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-start gap-3">
                        <Shield className="w-5 h-5 text-slate-400 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Restricted View</p>
                            <p className="text-xs text-slate-500 text-pretty">You are viewing this event as an external observer. Operational details are limited to the responding agency ({event.primaryAgency?.toUpperCase()}).</p>
                        </div>
                    </div>
                )}

                {/* Core Details */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100/50">
                            <p className="text-xs text-slate-500">Confidence Score</p>
                            <p className="text-lg font-bold text-slate-900">{(event.intensity * 100).toFixed(0)}%</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100/50">
                            <p className="text-xs text-slate-500">Primary Agency</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${getAgencyColor(event.primaryAgency || 'police')}`} />
                                <p className="text-sm font-semibold text-slate-900 capitalize">{event.primaryAgency || 'Police'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{event.location}</p>
                                <p className="text-xs text-slate-500 mt-1">Coordinates: {event.lat.toFixed(4)}, {event.lng.toFixed(4)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Explainability Panel */}
                    <div className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-2 mb-2">
                            <Eye className="w-3.5 h-3.5" />
                            AI Reasoning Engine
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {event.aiReasoning || "Anomaly detected based on spatial-temporal clustering of CCTV heat signatures and social media keyword spikes. Pattern matches historical precursors to this event type."}
                        </p>
                        <div className="mt-3 flex gap-2">
                            <span className="text-[10px] px-2 py-1 bg-white border border-indigo-100 rounded text-indigo-700 font-medium">CCTV Intensity: High</span>
                            <span className="text-[10px] px-2 py-1 bg-white border border-indigo-100 rounded text-indigo-700 font-medium">Social Vol: {event.count}+</span>
                        </div>
                    </div>

                    {/* Actions - Only enabled if it's my agency or I have override */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase">Command Actions</p>
                        
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Acknowledge Alert</span>
                        </button>

                        <button 
                            onClick={onDispatch}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-all shadow-sm group"
                        >
                            <Radio className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold">Dispatch Notification</span>
                        </button>

                        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium">
                            <Share2 className="w-4 h-4" />
                            <span className="text-sm">Share Inter-Agency Signal</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Dispatch Modal ---
export const DispatchModal: React.FC<DispatchModalProps> = ({ isOpen, onClose, event, onSend, userAgency }) => {
    if (!isOpen) return null;

    const [message, setMessage] = useState(`ALERT: ${event.typeLabel || 'Incident'} detected at ${event.location}. Immediate response requested.`);
    const [priority, setPriority] = useState<string>('high');

    const handleSend = () => {
        onSend(message, priority);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                        <Siren className="w-5 h-5 text-red-600" />
                        <h3 className="font-bold text-slate-900">Dispatch Notification</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                        <Radio className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-900">Target Agency Channel</p>
                            <p className="text-xs text-blue-700 capitalize">broadcasting to: {event.primaryAgency || 'General'} Dispatch</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Priority Level</label>
                        <div className="flex gap-2">
                            {['standard', 'high', 'critical'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all border ${
                                        priority === p 
                                        ? p === 'critical' ? 'bg-red-600 text-white border-red-600' 
                                          : p === 'high' ? 'bg-orange-500 text-white border-orange-500'
                                          : 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Official Message Preview</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full h-32 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono bg-slate-50"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSend}
                        className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
                    >
                        <Send className="w-4 h-4" />
                        Confirm Dispatch
                    </button>
                </div>
            </div>
        </div>
    );
};
