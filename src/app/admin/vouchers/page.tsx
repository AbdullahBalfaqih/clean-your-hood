import { AppLayout } from "@/components/app-layout";
import { getVouchers, getVoucherRedemptions, type Voucher, type VoucherRedemption } from "@/lib/actions/vouchers.actions";
import { VouchersClient } from "./vouchers-client";
import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const revalidate = 0;

const VouchersSkeleton = () => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-8 w-52" />
                    <Skeleton className="h-4 w-80 mt-2" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg p-2 space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-6 w-20 rounded-full" />
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
    let vouchers: Voucher[] = [];
    let redemptions: VoucherRedemption[] = [];
    let error: string | null = null;

    try {
        [vouchers, redemptions] = await Promise.all([
            getVouchers(),
            getVoucherRedemptions()
        ]);
    } catch (e: any) {
        console.error("Database connection error in /admin/vouchers:", e.message);
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

    return <VouchersClient initialVouchers={vouchers} initialRedemptions={redemptions} />;
}

export default async function ManageVouchersPage() {
    return (
             <Suspense fallback={<VouchersSkeleton />}>
                <DataFetcher />
            </Suspense>
     );
}
