import { AppLayout } from "@/components/app-layout";
import { getUsers, type User } from "@/lib/actions/users.actions";
import { UsersClient } from "./users-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const revalidate = 0;

const UsersSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="border rounded-lg p-2 space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-20" />
                        <div className="flex gap-2">
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
    let users: User[] = [];
    let error: string | null = null;
    
    try {
        users = await getUsers();
    } catch (e: any) {
        console.error("Database connection error in /admin/users:", e.message);
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

    return <UsersClient initialUsers={users} />;
}

export default async function ManageUsersPage() {
  return (
   
        <Suspense fallback={<UsersSkeleton />}>
            <DataFetcher />
        </Suspense>
 
  );
}
