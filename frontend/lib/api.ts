const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/api`;
const TOKEN = 'admin-token'; // Mock token for demo

// Add a unique ID to prevent caching for demo purposes
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-token': TOKEN
});

// Using a custom fetch wrapper to handle the generic response type safely
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers,
        },
        cache: 'no-store'
    });
    if (!res.ok) throw new Error('API Error');
    return res.json() as Promise<T>;
}

export const api = {
    getFeed: () => fetchWithAuth<any[]>('/feed'),
    getAlerts: () => fetchWithAuth<any[]>('/alerts'),
    getStats: () => fetchWithAuth<any>('/stats'),
    getGraph: () => fetchWithAuth<any>('/graph'),
    triggerScrape: () => fetchWithAuth<any>('/scrape/start', { method: 'POST' }),
    openScrapeFolder: () => fetchWithAuth<any>('/scrape/open-folder', { method: 'POST' }),

    // AI-ML Analytics Endpoints
    getFullAnalytics: () => fetchWithAuth<any>('/analytics/full'),
    getCCTVAnalytics: () => fetchWithAuth<any>('/analytics/cctv'),
    getEmergencyAnalytics: () => fetchWithAuth<any>('/analytics/emergency'),
    getFIRAnalytics: () => fetchWithAuth<any>('/analytics/fir'),
    getSocialAnalytics: () => fetchWithAuth<any>('/analytics/social'),
    getCorrelations: () => fetchWithAuth<any>('/analytics/correlations'),

    // Link Analysis Endpoints
    getLinkAnalysisFull: () => fetchWithAuth<any>('/link-analysis/full'),
    getLinkCorrelations: () => fetchWithAuth<any>('/link-analysis/correlations'),
    getLinkTimeline: () => fetchWithAuth<any>('/link-analysis/timeline'),
    getLinkThreats: () => fetchWithAuth<any>('/link-analysis/threats'),
    getLinkNetwork: () => fetchWithAuth<any>('/link-analysis/network'),
    getLinkHotspots: () => fetchWithAuth<any>('/link-analysis/hotspots'),
    getLinkEventFlow: () => fetchWithAuth<any>('/link-analysis/flow'),

    // NLP / Entity Extraction Endpoints
    getNLPFull: () => fetchWithAuth<any>('/nlp/full'),
    getNLPEntities: () => fetchWithAuth<any>('/nlp/entities'),
    getNLPTopics: () => fetchWithAuth<any>('/nlp/topics'),
    getNLPWordCloud: () => fetchWithAuth<any>('/nlp/wordcloud'),
    getNLPBagOfWords: () => fetchWithAuth<any>('/nlp/bow'),

    // Alerting
    sendAlert: (agencyId: string, intensity: string, message: string) => fetchWithAuth<any>('/alert/send', {
        method: 'POST',
        body: JSON.stringify({ agency_id: agencyId, intensity, message })
    }),
};
