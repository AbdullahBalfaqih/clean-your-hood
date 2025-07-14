import { getSchedules, getDrivers, getGeneralSchedules, type Schedule, type Driver, type GeneralSchedule } from "@/lib/actions/schedules.actions";
import { getUsers, type User } from "@/lib/actions/users.actions";
import { SchedulesClient } from "./schedules-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const SchedulesSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-60" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="border rounded-lg p-2 space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="grid grid-cols-6 items-center gap-4 p-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <div className="flex gap-2 justify-center">
                            <Skeleton className="h-10 w-10" />
                            <Skeleton className="h-10 w-10" />
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

const DataFetcher = async () => {
    let schedules: Schedule[] = [];
    let users: User[] = [];
    let drivers: Driver[] = [];
    let generalSchedules: GeneralSchedule[] = [];
    let error: string | null = null;

    try {
        // Fetch all data in parallel
        [schedules, users, drivers, generalSchedules] = await Promise.all([
            getSchedules(),
            getUsers(),
            getDrivers(),
            getGeneralSchedules(),
        ]);
    } catch (e: any) {
        console.error("Database connection error in /admin/schedules:", e.message);
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

    return <SchedulesClient initialSchedules={schedules} users={users} drivers={drivers} initialGeneralSchedules={generalSchedules} />;
}

export default async function ManageSchedulesPage() {
    return (
        <Suspense fallback={<SchedulesSkeleton />}>
            <DataFetcher />
        </Suspense>
    );
}
