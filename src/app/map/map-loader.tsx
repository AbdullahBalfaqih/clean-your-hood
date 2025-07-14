"use client"

import dynamic from 'next/dynamic'
import { Skeleton } from "@/components/ui/skeleton"
import type { BinLocation } from "@/lib/actions/locations.actions"

const MapSkeleton = () => (
    <div className="h-[calc(100vh-10rem)] flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[450px]" />
        </div>
        <div className="p-6 pt-0 flex-grow relative">
            <Skeleton className="h-full w-full" />
        </div>
    </div>
);

const LocationsClient = dynamic(
    () => import("./locations-client").then((mod) => mod.LocationsClient),
    {
        ssr: false,
        loading: () => <MapSkeleton />
    }
);

export function MapLoader({ locations }: { locations: BinLocation[] }) {
    return <LocationsClient initialLocations={locations} />
}
