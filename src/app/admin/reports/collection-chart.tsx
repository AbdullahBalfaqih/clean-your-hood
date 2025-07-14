"use client"

import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid
} from "recharts"
import type { CollectionChartData } from "@/lib/actions/reports.actions"
import { useLanguage } from "@/components/theme-provider"

const chartConfig = {
    recycling: {
        label: "إعادة تدوير",
        color: "hsl(var(--chart-1))",
    },
    organic: {
        label: "عضوي",
        color: "hsl(var(--chart-2))",
    },
    general: {
        label: "عام",
        color: "hsl(var(--chart-4))",
    },
}

export function CollectionChart({ data }: { data: CollectionChartData[] }) {
    const { t } = useLanguage()

    const translatedData = data.map(item => ({
        month: item.month,
        [chartConfig.recycling.label]: item.recycling,
        [chartConfig.organic.label]: item.organic,
        [chartConfig.general.label]: item.general,
    }));

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer>
                <BarChart data={translatedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            direction: "rtl",
                        }}
                    />
                    <Legend />
                    <Bar dataKey={chartConfig.recycling.label} fill={chartConfig.recycling.color} stackId="a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={chartConfig.organic.label} fill={chartConfig.organic.color} stackId="a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={chartConfig.general.label} fill={chartConfig.general.color} stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
