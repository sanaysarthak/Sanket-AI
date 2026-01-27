import { useState } from "react";
import { Search, Filter, FileText, ChevronRight, User, MapPin, Calendar, Clock, Shield, Printer, Share2, Download } from "lucide-react";

// Mock Data based on Standard Indian FIR (Form 1)
const FIRS = [
    {
        id: "FIR-2025-0021",
        district: "Jaipur City (South)",
        ps: "Vaishali Nagar",
        year: "2025",
        date: "2025-12-28",
        time: "14:30",
        acts: ["IPC 1860"],
        sections: ["379 (Theft)", "356 (Assault/Criminal Force)"],
        complainant: "Rajesh Kumar Sharma",
        offense_desc: "Snatching of mobile phone by two bike-borne assailants near Nursery Circle.",
        status: "Investigation",
        io: "SI Vikram Singh",
        severity: "Medium"
    },
    {
        id: "FIR-2025-0018",
        district: "Jaipur City (East)",
        ps: "Malviya Nagar",
        year: "2025",
        date: "2025-12-27",
        time: "09:15",
        acts: ["IT Act 2000", "IPC 1860"],
        sections: ["66D (Cheating by personation)", "420 (Cheating)"],
        complainant: "Priya Desai",
        offense_desc: "Online financial fraud via phishing link mimicking bank KYC portal. Loss of Rs. 45,000.",
        status: "Traceable",
        io: "Insp. Anjali Gupta",
        severity: "High"
    },
    {
        id: "FIR-2025-0015",
        district: "Jaipur City (North)",
        ps: "Manak Chowk",
        year: "2025",
        date: "2025-12-25",
        time: "22:00",
        acts: ["IPC 1860"],
        sections: ["323 (Voluntarily causing hurt)", "504 (Intentional insult)"],
        complainant: "Local Shopkeeper Assoc.",
        offense_desc: "Public brawl and property damage in market area due to parking dispute.",
        status: "Compromised",
        io: "ASI Ram Lal",
        severity: "Low"
    }
];

export default function FIRSystem() {
    const [selectedFIR, setSelectedFIR] = useState(FIRS[0]);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredFirs = FIRS.filter(f =>
        f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.complainant.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden border-t border-slate-200">

            {/* Sidebar - Case List */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Shield size={18} className="text-orange-600" />
                        CCTNS Digital Ledger
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search FIR No. or Name..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredFirs.map(fir => (
                        <div
                            key={fir.id}
                            onClick={() => setSelectedFIR(fir)}
                            className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedFIR.id === fir.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-mono text-xs font-bold text-slate-600">{fir.id}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${fir.status === 'Investigation' ? 'bg-blue-100 text-blue-700' :
                                        fir.status === 'Traceable' ? 'bg-red-100 text-red-700' :
                                            'bg-green-100 text-green-700'
                                    }`}>{fir.status}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-800 mb-1 line-clamp-1">{fir.acts.join(", ")}</h4>
                            <p className="text-xs text-slate-500 mb-2 truncate">{fir.offense_desc}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <Calendar size={10} />
                                {fir.date}
                                <span className="mx-1">•</span>
                                <MapPin size={10} />
                                {fir.ps}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Panel - Digital FIR Copy */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
                <div className="w-full max-w-3xl bg-white shadow-sm border border-slate-200 min-h-[800px] flex flex-col">

                    {/* Standard Header */}
                    <div className="p-8 border-b-2 border-slate-800 flex justify-between items-start bg-slate-50/50">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white">
                                {/* Emblem Placehoder */}
                                <Shield size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-slate-900 uppercase tracking-wide">First Information Report</h1>
                                <p className="text-sm text-slate-600 font-serif italic">(Under Section 154 Cr.P.C.)</p>
                                <div className="mt-2 text-xs font-mono text-slate-500">
                                    FORM NO. 1 (Integrated Police Form)
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-slate-100 border border-slate-300 px-3 py-2 rounded mb-2">
                                <p className="text-xs text-slate-500 uppercase">District</p>
                                <p className="font-bold text-slate-900">{selectedFIR.district}</p>
                            </div>
                            <div className="bg-slate-100 border border-slate-300 px-3 py-2 rounded">
                                <p className="text-xs text-slate-500 uppercase">Police Station</p>
                                <p className="font-bold text-slate-900">{selectedFIR.ps}</p>
                            </div>
                        </div>
                    </div>

                    {/* FIR Meta Data Grid */}
                    <div className="grid grid-cols-4 border-b border-slate-200 divide-x divide-slate-200">
                        <div className="p-4">
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Year</label>
                            <div className="font-mono text-lg text-slate-800">{selectedFIR.year}</div>
                        </div>
                        <div className="p-4">
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">FIR No.</label>
                            <div className="font-mono text-lg text-red-700 font-bold">{selectedFIR.id.split('-').pop()}</div>
                        </div>
                        <div className="p-4">
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date</label>
                            <div className="font-mono text-sm text-slate-800">{selectedFIR.date}</div>
                        </div>
                        <div className="p-4">
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Time</label>
                            <div className="font-mono text-sm text-slate-800">{selectedFIR.time} hrs</div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="p-8 space-y-8">

                        {/* 1. Acts */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                                <span className="bg-slate-900 text-white w-5 h-5 flex items-center justify-center rounded-sm text-xs">1</span>
                                Acts & Sections
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedFIR.sections.map((sec, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-red-50 border border-red-100 text-red-700 text-sm font-medium rounded-md">
                                        {selectedFIR.acts[0]} - Sec {sec}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* 2. Occurrence */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                                <span className="bg-slate-900 text-white w-5 h-5 flex items-center justify-center rounded-sm text-xs">2</span>
                                Occurrence of Offense
                            </h3>
                            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Day & Date</p>
                                    <p className="text-sm font-medium text-slate-900">Sunday, {selectedFIR.date}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Time Period</p>
                                    <p className="text-sm font-medium text-slate-900">Afternoon, approx {selectedFIR.time}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Information Received At P.S.</p>
                                    <p className="text-sm font-medium text-slate-900">29/12/2025 at 16:45</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">GD Entry Reference</p>
                                    <p className="text-sm font-medium text-slate-900">Entry No. 442 / General Diary</p>
                                </div>
                            </div>
                        </section>

                        {/* 3. Complainant */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                                <span className="bg-slate-900 text-white w-5 h-5 flex items-center justify-center rounded-sm text-xs">3</span>
                                Complainant Information
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-800">{selectedFIR.complainant}</p>
                                    <p className="text-sm text-slate-500">S/o Shri B.L. Sharma • Indian National</p>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <MapPin size={10} />
                                        Sector 4, Jawahar Nagar, Jaipur
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 4. Description */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                                <span className="bg-slate-900 text-white w-5 h-5 flex items-center justify-center rounded-sm text-xs">4</span>
                                Description of Incident
                            </h3>
                            <div className="bg-yellow-50/50 p-6 rounded-md border border-yellow-100 text-slate-800 text-sm leading-relaxed font-serif">
                                "{selectedFIR.offense_desc}"
                                <br /><br />
                                <span className="italic text-slate-500 text-xs">
                                    (Note: Contents extracted from original written complaint submitted by informant.)
                                </span>
                            </div>
                        </section>

                    </div>

                    {/* Footer - Action */}
                    <div className="mt-auto bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Information Recorded By</p>
                            <p className="text-sm font-bold text-slate-900">{selectedFIR.io}</p>
                            <p className="text-xs text-slate-500">Designation: Sub-Inspector</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50">
                                <Printer size={16} /> Print
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-900 rounded text-sm text-white hover:bg-blue-800 shadow-sm">
                                <Download size={16} /> Official PDF
                            </button>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
