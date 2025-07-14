
"use client"

import {   useSession } from "@/components/app-layout"
import { getUserContributions, getUserBadges, type UserContribution, type UserBadge } from "@/lib/actions/points.actions"
import { getVouchers, type Voucher } from "@/lib/actions/vouchers.actions"
import { RewardsClient } from "./rewards-client"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export const revalidate = 0;

const RewardsSkeleton = () => (
    <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
            <Card className="md:col-span-2">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72 mt-2" />
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-24" />)}
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-80 mt-2" />
            </CardHeader>
            <CardContent>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-2">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-6 w-48" />
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
);

export default function RewardsPage() {
    const { currentUser, isLoading: isSessionLoading } = useSession();

    const [leaderboard, setLeaderboard] = useState<UserContribution[]>([]);
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [currentUserPoints, setCurrentUserPoints] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isSessionLoading) return;

        const fetchData = async () => {
            if (!currentUser) {
                // Handle case where user is not logged in but tries to access the page.
                setIsLoading(false);
                return;
            }

            try {
                const [leaderboardData, userBadgesData, vouchersData] = await Promise.all([
                    getUserContributions(),
                    getUserBadges(currentUser.id),
                    getVouchers()
                ]);

                setLeaderboard(leaderboardData);
                setUserBadges(userBadgesData);
                setVouchers(vouchersData);

                const userInLeaderboard = leaderboardData.find(u => u.UserID === currentUser.id);
                if (userInLeaderboard) {
                    setCurrentUserPoints(userInLeaderboard.PointsBalance);
                }

            } catch (e: any) {
                console.error("Database connection error in /rewards:", e.message);
                setError(e.message || "An unknown error occurred while connecting to the database.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser, isSessionLoading]);


    const renderContent = () => {
        if (isLoading || isSessionLoading) {
            return <RewardsSkeleton />;
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
            );
        }

        if (!currentUser) {
            return (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>تسجيل الدخول مطلوب</AlertTitle>
                    <AlertDescription>
                        يرجى تسجيل الدخول لعرض المكافآت والنقاط الخاصة بك.
                    </AlertDescription>
                </Alert>
            );
        }

        return <RewardsClient
            leaderboard={leaderboard}
            currentUserPoints={currentUserPoints}
            currentUserId={currentUser.id}
            initialUserBadges={userBadges}
            vouchers={vouchers}
        />
    };

    return (
        < >
            {renderContent()}
        </>
    )
}
