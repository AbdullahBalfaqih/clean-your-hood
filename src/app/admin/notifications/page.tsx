
import { getNotifications, type Notification } from "@/lib/actions/notifications.actions";
import { getUsers, type User } from "@/lib/actions/users.actions";
import { NotificationsClient } from "./notifications-client";
import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const NotificationsSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
            <div className="flex justify-end mb-4">
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="border rounded-lg p-2 space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-5 w-24" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-10" />
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

const DataFetcher = async () => {
    let notifications: Notification[] = [];
    let users: User[] = [];
    let error: string | null = null;

    try {
        [notifications, users] = await Promise.all([
            getNotifications(),
            getUsers()
        ]);
    } catch (e: any) {
        console.error("Database connection error in /admin/notifications:", e.message);
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

    return <NotificationsClient initialNotifications={notifications} users={users} />;
}

export default async function ManageNotificationsPage() {
    return (
        <Suspense fallback={<NotificationsSkeleton />}>
            <DataFetcher />
        </Suspense>
    );
}
