import { AppLayout } from "@/components/app-layout";
import { getBinLocations, type BinLocation } from "@/lib/actions/locations.actions";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { MapLoader } from "./map-loader";

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

const DataFetcher = async () => {
    let locations: BinLocation[] = [];
    let error: string | null = null;

    try {
        locations = await getBinLocations();
    } catch (e: any) {
        console.error("Database connection error in /map:", e.message);
        error = e.message || "An unknown error occurred while connecting to the database.";
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ في الاتصال بقاعدة البيانات</AlertTitle>
                <AlertDescription>
                    <p>فشل تحميل بيانات مواقع الحاويات. يرجى التحقق من إعدادات الاتصال بقاعدة البيانات.</p>
                    <p className="mt-2 font-mono text-xs dir-ltr text-left">Error: {error}</p>
                </AlertDescription>
            </Alert>
        )
    }

    return <MapLoader locations={locations} />;
}


export default async function MapPage() {
    return (
        
            <Suspense fallback={<MapSkeleton />}>
                <DataFetcher />
            </Suspense>
         
    )
}
