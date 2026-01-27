declare module 'leaflet.heat' {
    import * as L from 'leaflet';
    
    export interface HeatLatLngTuple extends Array<number> {
        0: number;  // latitude
        1: number;  // longitude
        2?: number; // intensity (optional)
    }

    export interface HeatMapOptions {
        minOpacity?: number;
        maxZoom?: number;
        max?: number;
        radius?: number;
        blur?: number;
        gradient?: { [key: number]: string };
    }

    export function heatLayer(
        latlngs: HeatLatLngTuple[],
        options?: HeatMapOptions
    ): L.Layer;
}

declare namespace L {
    export function heatLayer(
        latlngs: Array<[number, number, number?]>,
        options?: {
            minOpacity?: number;
            maxZoom?: number;
            max?: number;
            radius?: number;
            blur?: number;
            gradient?: { [key: number]: string };
        }
    ): L.Layer;
}
