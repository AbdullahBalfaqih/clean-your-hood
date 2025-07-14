"use client"

import * as React from "react"
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom marker icon using inline SVG to avoid asset path issues.
const customMarkerIcon = L.divIcon({
  html: `<svg viewBox="0 0 24 24" width="32" height="32" fill="hsl(var(--primary))" stroke="white" stroke-width="1.5" style="filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.4));" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  className: '', // No default class, the SVG is self-contained
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});


interface InteractiveMapProps {
    location: { lat: number; lng: number } | null;
    onLocationChange: (location: { lat: number; lng: number }) => void;
}

const InteractiveMap = ({ location, onLocationChange }: InteractiveMapProps) => {
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<L.Map | null>(null);
    const markerRef = React.useRef<L.Marker | null>(null);

    // Effect to initialize the map and marker. Runs only once on mount.
    React.useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const initialCenter: L.LatLngTuple = location ? [location.lat, location.lng] : [15.9398, 48.3396];
            const map = L.map(mapContainerRef.current).setView(initialCenter, 16); // Increased zoom level
            
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            }).addTo(map);

            const marker = L.marker(initialCenter, { draggable: true, icon: customMarkerIcon }).addTo(map);

            marker.on('dragend', () => {
                onLocationChange(marker.getLatLng());
            });

            map.on('click', (e) => {
                marker.setLatLng(e.latlng);
                onLocationChange(e.latlng);
            });

            mapInstanceRef.current = map;
            markerRef.current = marker;
        }

        // Cleanup function to destroy the map instance when the component unmounts.
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once.

    // Effect to move the map and marker when location prop changes from OUTSIDE (e.g., GPS button)
    React.useEffect(() => {
        const map = mapInstanceRef.current;
        const marker = markerRef.current;

        if (map && marker && location) {
            const currentPos = marker.getLatLng();
            // Prevent re-centering if the location change came from the map itself
            if (currentPos.lat !== location.lat || currentPos.lng !== location.lng) {
                marker.setLatLng(location);
                map.flyTo(location, 16);
            }
        }
    }, [location]);

    return <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />;
};

export default InteractiveMap;
