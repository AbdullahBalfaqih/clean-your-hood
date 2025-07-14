"use client"

import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { MonthlyReportItem } from "@/lib/actions/dashboard.action"

const chartConfig = {
    recycling: {
        label: "قابل للتدوير",
        color: "hsl(var(--chart-1))",
    },
    organic: {
        label: "عضوي",
        color: "hsl(var(--chart-2))",
    },
    general: {
        label: "عام",
        color: "hsl(var(--chart-5))",
    },
}

export function MonthlyReportChart({ data }: { data: MonthlyReportItem[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                لا توجد بيانات لعرضها.
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <RechartsBarChart accessibilityLayer data={data} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                    dataKey="month"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    orientation="right"
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="recycling" fill="var(--color-recycling)" radius={4} name="قابل للتدوير (كجم)" />
                <Bar dataKey="organic" fill="var(--color-organic)" radius={4} name="عضوي (كجم)" />
                <Bar dataKey="general" fill="var(--color-general)" radius={4} name="عام (كجم)" />
            </RechartsBarChart>
        </ChartContainer>
    )
}
