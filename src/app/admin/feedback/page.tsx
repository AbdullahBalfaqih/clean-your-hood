import { AppLayout } from "@/components/app-layout";
import { getFeedback, type Feedback } from "@/lib/actions/feedback.actions";
import { FeedbackClient } from "./feedback-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const FeedbackSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg p-2 space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-24 rounded-full" />
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
    let feedback: Feedback[] = [];
    let error: string | null = null;
    
    try {
        feedback = await getFeedback();
    } catch (e: any) {
        console.error("Database connection error in /admin/feedback:", e.message);
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

    return <FeedbackClient initialFeedback={feedback} />
}

export default async function ManageFeedbackPage() {
  return (
    
      <Suspense fallback={<FeedbackSkeleton />}>
        <DataFetcher />
      </Suspense>
  
  );
}
