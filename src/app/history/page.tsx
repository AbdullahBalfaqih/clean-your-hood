
"use client"

import {   useSession } from "@/components/app-layout"
import { getPickupsHistoryForUser, type PickupHistory } from "@/lib/actions/schedules.actions"
import { HistoryClient } from "./history-client"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, History } from "lucide-react"

const HistorySkeleton = () => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

export default function HistoryPage() {
    const { currentUser, isLoading: isSessionLoading } = useSession();
    const [history, setHistory] = useState<PickupHistory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isSessionLoading) return;

        if (!currentUser) {
            setError("يرجى تسجيل الدخول لعرض السجل الخاص بك.");
            setIsLoading(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                const historyData = await getPickupsHistoryForUser(currentUser.id);
                setHistory(historyData);
            } catch (e: any) {
                console.error("Database connection error in /history:", e.message);
                setError(e.message || "An unknown error occurred while connecting to the database.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [currentUser, isSessionLoading]);

    const renderContent = () => {
        if (isLoading || isSessionLoading) {
            return <HistorySkeleton />;
        }

        if (error) {
            return (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>خطأ</AlertTitle>
                    <AlertDescription>
                        <p>{error}</p>
                    </AlertDescription>
                </Alert>
            );
        }

        if (history.length === 0) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>لا يوجد سجل</CardTitle>
                        <CardDescription>لم تقم بأي عمليات رفع بعد.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                        <History className="h-24 w-24 mx-auto my-4" />
                        <p>ابدأ بجدولة أول عملية رفع لك لترى سجلك هنا.</p>
                    </CardContent>
                </Card>
            )
        }

        return <HistoryClient history={history} />;
    };

    return (
        <>
            {renderContent()}
        </>
    );
}
