import { getUsers, type User } from "@/lib/actions/users.actions";
import { getBinLocations, type BinLocation } from "@/lib/actions/locations.actions";
import { MapClient } from "./map-client";
import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getLandmarks, type Landmark } from "@/lib/actions/landmarks.actions";

const MapSkeleton = () => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg border h-96 flex items-center justify-center">
                <Skeleton className="h-1/2 w-1/2" />
            </div>
        </CardContent>
    </Card>
);

const DataFetcher = async () => {
    let houses: User[] = [];
    let bins: BinLocation[] = [];
    let error: string | null = null;
    let landmarks: Landmark[] = [];
    try {
        [houses, bins, landmarks] = await Promise.all([
            getUsers(),

            getBinLocations(),
            getLandmarks(),
        ]);
    } catch (e: any) {
        console.error("Database connection error in /admin/map:", e.message);
        error = e.message || "An unknown error occurred while connecting to the database.";
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ في الاتصال بقاعدة البيانات</AlertTitle>
                <AlertDescription>
                    <p>فشل تحميل البيانات. يرجى التحقق من إعدادات الاتصال بقاعدة البيانات في ملف .env والتأكد من أن خادم قاعدة البيانات يعمل.</p>
                    <p className="mt-2 font-mono text-xs dir-ltr text-left">Error: {error}</p>
                </AlertDescription>
            </Alert>
        )
    }

    return <MapClient initialHouses={houses} initialBins={bins} initialLandmarks={landmarks} />
}

export default async function MapPage() {
    return (
        <Suspense fallback={<MapSkeleton />}>
            <DataFetcher />
        </Suspense>
    );
}
