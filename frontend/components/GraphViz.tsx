"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs animate-pulse">Initializing Tactical Graph Engine...</div>
});

interface GraphData {
    nodes: any[];
    links: any[];
}

export default function GraphViz({ data }: { data: GraphData }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
    const [highlightNodes, setHighlightNodes] = useState(new Set());
    const [hoverNode, setHoverNode] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<any | null>(null);

    useEffect(() => {
        const updateDims = () => {
            if (containerRef.current) {
                setDimensions({
                    w: containerRef.current.offsetWidth,
                    h: containerRef.current.offsetHeight
                });
            }
        };
        updateDims();
        window.addEventListener('resize', updateDims);
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    // Stabilize graph on data update (prevent full re-heat)
    useEffect(() => {
        if (fgRef.current) {
            // Optional: Adjust reheat intensity based on data usage
            fgRef.current.d3Force('charge').strength(-120);
        }
    }, [data]);

    const handleNodeHover = (node: any) => {
        setHighlightNodes(new Set());
        if (node) {
            setHighlightNodes(new Set([node]));
            setHoverNode(node);
        } else {
            setHoverNode(null);
        }
    };

    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        // Safety check: specific force-graph implementations might pass invalid coords initially
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

        const isHover = node === hoverNode;
        const color = getNodeColor(node.type, node.label);
        const size = getNodeSize(node.type);

        // Glow effect
        const glowSize = size * 1.5 + (isHover ? 5 : 0);
        const gradient = ctx.createRadialGradient(node.x, node.y, size * 0.5, node.x, node.y, glowSize);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowSize, 0, 2 * Math.PI, false);
        ctx.fill();

        // Core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
        ctx.fill();

        // Label (only on hover or if important)
        if (isHover || node.type === 'location' || globalScale > 1.5) {
            const label = node.id.split(':')[1] || node.id;
            const fontSize = 12 / globalScale;
            // Use system font stack or imported font if available
            ctx.font = `${isHover ? 'bold' : ''} ${fontSize}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(label, node.x, node.y + size + 4);
        }
    }, [hoverNode]);

    const getNodeColor = (type: string, label: string) => {
        switch (type) {
            case 'event': return label === 'cctv' ? '#ef4444' : '#3b82f6';
            case 'entity': return '#10b981';
            case 'location': return '#a855f7';
            default: return '#94a3b8';
        }
    };

    const getNodeSize = (type: string) => {
        if (type === 'event') return 4;
        if (type === 'location') return 6;
        return 3;
    };

    const getNeighbors = useCallback(
        (nodeId: string) => {
            const neighborIds = new Set<string>();
            data.links.forEach((link: any) => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                if (sourceId === nodeId) neighborIds.add(String(targetId));
                if (targetId === nodeId) neighborIds.add(String(sourceId));
            });
            return data.nodes.filter((n: any) => neighborIds.has(n.id));
        },
        [data]
    );

    const neighbors = selectedNode ? getNeighbors(selectedNode.id) : [];

    return (
        <div ref={containerRef} className="w-full h-full bg-[#0B1120] rounded relative overflow-hidden border border-[#1e293b] shadow-inner shadow-black/50">
            {/* Overlay Legend / Info */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className="bg-[#0f172a]/90 p-3 rounded border border-slate-700 backdrop-blur-md shadow-lg">
                    <h4 className="text-[10px] font-bold text-slate-300 font-mono mb-2 uppercase tracking-wider border-b border-slate-700 pb-1">Link Analysis v2.0</h4>
                    <div className="space-y-1.5 pt-2">
                        <LegendItem color="#3b82f6" label="Social Intel" />
                        <LegendItem color="#ef4444" label="CCTV Threat" />
                        <LegendItem color="#10b981" label="Entity (Suspect/Org)" />
                        <LegendItem color="#a855f7" label="Location" />
                    </div>
                </div>
            </div>

            {/* Selected Node Detail Panel */}
            {selectedNode && (
                <div className="absolute top-4 right-4 z-10 max-w-sm pointer-events-auto">
                    <div className="bg-[#020617]/95 border border-slate-700/80 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-md p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-1">
                                    {selectedNode.type === 'event' && 'Event Node'}
                                    {selectedNode.type === 'entity' && 'Entity Node'}
                                    {selectedNode.type === 'location' && 'Location Node'}
                                    {!selectedNode.type && 'Node'}</p>
                                <h3 className="text-sm font-semibold text-slate-100">
                                    {(selectedNode.id?.split(':')[1] || selectedNode.id || '').toString().slice(0, 40)}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="text-[10px] text-slate-400 hover:text-slate-100 px-1 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700/80 transition-colors"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-2 text-[11px] text-slate-300 font-mono">
                            {selectedNode.type === 'event' && (
                                <>
                                    {selectedNode.source && (
                                        <p><span className="text-slate-500">Source:</span> {selectedNode.source}</p>
                                    )}
                                    {selectedNode.location && (
                                        <p><span className="text-slate-500">Location:</span> {selectedNode.location}</p>
                                    )}
                                    {selectedNode.timestamp && (
                                        <p><span className="text-slate-500">Time:</span> {new Date(selectedNode.timestamp).toLocaleString()}</p>
                                    )}
                                    {selectedNode.topics && selectedNode.topics.length > 0 && (
                                        <p><span className="text-slate-500">Topics:</span> {selectedNode.topics.join(', ')}</p>
                                    )}
                                </>
                            )}

                            {selectedNode.type === 'entity' && (
                                <>
                                    {selectedNode.text && (
                                        <p><span className="text-slate-500">Entity:</span> {selectedNode.text}</p>
                                    )}
                                    {selectedNode.label && (
                                        <p><span className="text-slate-500">Type:</span> {selectedNode.label}</p>
                                    )}
                                </>
                            )}

                            {selectedNode.type === 'location' && (
                                <>
                                    {selectedNode.name && (
                                        <p><span className="text-slate-500">Location:</span> {selectedNode.name}</p>
                                    )}
                                </>
                            )}

                            {neighbors.length > 0 && (
                                <div className="pt-1 border-t border-slate-800 mt-1">
                                    <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Linked Intelligence</p>
                                    <p className="text-[11px] text-slate-300 mb-1">
                                        {neighbors.length} directly connected nodes
                                    </p>
                                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                        {neighbors.slice(0, 10).map((n: any) => (
                                            <span
                                                key={n.id}
                                                className="px-2 py-0.5 rounded-full bg-slate-800/80 text-[10px] text-slate-200 border border-slate-700/80"
                                            >
                                                {n.type === 'event' && 'EV'}
                                                {n.type === 'entity' && 'EN'}
                                                {n.type === 'location' && 'LOC'}
                                                {n.type ? ':' : ''}{(n.id?.split(':')[1] || n.id).toString().slice(0, 18)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ForceGraph2D
                ref={fgRef}
                width={dimensions.w}
                height={dimensions.h}
                graphData={data}
                backgroundColor="#0B1120"
                nodeCanvasObject={paintNode}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
                    ctx.fill();
                }}
                linkColor={() => '#c0c6d0ff'}
                linkWidth={1}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={() => '#475569'}
                onNodeHover={handleNodeHover}
                onNodeClick={(node: any) => {
                    setSelectedNode(node);
                    if (fgRef.current && Number.isFinite(node.x) && Number.isFinite(node.y)) {
                        fgRef.current.centerAt(node.x, node.y, 800);
                        fgRef.current.zoom(2, 800);
                    }
                }}
                cooldownTicks={100} // Stop simulation after stabilization to prevent jitter
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
            />
        </div>
    );
}

const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full shadow-[0_0_8px] shadow-current" style={{ backgroundColor: color, color: color }}></div>
        <span className="text-[10px] text-slate-400 font-mono">{label}</span>
    </div>
);
