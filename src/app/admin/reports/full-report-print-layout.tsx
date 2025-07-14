"use client"

import * as React from "react"
import { format } from "date-fns"
import { arSA } from "date-fns/locale"
import { LeafRecycleIcon } from "@/components/icons"
import { useLanguage } from "@/components/theme-provider"
import type { FullReportData } from "@/lib/actions/reports.actions"

// This component is designed to be rendered off-screen for PDF generation.
// It will be styled with simple CSS for printing.

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6 break-inside-avoid">
        <h2 className="text-xl font-bold border-b-2 border-primary pb-2 mb-3 text-primary">{title}</h2>
        {children}
    </div>
);

const StatCard: React.FC<{ title: string, value: string | number }> = ({ title, value }) => (
    <div className="bg-gray-100 p-3 rounded-md text-center">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);

const ReportTable: React.FC<{ headers: string[], data: (string | number | null)[][] }> = ({ headers, data }) => (
    <table className="w-full border-collapse text-right text-sm">
        <thead>
            <tr className="bg-gray-200">
                {headers.map((h, i) => <th key={i} className="p-2 border border-gray-400">{h}</th>)}
            </tr>
        </thead>
        <tbody>
            {data.map((row, i) => (
                <tr key={i} className="odd:bg-gray-50">
                    {row.map((cell, j) => <td key={j} className="p-2 border border-gray-400">{cell ?? 'N/A'}</td>)}
                </tr>
            ))}
        </tbody>
    </table>
);

export const FullReportPrintLayout = ({ reportData }: { reportData: FullReportData }) => {
    const { t } = useLanguage();
    const reportDate = new Date();

    const { stats, users, schedules, donations, financialSupport, redemptions, feedback } = reportData;

    return (
        <div id="print-report" className="p-6 bg-white text-black font-body" style={{ width: '210mm', minHeight: '297mm', direction: 'rtl' }}>
            <header className="flex justify-between items-center pb-4 border-b-2 border-black">
                <div>
                    <h1 className="text-3xl font-bold font-headline">التقرير الشامل لنظام نظف حيك</h1>
                    <p className="text-lg">
                        تاريخ التقرير: {format(reportDate, "EEEE, dd MMMM yyyy", { locale: arSA })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <LeafRecycleIcon className="h-12 w-12 text-green-700" />
                    <span className="text-2xl font-bold font-headline text-green-700">نظف حيك</span>
                </div>
            </header>

            <main className="mt-6">
                <Section title="ملخص الأداء العام">
                    <div className="grid grid-cols-4 gap-4">
                        <StatCard title={t('admin.reports.stats.total_users')} value={stats.totalUsers} />
                        <StatCard title={t('admin.reports.stats.total_donations')} value={stats.totalSupport} />
                        <StatCard title={t('admin.reports.stats.recycled_waste') + ' (كجم)'} value={stats.recycledWaste.toFixed(2)} />
                        <StatCard
                            title={t('admin.reports.stats.participation_rate')}
                            value={`${stats.participationRate.toFixed(1)}%`}
                        />

                    </div>
                </Section>

                <Section title="تقرير المستخدمين">
                    <ReportTable headers={["المعرف", "الاسم", "البريد الإلكتروني", "الدور", "النقاط"]} data={users.map(u => [u.UserID, u.FullName, u.Email, u.Role, u.PointsBalance])} />
                </Section>

                <Section title="تقرير جداول الرفع">
                    <ReportTable headers={["المعرف", "المستخدم", "النوع", "التاريخ", "الحالة"]} data={schedules.map(s => [s.PickupID, s.UserFullName, s.Type, format(new Date(s.PickupDate), 'yyyy-MM-dd'), s.Status])} />
                </Section>

                <Section title="التقرير المالي">
                    <h3 className="text-lg font-bold mb-2">الدعم المالي الوارد</h3>
                    <ReportTable headers={["المعرف", "الداعم", "المبلغ", "البنك", "الحالة"]} data={financialSupport.map(fs => [fs.SupportID, fs.FullName, fs.Amount.toLocaleString(), fs.BankName, fs.Status])} />
                    <h3 className="text-lg font-bold mt-4 mb-2">استبدال النقاط</h3>
                    <ReportTable headers={["المعرف", "المستخدم", "النقاط", "المبلغ", "الحالة"]} data={redemptions.map(r => [r.RedemptionID, r.FullName, r.PointsRedeemed, r.Amount, r.Status])} />
                </Section>

                <Section title="تقرير تبرعات الملابس">
                    <ReportTable headers={["المعرف", "المتبرع", "النوع", "الكمية", "الحالة"]} data={donations.map(d => [d.DonationID, d.FullName, d.ClothingType, d.Quantity, d.Status])} />
                </Section>

                <Section title="تقرير البلاغات والآراء">
                    <ReportTable headers={["المعرف", "المستخدم", "النوع", "الحالة"]} data={feedback.map(f => [f.FeedbackID, f.FullName, f.FeedbackType, f.Status])} />
                </Section>

            </main>

            <footer className="mt-8 text-center text-sm text-gray-500 absolute bottom-4 right-0 left-0">
                <p>تم إنشاء هذا التقرير تلقائيًا من نظام "نظف حيك".</p>
            </footer>
        </div>
    )
}
