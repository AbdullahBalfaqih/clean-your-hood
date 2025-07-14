 import { getUserContributions, getPointSettings, type UserContribution, type PointSettings } from "@/lib/actions/points.actions";
import { PointsClient } from "./points-client";
import { Suspense } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const PointsSkeleton = () => (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </CardHeader>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-12 w-full" />
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-8 w-52" />
                        <Skeleton className="h-10 w-64" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg p-2 space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-2">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-6 w-20" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-24" />
                                    <Skeleton className="h-9 w-24" />
                                    <Skeleton className="h-9 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);


const DataFetcher = async () => {
    let users: UserContribution[] = [];
    let settings: PointSettings | null = null;
    let error: string | null = null;

    try {
        [users, settings] = await Promise.all([
            getUserContributions(),
            getPointSettings()
        ]);
    } catch (e: any) {
        console.error("Database connection error in /admin/points:", e.message);
        error = e.message || "An unknown error occurred while connecting to the database.";
    }

    if (error || !settings) {
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

    return <PointsClient initialUsers={users} initialSettings={settings} />
}


export default function ManagePointsPage() {
    return (
             <Suspense fallback={<PointsSkeleton />}>
                <DataFetcher />
            </Suspense>
     );
}
