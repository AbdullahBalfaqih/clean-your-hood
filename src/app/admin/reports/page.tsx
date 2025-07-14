
"use client"

import * as React from "react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Users, HandCoins, Recycle, Download, Loader2, AlertCircle, ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { CollectionChart } from "./collection-chart"
import { UserGrowthChart } from "./user-growth-chart"
import { FeedbackTypeChart } from "./feedback-type-chart"
import { FinancialSummaryChart } from "./financial-summary-chart"
import { FullReportPrintLayout } from "./full-report-print-layout"
import { getReportsData, type ReportsData, type FullReportData } from "@/lib/actions/reports.actions"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { BarChart2 } from "lucide-react"

export const revalidate = 0;

function ReportsSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Skeleton className="h-8 w-56" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-48" />
                </CardHeader>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-5 rounded-sm" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-3 w-32 mt-1" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
                    <TabsTrigger value="overview"><Skeleton className="h-5 w-20" /></TabsTrigger>
                    <TabsTrigger value="users"><Skeleton className="h-5 w-20" /></TabsTrigger>
                    <TabsTrigger value="waste"><Skeleton className="h-5 w-20" /></TabsTrigger>
                    <TabsTrigger value="financials"><Skeleton className="h-5 w-20" /></TabsTrigger>
                    <TabsTrigger value="community"><Skeleton className="h-5 w-20" /></TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64 mt-2" />
                        </CardHeader>
                        <CardContent><Skeleton className="h-[350px] w-full" /></CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

const ChangeIndicator = ({ change }: { change: string }) => {
    const isPositive = change.startsWith('+');
    const isNegative = change.startsWith('-');
    const Icon = isPositive ? ArrowUp : ArrowDown;

    return (
        <p className={cn(
            "text-xs text-muted-foreground flex items-center gap-1",
            isPositive && "text-green-600",
            isNegative && "text-destructive"
        )}>
            <Icon className="h-3 w-3" />
            {change} {`هذا الشهر`}
        </p>
    );
};

export default function ReportsPage() {
    const { t } = useLanguage()
    const { toast } = useToast()
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [isPrinting, setIsPrinting] = React.useState(false)
    const [reportData, setReportData] = React.useState<ReportsData | null>(null);
    const [fullReportData, setFullReportData] = React.useState<FullReportData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const printRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        async function fetchData() {
            try {
                const data = await getReportsData();
                setReportData(data);
            } catch (e: any) {
                setError(e.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleDownloadReport = () => {
        if (isGenerating) return;
        setIsPrinting(true);
    }

    React.useEffect(() => {
        if (isPrinting) {
            const generatePdf = async () => {
                setIsGenerating(true);
                toast({ title: t('admin.reports.toast.generating_title'), description: t('admin.reports.toast.generating_desc') });

                // Fetch the full data needed for the report
                if (!fullReportData) {
                    const fetchedFullData = await getReportsData(true);
                    setFullReportData(fetchedFullData.fullReportData!);
                    // This state change will trigger a re-render. We'll capture on the next effect run.
                    return;
                }

                const reportElement = printRef.current;
                if (!reportElement) {
                    toast({ title: t('admin.reports.toast.error_title'), description: "Report element not found.", variant: "destructive" });
                    setIsGenerating(false);
                    setIsPrinting(false);
                    return;
                }

                try {
                    const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
                    let heightLeft = imgHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pdf.internal.pageSize.getHeight();

                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                        heightLeft -= pdf.internal.pageSize.getHeight();
                    }
                    pdf.save(`Nadhif-Hayak-Report-${new Date().toISOString().split('T')[0]}.pdf`);
                    toast({ title: t('admin.reports.toast.download_complete_title'), description: t('admin.reports.toast.download_complete_desc') });
                } catch (error) {
                    console.error("Error generating PDF:", error);
                    toast({ title: t('admin.reports.toast.error_title'), description: t('admin.reports.toast.error_desc'), variant: "destructive" });
                } finally {
                    setIsGenerating(false);
                    setIsPrinting(false);
                }
            };

            // If fullReportData is now available, generate PDF.
            if (fullReportData) {
                const timer = setTimeout(generatePdf, 500); // Allow time for the component to render before capturing
                return () => clearTimeout(timer);
            } else if (isPrinting) {
                // First time, fetch data.
                generatePdf();
            }
        }
    }, [isPrinting, fullReportData, toast, t]);

    if (isLoading) {
        return <ReportsSkeleton />;
    }

    if (error || !reportData) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ في تحميل التقارير</AlertTitle>
                <AlertDescription>
                    <p>فشل تحميل بيانات التقارير. يرجى التحقق من اتصال قاعدة البيانات والمحاولة مرة أخرى.</p>
                    <p className="mt-2 font-mono text-xs dir-ltr text-left">Error: {error}</p>
                </AlertDescription>
            </Alert>
        );
    }

    const { stats, collectionChartData, userGrowthChartData, financialChartData, feedbackChartData } = reportData;

    const statsCards = [
        { title: t('admin.reports.stats.total_users'), value: stats.totalUsers, icon: Users, change: stats.userChange, iconBg: "bg-blue-100 dark:bg-blue-900", iconColor: "text-blue-600 dark:text-blue-400" },
        { title: 'إجمالي الدعم المالي', value: `${stats.totalSupport.toLocaleString()} ريال`, icon: HandCoins, change: stats.supportChange, iconBg: "bg-green-100 dark:bg-green-900", iconColor: "text-green-600 dark:text-green-400" },
        { title: t('admin.reports.stats.recycled_waste'), value: `${stats.recycledWaste.toFixed(2)} kg`, icon: Recycle, change: stats.wasteChange, iconBg: "bg-orange-100 dark:bg-orange-900", iconColor: "text-orange-600 dark:text-orange-400" },
        { title: t('admin.reports.stats.participation_rate'), value: `${stats.participationRate.toFixed(1)}%`, icon: BarChart2, change: stats.participationChange, iconBg: "bg-purple-100 dark:bg-purple-900", iconColor: "text-purple-600 dark:text-purple-400" },
    ];

    return (
        <>
            <div className="space-y-6">
                <Card className="shadow-sm">
                    <CardHeader className="flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/10 text-primary p-3 rounded-full">
                                <BarChart2 className="h-8 w-8" />
                            </div>
                            <div>
                                <CardTitle className="font-headline text-3xl">{t('admin.reports.title')}</CardTitle>
                                <CardDescription>
                                    {t('admin.reports.description')}
                                </CardDescription>
                            </div>
                        </div>
                        <Button onClick={handleDownloadReport} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Download className="me-2 h-4 w-4" />}
                            {isGenerating ? t('admin.reports.generating_button') : t('admin.reports.download_button')}
                        </Button>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsCards.map((stat) => (
                        <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-200">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={cn("p-3 rounded-full", stat.iconBg)}>
                                    <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold font-headline">{stat.value}</p>
                                    <ChangeIndicator change={stat.change} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs defaultValue="overview">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
                        <TabsTrigger value="overview">{t('admin.reports.tabs.overview')}</TabsTrigger>
                        <TabsTrigger value="users">{t('admin.reports.tabs.users')}</TabsTrigger>
                        <TabsTrigger value="waste">{t('admin.reports.tabs.waste')}</TabsTrigger>
                        <TabsTrigger value="financials">{t('admin.reports.tabs.financials')}</TabsTrigger>
                        <TabsTrigger value="community">{t('admin.reports.tabs.community')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('admin.reports.charts.user_growth.title')}</CardTitle>
                                    <CardDescription>{t('admin.reports.charts.user_growth.desc')}</CardDescription>
                                </CardHeader>
                                <CardContent><UserGrowthChart data={userGrowthChartData} /></CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('admin.reports.collection_trends.title')}</CardTitle>
                                    <CardDescription>{t('admin.reports.collection_trends.description')}</CardDescription>
                                </CardHeader>
                                <CardContent><CollectionChart data={collectionChartData} /></CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="users" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('admin.reports.charts.user_growth.title')}</CardTitle>
                                <CardDescription>{t('admin.reports.charts.user_growth.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent><UserGrowthChart data={userGrowthChartData} /></CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="waste" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('admin.reports.collection_trends.title')}</CardTitle>
                                <CardDescription>{t('admin.reports.collection_trends.description')}</CardDescription>
                            </CardHeader>
                            <CardContent><CollectionChart data={collectionChartData} /></CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="financials" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('admin.reports.charts.financial.title')}</CardTitle>
                                <CardDescription>{t('admin.reports.charts.financial.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent><FinancialSummaryChart data={financialChartData} /></CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="community" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('admin.reports.charts.feedback.title')}</CardTitle>
                                <CardDescription>{t('admin.reports.charts.feedback.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent><FeedbackTypeChart data={feedbackChartData} /></CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
            {isPrinting && fullReportData && <div className="absolute -z-10 -left-[9999px] top-0"><div ref={printRef}><FullReportPrintLayout reportData={fullReportData} /></div></div>}
        </>
    )
}
