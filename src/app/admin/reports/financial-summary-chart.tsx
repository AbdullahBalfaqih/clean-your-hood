"use client"

import {
    Bar,
    BarChart as RechartsBarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts"
import { useLanguage } from "@/components/theme-provider"
import type { FinancialChartData } from "@/lib/actions/reports.actions"

export function FinancialSummaryChart({ data }: { data: FinancialChartData[] }) {
    const { t, language } = useLanguage()

    const translatedData = data.map(item => {
        let translatedName = item.name;
        if (item.name === 'Financial Support') translatedName = t('admin.reports.charts.financial.support');
        if (item.name === 'Redemptions') translatedName = t('admin.reports.charts.financial.redemptions');
        return { ...item, name: translatedName };
    });

    // Using chart-1 (primary) and chart-2 (accent/yellow)
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"];

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer>
                <RechartsBarChart data={translatedData} layout="vertical" margin={{ left: language === 'ar' ? 0 : 100, right: language === 'ar' ? 40 : 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" stroke="hsl(var(--foreground))" />
                    <YAxis
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--foreground))"
                        width={100}
                        tick={{ textAnchor: 'end', dx: -5 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                        }}
                    />
                    <Bar dataKey="value" name={t('admin.reports.charts.financial.amount')} radius={[0, 4, 4, 0]}>
                        {translatedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    )
}
