"use client";
import dynamic from 'next/dynamic';
import React, { useMemo } from 'react';
import { scaleLog } from 'd3-scale';

const WordCloud = dynamic(() => import('react-d3-cloud'), {
    ssr: false,
    loading: () => <div className="animate-pulse flex items-center justify-center text-slate-400">Loading Cloud...</div>
});

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

const fontSizeMapper = (word: any) => Math.log2(Math.max(word.value, 1)) * 5 + 16;

export default function ClientWordCloud({ words, maxWords = 60 }: { words: any[], maxWords?: number }) {
    const data = useMemo(() => {
        return words.slice(0, maxWords).map(w => ({
            text: w.text,
            value: w.value * 10,
        }));
    }, [words, maxWords]);

    if (data.length === 0) return <div>No data</div>;

    return (
        <div className="h-[400px] w-full flex items-center justify-center font-sans">
            <WordCloud
                data={data}
                width={800}
                height={400}
                font="Inter"
                fontStyle="italic"
                fontWeight="bold"
                fontSize={fontSizeMapper}
                spiral="rectangular"
                rotate={(w) => (w.value % 2 === 0 ? 0 : 90)}
                padding={5}
                fill={(w: any) => WORD_CLOUD_COLORS[Math.floor(Math.random() * WORD_CLOUD_COLORS.length)]}
            />
        </div>
    );
}
