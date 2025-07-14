"use client"

import {
    Line,
    LineChart as RechartsLineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"
import { useLanguage } from "@/components/theme-provider"
import type { UserGrowthData } from "@/lib/actions/reports.actions"

export function UserGrowthChart({ data }: { data: UserGrowthData[] }) {
    const { t } = useLanguage()

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer>
                <RechartsLineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                        }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="users" name={t('admin.reports.charts.user_growth.legend')} stroke="hsl(var(--chart-1))" strokeWidth={2} />
                </RechartsLineChart>
            </ResponsiveContainer>
        </div>
    )
}
