"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/theme-provider"
import type { PickupHistory } from "@/lib/actions/schedules.actions"

export function HistoryClient({ history }: { history: PickupHistory[] }) {
    const { t } = useLanguage()

    const typeTranslations = {
        "إعادة تدوير": t('admin.schedules.types.recycling'),
        "نفايات عامة": t('admin.schedules.types.general'),
        "نفايات عضوية": t('admin.schedules.types.organic'),
        "مواد كبيرة": t('admin.schedules.types.bulky'),
    }

    const statusTranslations = {
        "مكتمل": t('history.status.completed'),
        "ملغي": t('history.status.cancelled'),
        "مجدول": t('history.status.scheduled'),
        "فاتك - لم تكن بالخارج": t('history.status.missed'),
    }

    const getStatusDetails = (status: string) => {
        switch (status) {
        case "مكتمل":
            return { icon: CheckCircle, color: "text-primary", badge: "secondary" as const };
        case "ملغي":
            return { icon: XCircle, color: "text-destructive", badge: "destructive" as const };
        default:
            return { icon: XCircle, color: "text-destructive", badge: "destructive" as const };
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{t('history.title')}</CardTitle>
                <CardDescription>
                {t('history.description')}
                </CardDescription>
            </div>
            
            </CardHeader>
            <CardContent>
            <div className="relative ps-6">
                <div className="absolute left-[30px] rtl:right-[30px] rtl:left-auto top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
                <div className="space-y-8">
                {history.map((item, index) => {
                    const details = getStatusDetails(item.status);
                    return (
                    <div key={index} className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 z-10">
                        <details.icon className={`h-5 w-5 ${details.color}`} />
                        </div>
                        <div className="flex-1 pt-1.5">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <p className="font-semibold">{t('history.pickup_type', { type: typeTranslations[item.type as keyof typeof typeTranslations] || item.type })}</p>
                            <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <Badge variant={details.badge}>{statusTranslations[item.status as keyof typeof statusTranslations] || item.status}</Badge>
                            {item.points > 0 && <span className="text-sm font-medium text-accent">+{t('history.points', { count: item.points })}</span>}
                        </div>
                        </div>
                    </div>
                    )
                })}
                </div>
            </div>
            </CardContent>
        </Card>
    )
}
