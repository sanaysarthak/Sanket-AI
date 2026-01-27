
import React, { useState } from 'react';
import { Send, AlertTriangle, CheckCircle2, Shield, Flame, Target, Eye, AlertOctagon, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';

const AGENCIES = [
    { id: 'police', name: 'Jaipur Police', icon: Shield, color: 'text-blue-600' },
    { id: 'fire', name: 'Fire Department', icon: Flame, color: 'text-orange-600' },
    { id: 'act', name: 'Anti-Terror Cell', icon: Target, color: 'text-red-600' },
    { id: 'ib', name: 'Intelligence Bureau', icon: Eye, color: 'text-indigo-600' },
    { id: 'bomb_squad', name: 'Bomb Squad', icon: AlertOctagon, color: 'text-red-700' },
    { id: 'women_cell', name: 'Women Police Cell', icon: ShieldAlert, color: 'text-pink-600' },
];

const INTENSITIES = [
    { id: 'low', label: 'Monitor', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'medium', label: 'Caution', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'high', label: 'High Alert', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'critical', label: 'CRITICAL', color: 'bg-red-100 text-red-700 border-red-200 animate-pulse' },
];

export default function AgencyAlertComposer() {
    const [agency, setAgency] = useState('police');
    const [intensity, setIntensity] = useState('medium');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSend = async () => {
        if (!message) return;
        setSending(true);
        try {
            await api.sendAlert(agency, intensity, message);
            setSuccess(true);
            setMessage('');
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error(e);
            alert('Failed to send alert');
        } finally {
            setSending(false);
        }
    };

    const SelectedIcon = AGENCIES.find(a => a.id === agency)?.icon || Shield;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-6">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Inter-Agency Command & Alert System
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Coordinate real-time response by dispatching intelligence and action protocols.
                    </p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm font-medium animate-in fade-in slide-in-from-right-4">
                        <CheckCircle2 className="w-4 h-4" />
                        Alert Sent Successfully
                    </div>
                )}
            </div>

            <div className="p-6 grid grid-cols-12 gap-6">
                {/* Agency Selection */}
                <div className="col-span-4 space-y-4">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Target Agency</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1">
                        {AGENCIES.map((a) => (
                            <button
                                key={a.id}
                                onClick={() => setAgency(a.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${agency === a.id
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`p-2 rounded-md ${agency === a.id ? 'bg-white' : 'bg-slate-100'}`}>
                                    <a.icon className={`w-5 h-5 ${a.color}`} />
                                </div>
                                <div>
                                    <div className={`font-semibold text-sm ${agency === a.id ? 'text-slate-900' : 'text-slate-600'}`}>{a.name}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message Composition */}
                <div className="col-span-8 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">Alert Intensity</label>
                            <div className="flex gap-2">
                                {INTENSITIES.map((i) => (
                                    <button
                                        key={i.id}
                                        onClick={() => setIntensity(i.id)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-md border transition-all ${intensity === i.id
                                            ? i.color + ' ring-1 ring-offset-1'
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {i.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-end justify-end">
                            <div className="text-right">
                                <span className="text-xs text-slate-400">Active Protocol</span>
                                <div className="font-mono text-sm text-slate-700">SHIELD-ACT-{new Date().getFullYear()}-{(Math.random() * 1000).toFixed(0)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Intelligence Brief / Action Order</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter detailed intelligence report, suspect description, or coordination instructions..."
                            className="w-full h-32 rounded-lg border-slate-200 text-slate-900 text-sm focus:border-blue-500 focus:ring-blue-500 resize-none p-4"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSend}
                            disabled={sending || !message}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm shadow-sm transition-all ${sending || !message
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md active:transform active:scale-95'
                                }`}
                        >
                            <Send className="w-4 h-4" />
                            {sending ? 'Dispatching...' : 'Dispatch Protocol & Alert'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
