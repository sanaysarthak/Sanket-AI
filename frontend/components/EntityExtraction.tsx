"use client";
import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import {
    Brain, Cloud, FileText, Users, Building2, MapPin, Calendar,
    TrendingUp, AlertTriangle, RefreshCw, Hash, BarChart3, Sparkles,
    ChevronDown, Filter, Download
} from 'lucide-react';

// Entity type colors
const ENTITY_COLORS: Record<string, string> = {
    PERSON: '#3b82f6',     // blue
    ORG: '#8b5cf6',        // purple
    GPE: '#10b981',        // emerald
    FAC: '#f59e0b',        // amber
    LOC: '#06b6d4',        // cyan
    EVENT: '#ef4444',      // red
    DATE: '#64748b',       // slate
    TIME: '#84cc16',       // lime
    MONEY: '#f97316',      // orange
    QUANTITY: '#ec4899',   // pink
};

// Topic colors
const TOPIC_COLORS: Record<string, string> = {
    'Protest': '#ef4444',
    'Violence': '#dc2626',
    'Traffic': '#f59e0b',
    'Emergency': '#f97316',
    'Crime': '#7c3aed',
    'Surveillance': '#3b82f6',
    'Social Unrest': '#ec4899',
    'Missing Person': '#06b6d4',
    'Drugs': '#84cc16',
    'Cyber': '#6366f1',
};

// Word cloud color palette - vibrant intelligence-themed colors
const WORD_CLOUD_COLORS = [
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#06b6d4', // cyan
    '#0891b2', // teal-ish
    '#2563eb', // darker blue
    '#7c3aed', // purple
    '#4f46e5', // indigo darker
    '#0284c7', // sky blue
];

interface WordCloudItem {
    text: string;
    value: number;
    size: number;
}

interface EntityItem {
    text: string;
    count: number;
}

interface TopicItem {
    topic: string;
    count: number;
    score: number;
    weight: number;
    sources: Record<string, number>;
}

interface BagOfWordsItem {
    word: string;
    frequency: number;
    doc_count: number;
    importance: number;
    percentage: number;
}

// Simple Word Cloud Component
function WordCloud({ words, maxWords = 60 }: { words: WordCloudItem[], maxWords?: number }) {
    const displayWords = useMemo(() => {
        return words.slice(0, maxWords).map((word, idx) => ({
            ...word,
            // Randomize position slightly for organic look
            rotation: Math.random() > 0.7 ? (Math.random() > 0.5 ? 15 : -15) : 0,
            color: WORD_CLOUD_COLORS[idx % WORD_CLOUD_COLORS.length],
        }));
    }, [words, maxWords]);

    return (
        <div className="flex flex-wrap items-center justify-center gap-2 p-6 min-h-[300px]">
            {displayWords.map((word, idx) => (
                <span
                    key={`${word.text}-${idx}`}
                    className="inline-block px-2 py-1 rounded-lg cursor-default transition-all hover:scale-110 hover:bg-blue-50"
                    style={{
                        fontSize: `${word.size}px`,
                        color: word.color,
                        transform: `rotate(${word.rotation}deg)`,
                        fontWeight: word.value > 5 ? 600 : 400,
                        opacity: 0.7 + (word.value / 20),
                    }}
                    title={`${word.text}: ${word.value} occurrences`}
                >
                    {word.text}
                </span>
            ))}
        </div>
    );
}

// 3D-style Card Component
function GlassCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/50 ${className}`}>
            {children}
        </div>
    );
}

// Entity Badge Component
function EntityBadge({ label, count, color }: { label: string, count: number, color: string }) {
    return (
        <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105 cursor-default"
            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
            <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: color, color: 'white' }}
            >
                {count}
            </span>
        </div>
    );
}

// Topic Bar Component
function TopicBar({ topic, maxScore }: { topic: TopicItem, maxScore: number }) {
    const percentage = (topic.score / maxScore) * 100;
    const color = TOPIC_COLORS[topic.topic] || '#6b7280';

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{topic.topic}</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{topic.count} mentions</span>
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: color }}
                    >
                        {topic.score.toFixed(1)}
                    </span>
                </div>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}50`
                    }}
                />
            </div>
        </div>
    );
}

export default function EntityExtraction() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'wordcloud' | 'bow'>('wordcloud');
    const [selectedSource, setSelectedSource] = useState<string>('all');

    // Data states
    const [entities, setEntities] = useState<any>(null);
    const [topics, setTopics] = useState<any>(null);
    const [wordCloud, setWordCloud] = useState<any>(null);
    const [bagOfWords, setBagOfWords] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getNLPFull();
            setEntities(data.entity_extraction);
            setTopics(data.topic_detection);
            setWordCloud(data.word_cloud);
            setBagOfWords(data.bag_of_words);
        } catch (e) {
            setError('Failed to load NLP analysis data');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Get words for word cloud based on selected source
    const cloudWords = useMemo(() => {
        if (!wordCloud) return [];
        if (selectedSource === 'all') {
            return wordCloud.words || [];
        }
        return wordCloud.source_clouds?.[selectedSource] || [];
    }, [wordCloud, selectedSource]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
                        <Brain className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-slate-500 font-medium">Processing NLP Analysis...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50/30">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const maxTopicScore = topics?.topics?.[0]?.score || 1;

    return (
        <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/25">
                            <Brain className="w-6 h-6" />
                        </div>
                        Entity Extraction & NLP Analysis
                    </h1>
                    <p className="text-slate-500 mt-1">AI-powered text analysis from all intelligence sources</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{entities?.total_entities || 0}</p>
                            <p className="text-xs text-slate-500">Total Entities</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Hash className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{topics?.total_topic_mentions || 0}</p>
                            <p className="text-xs text-slate-500">Topic Mentions</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{wordCloud?.total_words || 0}</p>
                            <p className="text-xs text-slate-500">Total Words</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Sparkles className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{bagOfWords?.vocabulary_size || 0}</p>
                            <p className="text-xs text-slate-500">Unique Vocabulary</p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Entities & Topics */}
                <div className="space-y-6">
                    {/* Entity Types */}
                    <GlassCard className="p-5">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            Entity Distribution
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {entities?.entity_type_distribution &&
                                Object.entries(entities.entity_type_distribution).map(([type, count]) => (
                                    <EntityBadge
                                        key={type}
                                        label={type}
                                        count={count as number}
                                        color={ENTITY_COLORS[type] || '#6b7280'}
                                    />
                                ))
                            }
                        </div>
                    </GlassCard>

                    {/* Top Entities */}
                    <GlassCard className="p-5">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            Top Entities
                        </h3>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {entities?.top_entities?.slice(0, 10).map((entity: EntityItem, idx: number) => (
                                <div
                                    key={entity.text}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}</span>
                                        <span className="text-sm font-medium text-slate-700">{entity.text}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                        {entity.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Topic Detection */}
                    <GlassCard className="p-5">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                            Detected Topics
                        </h3>
                        <div className="space-y-4">
                            {topics?.topics?.slice(0, 6).map((topic: TopicItem) => (
                                <TopicBar key={topic.topic} topic={topic} maxScore={maxTopicScore} />
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column - Word Cloud & Bag of Words */}
                <div className="col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-200 w-fit">
                        <button
                            onClick={() => setActiveTab('wordcloud')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'wordcloud'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <Cloud className="w-4 h-4" />
                            Word Cloud
                        </button>
                        <button
                            onClick={() => setActiveTab('bow')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'bow'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Bag of Words
                        </button>
                    </div>

                    {activeTab === 'wordcloud' && (
                        <GlassCard className="overflow-hidden">
                            {/* Word Cloud Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <Cloud className="w-5 h-5 text-blue-500" />
                                    Word Cloud Visualization
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Source:</span>
                                    <select
                                        value={selectedSource}
                                        onChange={(e) => setSelectedSource(e.target.value)}
                                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="all">All Sources</option>
                                        <option value="social_media">Social Media</option>
                                        <option value="cctv">CCTV</option>
                                        <option value="police">Police</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                            </div>
                            {/* Word Cloud */}
                            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 min-h-[350px]">
                                {cloudWords.length > 0 ? (
                                    <WordCloud words={cloudWords} maxWords={100} />
                                ) : (
                                    <div className="h-[350px] flex items-center justify-center text-slate-400">
                                        No words available for this source
                                    </div>
                                )}
                            </div>
                            {/* Stats Footer */}
                            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-6 text-xs text-slate-500">
                                    <span>Total: <strong className="text-slate-700">{wordCloud?.total_words}</strong> words</span>
                                    <span>Unique: <strong className="text-slate-700">{wordCloud?.unique_words}</strong> words</span>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {activeTab === 'bow' && (
                        <GlassCard className="overflow-hidden">
                            {/* Bag of Words Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-500" />
                                    Bag of Words Analysis
                                </h3>
                                <div className="text-xs text-slate-500">
                                    Avg. doc length: <strong>{bagOfWords?.avg_doc_length}</strong> words
                                </div>
                            </div>

                            {/* BoW Table */}
                            <div className="max-h-[400px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Word</th>
                                            <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">Frequency</th>
                                            <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">Documents</th>
                                            <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">Importance</th>
                                            <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">% of Corpus</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bagOfWords?.bag_of_words?.map((item: BagOfWordsItem, idx: number) => (
                                            <tr
                                                key={item.word}
                                                className="border-t border-slate-100 hover:bg-blue-50/50 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}</span>
                                                        <span className="font-medium text-slate-700">{item.word}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center px-4 py-3">
                                                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                                        {item.frequency}
                                                    </span>
                                                </td>
                                                <td className="text-center px-4 py-3">
                                                    <span className="text-sm text-slate-600">{item.doc_count}</span>
                                                </td>
                                                <td className="text-center px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                                                                style={{ width: `${Math.min(100, (item.importance / 50) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-purple-600">{item.importance}</span>
                                                    </div>
                                                </td>
                                                <td className="text-right px-4 py-3">
                                                    <span className="text-sm text-slate-500">{item.percentage}%</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Stats Footer */}
                            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-6 text-xs text-slate-500">
                                    <span>Vocabulary: <strong className="text-slate-700">{bagOfWords?.vocabulary_size}</strong></span>
                                    <span>Documents: <strong className="text-slate-700">{bagOfWords?.documents?.length}</strong></span>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {/* Entity-specific Details by Type */}
                    <div className="grid grid-cols-2 gap-4">
                        {entities?.entities_by_type && Object.entries(entities.entities_by_type).slice(0, 4).map(([type, items]: [string, any]) => (
                            <GlassCard key={type} className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: ENTITY_COLORS[type] || '#6b7280' }}
                                    />
                                    <h4 className="text-sm font-semibold text-slate-700">{type}</h4>
                                    <span className="text-xs text-slate-400 ml-auto">{items.length} unique</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {items.slice(0, 8).map((item: EntityItem) => (
                                        <span
                                            key={item.text}
                                            className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-default"
                                            title={`${item.count} occurrences`}
                                        >
                                            {item.text}
                                            <span className="ml-1 text-slate-400">({item.count})</span>
                                        </span>
                                    ))}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
