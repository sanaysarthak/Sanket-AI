import { useState } from 'react';
import { Upload, FileText, Smartphone, Users, Radio, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

// Mock Processed Data
const ANALYSIS_DATA = {
    target: "+91-98765-XXXXX",
    provider: "Airtel India (Rajasthan Circle)",
    period: "01 Dec 2025 - 28 Dec 2025",
    total_calls: 142,
    unique_contacts: 28,
    imei: "354829012345678",
    top_contacts: [
        { name: "Unknown (Handler?)", number: "+91-77234-88990", count: 42, type: "Incoming", risk: "High" },
        { name: "Family - Brother", number: "+91-99887-77665", count: 28, type: "Outgoing", risk: "Low" },
        { name: "Local Associate", number: "+91-88900-11223", count: 15, type: "Both", risk: "Medium" },
    ],
    tower_locations: [
        "Sector 4, Jawahar Nagar (Home)",
        "Tonk Road, Near Glass Factory (Frequent)",
        "Sindhi Camp Bus Stand (Suspo)"
    ],
    recent_logs: [
        { time: "28/12 - 22:15", number: "+91-77234-88990", dur: "14m 20s", tower: "Jawahar Nagar", type: "IN" },
        { time: "28/12 - 19:30", number: "+91-99887-77665", dur: "45s", tower: "Tonk Road", type: "OUT" },
        { time: "28/12 - 14:10", number: "+91-88900-11223", dur: "2m 10s", tower: "Sindhi Camp", type: "OUT" },
        { time: "27/12 - 23:45", number: "+91-77234-88990", dur: "55s", tower: "Jawahar Nagar", type: "IN" },
    ]
};

export default function CDRAnalyzer() {
    const [view, setView] = useState<'upload' | 'processing' | 'results'>('upload');

    const handleUpload = () => {
        setView('processing');
        setTimeout(() => setView('results'), 2500); // Simulate processing
    };

    if (view === 'upload') {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 border-t border-slate-200">
                <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center max-w-lg w-full">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
                        <Upload size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload CDR File</h2>
                    <p className="text-slate-500 mb-8">
                        Upload standard .csv or .xlsx Call Detail Records.
                        System parses A-Party, B-Party, Cell ID, and Duration automatically.
                    </p>

                    <div
                        onClick={handleUpload}
                        className="border-2 border-dashed border-slate-400 rounded-lg p-12 bg-slate-50 cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-all group"
                    >
                        <FileText className="mx-auto text-slate-400 group-hover:text-purple-500 mb-4" size={40} />
                        <p className="text-sm font-medium text-slate-600 group-hover:text-purple-700">Click to Select File</p>
                        <p className="text-xs text-slate-400 mt-2">Max file size: 50MB</p>
                    </div>

                    <div className="mt-8 flex justify-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><CheckCircle2 size={12} /> XLS/CSV Support</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Auto-Mapping</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Tower Triangulation</span>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'processing') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-t border-slate-200">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-slate-800">Analyzing Record Structure...</h3>
                <p className="text-slate-500 mt-2">Mapping Cell IDs and frequency patterns</p>
            </div>
        );
    }

    // Results View
    return (
        <div className="h-full bg-slate-100 overflow-y-auto p-6 border-t border-slate-200">
            {/* Header Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg text-purple-700">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Analysis Report: {ANALYSIS_DATA.target}</h2>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Users size={14} /> {ANALYSIS_DATA.provider}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock size={14} /> Period: {ANALYSIS_DATA.period}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setView('upload')}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                >
                    New Analysis
                </button>
            </div>

            <div className="grid grid-cols-3 gap-6">

                {/* Left Col: Stats */}
                <div className="col-span-1 space-y-6">
                    {/* Summary Chips */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-bold">Total Activity</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{ANALYSIS_DATA.total_calls}</p>
                            <p className="text-xs text-green-600 mt-1">Calls & SMS</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase font-bold">Unique IDs</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{ANALYSIS_DATA.unique_contacts}</p>
                            <p className="text-xs text-slate-400 mt-1">Contacts Found</p>
                        </div>
                    </div>

                    {/* Top Contacts */}
                    <div className="bg-white p-0 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Users size={16} className="text-blue-500" /> Highest Frequency
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {ANALYSIS_DATA.top_contacts.map((contact, i) => (
                                <div key={i} className="p-4 hover:bg-slate-50">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-bold text-slate-800">{contact.name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${contact.risk === 'High' ? 'bg-red-100 text-red-600' :
                                                contact.risk === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {contact.risk} Risk
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono mb-2">{contact.number}</p>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${(contact.count / ANALYSIS_DATA.total_calls) * 200}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] text-right text-slate-400 mt-1">{contact.count} calls</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tower Locations */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Radio size={16} className="text-orange-500" /> Top Cell Towers
                        </h3>
                        <ul className="space-y-3">
                            {ANALYSIS_DATA.tower_locations.map((loc, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-orange-400 shrink-0"></div>
                                    {loc}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Col: Logs */}
                <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FileText size={16} className="text-slate-500" /> Detailed Interaction Log
                        </h3>
                        <button className="text-xs text-blue-600 font-medium hover:underline">Export CSV</button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Timestamp</th>
                                    <th className="px-6 py-3">Other Party</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Duration</th>
                                    <th className="px-6 py-3">Tower Location</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ANALYSIS_DATA.recent_logs.map((log, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-3 font-mono text-xs text-slate-600">{log.time}</td>
                                        <td className="px-6 py-3 font-medium text-slate-800">{log.number}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {log.type === 'IN' ? 'INCOMING' : 'OUTGOING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-600">{log.dur}</td>
                                        <td className="px-6 py-3 text-slate-500 text-xs">{log.tower}</td>
                                    </tr>
                                ))}
                                {/* Fake Filler Rows for density */}
                                {[...Array(5)].map((_, i) => (
                                    <tr key={`fill-${i}`} className="hover:bg-slate-50/50 opacity-50">
                                        <td className="px-6 py-3 font-mono text-xs text-slate-600">27/12 - 1{8 - i}:00</td>
                                        <td className="px-6 py-3 font-medium text-slate-800">+91-9XXXX-XXXXX</td>
                                        <td className="px-6 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">SMS</span></td>
                                        <td className="px-6 py-3 text-slate-600">-</td>
                                        <td className="px-6 py-3 text-slate-500 text-xs">Jawahar Nagar</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
