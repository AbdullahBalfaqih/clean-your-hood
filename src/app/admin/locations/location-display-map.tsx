
"use client"

import * as React from "react"
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type LocationType = 'house' | 'bin' | 'mosque' | 'hospital' | 'school' | 'park';

type Location = {
    id: number;
    name: string;
    lat: number;
    lng: number;
    type: LocationType;
    status?: 'collected' | 'scheduled' | 'missed' | 'no-pickup' | 'unknown';
}

const getIconSvg = (type: LocationType) => {
    switch (type) {
        case 'house': return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
        case 'bin': return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;
        case 'mosque': return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13h4l3-3 3 3h4"/><path d="M12 2v8l-2-2-2 2"/><path d="M14 22v-4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4"/><path d="M18 4H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/></svg>`;
        case 'hospital': return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10"/><path d="M10 12h4"/><path d="M12 10v4"/><rect width="20" height="16" x="2" y="4" rx="2"/></svg>`;
        case 'school': return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><path d="M12 5v17"/></svg>`;
        case 'park': return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/><rect width="18" height="18" x="3" y="2" rx="2"/></svg>`;
        default: return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
    }
}

const createMarkerIcon = (type: Location['type'], status?: Location['status']) => {
    let color = 'hsl(var(--muted-foreground))';

    switch (type) {
        case 'house':
            if (status === 'collected') color = 'hsl(var(--chart-1))'; // Primary (Green)
            else if (status === 'scheduled') color = 'hsl(var(--chart-2))'; // Accent (Yellow)
            else if (status === 'missed') color = 'hsl(var(--destructive))'; // Destructive (Red)
            else color = 'hsl(var(--muted-foreground))'; // Grey for no-pickup/unknown
            break;
        case 'bin': color = 'hsl(var(--primary))'; break;
        case 'mosque': color = 'hsl(142, 60%, 40%)'; break; // A specific green
        case 'hospital': color = 'hsl(0, 72%, 51%)'; break; // A specific red
        case 'school': color = 'hsl(35, 92%, 55%)'; break; // A specific orange
        case 'park': color = 'hsl(262, 80%, 58%)'; break; // Indigo
        default: color = 'hsl(var(--muted-foreground))';
    }

    const iconSvg = getIconSvg(type);

    return L.divIcon({
        html: `<div class="p-1.5 rounded-full shadow-lg ring-2 ring-white" style="background-color: ${color};">${iconSvg}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });
};

interface LocationDisplayMapProps {
    locations: Location[];
    mapCenter: [number, number];
    onMarkerClick?: (id: number) => void;
    zoomLevel?: number;
    setMapInstance?: React.MutableRefObject<L.Map | null>
}

export default function LocationDisplayMap({ locations, mapCenter, onMarkerClick, zoomLevel = 15, setMapInstance }: LocationDisplayMapProps) {
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceInternalRef = React.useRef<L.Map | null>(null);
    const markersRef = React.useRef<L.Marker[]>([]);

    React.useEffect(() => {
        if (mapRef.current && !mapInstanceInternalRef.current) {
            const map = L.map(mapRef.current).setView(mapCenter, zoomLevel);

            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri'
            }).addTo(map);

            mapInstanceInternalRef.current = map;
            if (setMapInstance) {
                setMapInstance.current = map;
            }
        }

        return () => {
            if (mapInstanceInternalRef.current) {
                mapInstanceInternalRef.current.remove();
                mapInstanceInternalRef.current = null;
                if (setMapInstance) {
                    setMapInstance.current = null;
                }
            }
        };
    }, []); // Run only once

    React.useEffect(() => {
        if (mapInstanceInternalRef.current) {
            mapInstanceInternalRef.current.flyTo(mapCenter, mapInstanceInternalRef.current.getZoom());
        }
    }, [mapCenter]);

    React.useEffect(() => {
        if (mapInstanceInternalRef.current) {
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            const newMarkers = locations.map(loc => {
                const markerIcon = createMarkerIcon(loc.type, loc.status);
                const marker = L.marker([loc.lat, loc.lng], { icon: markerIcon }).addTo(mapInstanceInternalRef.current!);

                marker.bindTooltip(loc.name);

                if (onMarkerClick && loc.type === 'house') {
                    marker.on('click', () => onMarkerClick(loc.id));
                }

                return marker;
            });

            markersRef.current = newMarkers;
        }
    }, [locations, onMarkerClick]);

    return <div ref={mapRef} className="h-full w-full rounded-lg z-0" />;
}
