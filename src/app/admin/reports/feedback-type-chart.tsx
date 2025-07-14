"use client"

import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, Cell, Legend } from "recharts"
import { useLanguage } from "@/components/theme-provider"
import type { FeedbackChartData } from "@/lib/actions/reports.actions"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-5))"];

export function FeedbackTypeChart({ data }: { data: FeedbackChartData[] }) {
    const { t } = useLanguage()

    const translatedData = data.map(item => {
        let translatedName = item.name;
        if (item.name === "بلاغ") translatedName = t('feedback.type.report');
        if (item.name === "شكوى") translatedName = t('feedback.type.complaint');
        if (item.name === "اقتراح") translatedName = t('feedback.type.suggestion');
        return { ...item, name: translatedName };
    });

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer>
                <RechartsPieChart>
                    <Pie
                        data={translatedData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                            return (
                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                </text>
                            );
                        }}
                    >
                        {translatedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                        }}
                    />
                    <Legend />
                </RechartsPieChart>
            </ResponsiveContainer>
        </div>
    )
}
