import { AppLayout } from "@/components/app-layout";
import { getRedemptionRequests, type RedemptionRequest } from "@/lib/actions/redemptions.actions";
import { RedemptionsClient } from "./redemptions-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const revalidate = 0;

const RedemptionsSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg p-2 space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                         <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                         <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                        <div className="flex-1">
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <div className="flex justify-center gap-2 flex-1">
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
    let requests: RedemptionRequest[] = [];
    let error: string | null = null;

    try {
        requests = await getRedemptionRequests();
    } catch (e: any) {
        console.error("Database connection error in /admin/redemptions:", e.message);
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

    return <RedemptionsClient initialRequests={requests} />;
}

export default async function ManageRedemptionsPage() {
  return (
  
      <Suspense fallback={<RedemptionsSkeleton />}>
        <DataFetcher />
      </Suspense>
    
  );
}
