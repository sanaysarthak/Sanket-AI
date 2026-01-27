"use client";
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatPoint {
    lat: number;
    lng: number;
    intensity: number;
}

interface HeatmapLayerProps {
    points: HeatPoint[];
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
    const map = useMap();
    const heatLayerRef = useRef<any>(null);

    useEffect(() => {
        if (!map || points.length === 0) return;

        // Remove existing heat layer if any
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
        }

        // Create heat data array
        const heatData: [number, number, number][] = points.map(p => [p.lat, p.lng, p.intensity]);

        // Create heat layer with thermal vision gradient
        const heat = (L as any).heatLayer(heatData, {
            radius: 35,
            blur: 20,
            maxZoom: 18,
            max: 1.0,
            minOpacity: 0.35,
            gradient: {
                0.0: '#000004',   // Black (coldest)
                0.1: '#1b0c41',   // Dark purple
                0.2: '#4a0c6b',   // Purple
                0.3: '#781c6d',   // Magenta
                0.4: '#a52c60',   // Pink-red
                0.5: '#cf4446',   // Red-orange
                0.6: '#ed6925',   // Orange
                0.7: '#fb9b06',   // Yellow-orange
                0.8: '#f7d13d',   // Yellow
                0.9: '#fcffa4',   // Pale yellow
                1.0: '#ffffcc'    // White-hot (hottest)
            }
        });

        heat.addTo(map);
        heatLayerRef.current = heat;

        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
            }
        };
    }, [map, points]);

    return null;
}
