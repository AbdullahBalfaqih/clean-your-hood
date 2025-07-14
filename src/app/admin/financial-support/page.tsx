import { getFinancialSupportSubmissions, type FinancialSupportSubmission, getBankAccounts, type BankAccount } from "@/lib/actions/financial.actions";
import { FinancialSupportClient } from "./financial-support-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const revalidate = 0;

const FinancialSupportSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
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
                        <Skeleton className="h-10 w-28" />
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

const DataFetcher = async () => {
    let submissions: FinancialSupportSubmission[] = [];
    let bankAccounts: BankAccount[] = [];
    let error: string | null = null;

    try {
        [submissions, bankAccounts] = await Promise.all([
            getFinancialSupportSubmissions(),
            getBankAccounts()
        ]);
    } catch (e: any) {
        console.error("Database connection error in /admin/financial-support:", e.message);
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

    return <FinancialSupportClient initialSubmissions={submissions} initialBankAccounts={bankAccounts} />;
}


export default async function ManageFinancialSupportPage() {
    return (
        <Suspense fallback={<FinancialSupportSkeleton />}>
            <DataFetcher />
        </Suspense>
    );
}
