import { AppLayout } from "@/components/app-layout";
import { getBinLocations, type BinLocation } from "@/lib/actions/locations.actions";
import { LocationsClient } from "./locations-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const LocationsSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-72 mt-2" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg p-2 space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-24" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 w-10" />
                                    <Skeleton className="h-10 w-10" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card className="h-[400px] lg:h-auto lg:aspect-square">
                <Skeleton className="h-full w-full" />
            </Card>
        </div>
    </div>
);

const DataFetcher = async () => {
    let locations: BinLocation[] = [];
    let error: string | null = null;

    try {
        locations = await getBinLocations();
    } catch (e: any) {
        console.error("Database connection error in /admin/locations:", e.message);
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

    return <LocationsClient initialLocations={locations} />;
}

export default async function ManageLocationsPage() {
    return (
             <Suspense fallback={<LocationsSkeleton />}>
                <DataFetcher />
            </Suspense>
     );
}
