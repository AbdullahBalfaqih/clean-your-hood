
"use client"

import { useSession } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import {
    Calendar,
    ChevronLeft,
    History,
    Recycle,
    Trophy,
    TreePine,
    Wind,
    PlusCircle,
    Wand2,
    CalendarPlus,
    Info,
} from "lucide-react"
import Link from "next/link"
import { MonthlyReportChart } from "./monthly-report-chart"
import { useLanguage } from "@/components/theme-provider"
import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardData, type DashboardData } from "@/lib/actions/dashboard.action"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDistanceToNow } from "date-fns"
import { arSA } from "date-fns/locale"



function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-9 w-64 mb-4" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-5 rounded-sm" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-3 w-40 mt-1" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-5 w-5 rounded-sm" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-3 w-32 mt-1" />
                        </CardContent>
                    </Card>
                    <Card className="sm:col-span-2 lg:col-span-1">
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-56 mt-2" />
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-14 w-14 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-14 w-14 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function DashboardClient() {
    const { t } = useLanguage()
    const { currentUser, isLoading: isSessionLoading } = useSession()
    const [data, setData] = React.useState<DashboardData | null>(null)
    const [isLoadingData, setIsLoadingData] = React.useState(true)

    React.useEffect(() => {
        if (isSessionLoading) return;
        if (!currentUser) {
            setIsLoadingData(false);
            return;
        };

        async function loadData() {
            setIsLoadingData(true);
            const dashboardData = await getDashboardData(currentUser!.id);
            setData(dashboardData);
            setIsLoadingData(false);
        }
        loadData();
    }, [currentUser, isSessionLoading])

    if (isSessionLoading || isLoadingData) {
        return <DashboardSkeleton />;
    }

    const userName = currentUser ? currentUser.name.split(" ")[0] : t('usermenu.visitor');

    if (!currentUser || !data) {
        return (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>مرحباً بك!</AlertTitle>
                <AlertDescription>
                    <p>يبدو أنك زائر جديد أو لم تسجل دخولك بعد. </p>
                    <div className="mt-4 flex gap-2">
                        <Button asChild><Link href="/login">تسجيل الدخول</Link></Button>
                        <Button asChild variant="outline"><Link href="/register">إنشاء حساب جديد</Link></Button>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    const { points, nextPickup, notifications, monthlyReport, environmentalImpact, nextGeneralPickup } = data;

    return (
        <div className="space-y-8">

            <div>
                <h1 className="text-3xl font-bold font-headline text-foreground mb-4">
                    {t('dashboard.welcome', { name: userName })}
                </h1>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.cards.next_pickup')}</CardTitle>
                            <Calendar className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            {nextPickup ? (
                                <>
                                    <div className="text-3xl font-bold font-headline">{formatDistanceToNow(new Date(nextPickup.date), { addSuffix: true, locale: arSA })}</div>

                                    <p className="text-xs text-muted-foreground">{nextPickup.type}</p>
                                </>
                            ) : nextGeneralPickup ? (
                                <>
                                        <div className="text-xl font-bold font-headline">
                                            الرفع العام القادم: {nextGeneralPickup.day}
                                        </div>
                                        <p className="text-xl font-bold font-headline text-muted-foreground">
                                            {nextGeneralPickup.time}
                                        </p>


                                </>
                            ) : (
                                <>
                                    <div className="text-xl font-bold font-headline">لا يوجد رفع قادم</div>
                                    <p className="text-xs text-muted-foreground">اطلب رفعًا جديدًا من الأسفل</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.cards.points_earned')}</CardTitle>
                            <Trophy className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold font-headline">{t('dashboard.cards.points_value', { value: points.toLocaleString() })}</div>
                            <p className="text-xs text-muted-foreground">{t('rewards.stats.keep_it_up')}</p>
                        </CardContent>
                    </Card>
                    <Card className="sm:col-span-2 lg:col-span-1 bg-primary text-primary-foreground">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">{t('dashboard.cards.notifications')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center">
                            {notifications.length > 0 ? (
                                <Carousel
                                    opts={{ align: "start", loop: true, direction: "rtl" }}
                                    className="w-full relative px-10"
                                    dir="rtl"
                                >
                                    <CarouselContent className="-ml-1 text-center">
                                        {notifications.map((item, index) => (
                                            <CarouselItem key={index} className="pl-1">
                                                <div className="p-1">
                                                    <h3 className="font-bold font-headline">{item.Title}</h3>
                                                    <p className="text-sm text-primary-foreground/80">{item.Content}</p>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="absolute right-0 top-1/2 -translate-y-1/2 flex bg-primary-foreground/20 hover:bg-primary-foreground/30 border-none text-black" />
                                    <CarouselNext className="absolute left-0 top-1/2 -translate-y-1/2 flex bg-primary-foreground/20 hover:bg-primary-foreground/30 border-none text-black" />
                                </Carousel>
                            ) : (
                                <div className="text-center w-full text-sm text-primary-foreground/80">
                                    لا توجد إشعارات جديدة.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <div className="bg-primary/10 text-primary rounded-full p-3 w-fit mb-4">
                            <CalendarPlus className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl">{t('dashboard.actions.schedule_title')}</CardTitle>
                        <CardDescription>{t('dashboard.actions.schedule_desc')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/schedule"><PlusCircle className="me-2" /> {t('dashboard.actions.schedule_button')}</Link>
                        </Button>
                    </CardFooter>
                </Card>
                <Card className="flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <div className="bg-primary/10 text-primary rounded-full p-3 w-fit mb-4">
                            <Recycle className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl">{t('dashboard.actions.classify_title')}</CardTitle>
                        <CardDescription>{t('dashboard.actions.classify_desc')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full" variant="secondary">
                            <Link href="/classify"><Wand2 className="me-2" /> {t('dashboard.actions.classify_button')}</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="font-headline">{t('dashboard.report.title')}</CardTitle>
                        <CardDescription>
                            {t('dashboard.report.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="ps-2">
                        <MonthlyReportChart data={monthlyReport} />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-headline">{t('dashboard.impact.title')}</CardTitle>
                        <CardDescription>
                            {t('dashboard.impact.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-100 dark:bg-green-900/50 rounded-full p-3">
                                <TreePine className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <div className="font-bold font-headline text-lg">{t('dashboard.impact.trees_saved', { count: environmentalImpact.treesSaved.toFixed(1) })}</div>
                                <p className="text-sm text-muted-foreground">
                                    {t('dashboard.impact.trees_desc')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-3">
                                <Wind className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="font-bold font-headline text-lg">{t('dashboard.impact.co2_reduced', { value: environmentalImpact.co2Reduced.toFixed(1) })}</div>
                                <p className="text-sm text-muted-foreground">
                                    {t('dashboard.impact.co2_desc', { value: environmentalImpact.kmDrivenEquivalent.toFixed(0) })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Link href="/rewards">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex-row items-center gap-4 space-y-0">
                            <Trophy className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle className="text-lg">{t('dashboard.links.rewards_title')}</CardTitle>
                                <CardDescription>{t('dashboard.links.rewards_desc')}</CardDescription>
                            </div>
                            <ChevronLeft className="h-6 w-6 text-muted-foreground ms-auto flex-shrink-0" />
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/history">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex-row items-center gap-4 space-y-0">
                            <History className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle className="text-lg">{t('dashboard.links.history_title')}</CardTitle>
                                <CardDescription>{t('dashboard.links.history_desc')}</CardDescription>
                            </div>
                            <ChevronLeft className="h-6 w-6 text-muted-foreground ms-auto flex-shrink-0" />
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <DashboardClient />
    )
}
