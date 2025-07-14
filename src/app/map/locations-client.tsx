"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapPin } from "lucide-react"
import { useLanguage } from "@/components/theme-provider"
import type { BinLocation } from "@/lib/actions/locations.actions"

const trashIcon = L.divIcon({
    html: `<div class="p-1.5 bg-primary rounded-full shadow-lg ring-2 ring-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

export function LocationsClient({ initialLocations }: { initialLocations: BinLocation[] }) {
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<L.Map | null>(null);
    const mapCenter: [number, number] = initialLocations.length > 0 ? [initialLocations[0].Latitude, initialLocations[0].Longitude] : [15.9398, 48.3396];
    const { t } = useLanguage()

    React.useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: mapCenter,
                zoom: 15,
                scrollWheelZoom: true,
            });

            // تظليل المنطقة
            const highlightPolygon = L.polygon([
                [15.924783, 48.793832],
                [15.929130, 48.792288],
                [15.928094, 48.786311],
                [15.924196, 48.789957]
            ], {
                color: 'blue',
                fillColor: 'blue',
                fillOpacity: 0.3,
            }).addTo(map);
            highlightPolygon.bindPopup("<b>المنطقة التي يغطيها المشروع</b>").openPopup();

            // إضافة طبقة الستلايت (World Imagery)
            const satelliteLayer = L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                {
                    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                }
            ).addTo(map);

            // إضافة طبقة التسميات (المدن، الأماكن، الشوارع)
            const labelsLayer = L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                {
                    attribution: 'Labels © Esri'
                }
            ).addTo(map);

            initialLocations.forEach(loc => {
                const navIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 9.5 12 12l-5.5-2.5L12 2l5.5 7.5z"/><path d="M12 12v10"/></svg>`;

                const gmapsLink = loc.GoogleMapsURL || `https://www.google.com/maps/dir/?api=1&destination=${loc.Latitude},${loc.Longitude}`;

                const buttonHTML = `
                <a href="${gmapsLink}" target="_blank" rel="noopener noreferrer" 
                   style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; white-space: nowrap; border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; transition: background-color 150ms; background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); height: 2.25rem; padding: 0 0.75rem; margin-top: 0.5rem; width: 100%; text-decoration: none;">
                    ${navIconSVG}
                    <span>${t('map.get_directions')}</span>
                </a>`;

                const finalPopupContent = `
                <div style="font-family: 'Tajawal', sans-serif; text-align: right;">
                    <h3 style="font-weight: 700; font-size: 1.125rem;">${loc.Name}</h3>
                    <p style="font-size: 0.875rem; color: #6B7280;">${t('map.public_bin')}</p>
                    ${buttonHTML}
                </div>
            `;

                L.marker([loc.Latitude, loc.Longitude], { icon: trashIcon })
                    .addTo(map)
                    .bindPopup(finalPopupContent);
            });

            mapInstanceRef.current = map;
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [t, initialLocations, mapCenter]);

    return (
        <Card className="h-[calc(100vh-10rem)] flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><MapPin /> {t('map.title')}</CardTitle>
                <CardDescription>
                    {t('map.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-0 relative">
                <div ref={mapContainerRef} className="h-full w-full" style={{ zIndex: 0 }} />
            </CardContent>
        </Card>
    )
}
