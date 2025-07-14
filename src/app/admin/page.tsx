"use client"

import { AppLayout } from "@/components/app-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, Gift, Calendar, BarChart, ChevronLeft, Bell, Award, Ticket, Megaphone, Map, MapPin, HandCoins, Banknote, Truck, FilePenLine } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/theme-provider"

export default function AdminPage() {
  const { t } = useLanguage()

  const adminSections = [
    {
      title: t('sidebar.admin.users'),
      icon: Users,
      href: "/admin/users",
      description: t('admin.dashboard.card.users_desc'),
    },
    {
      title: t('sidebar.admin.points'),
      icon: Award,
      href: "/admin/points",
      description: t('admin.dashboard.card.points_desc'),
    },
    {
      title: t('sidebar.admin.vouchers'),
      icon: Ticket,
      href: "/admin/vouchers",
      description: t('admin.dashboard.card.vouchers_desc'),
    },
     {
      title: t('sidebar.admin.notifications'),
      icon: Bell,
      href: "/admin/notifications",
      description: t('admin.dashboard.card.notifications_desc'),
    },
    {
      title: t('sidebar.admin.feedback'),
      icon: Megaphone,
      href: "/admin/feedback",
      description: t('admin.dashboard.card.feedback_desc'),
    },
    {
      title: t('sidebar.admin.donations'),
      icon: Gift,
      href: "/admin/donations",
      description: t('admin.dashboard.card.donations_desc'),
    },
    {
      title: t('sidebar.admin.financial'),
      icon: HandCoins,
      href: "/admin/financial-support",
      description: t('admin.dashboard.card.financial_desc'),
    },
    {
      title: t('sidebar.admin.redemptions'),
      icon: Banknote,
      href: "/admin/redemptions",
      description: t('admin.dashboard.card.redemptions_desc'),
    },
    {
      title: t('sidebar.admin.schedules'),
      icon: Calendar,
      href: "/admin/schedules",
      description: t('admin.dashboard.card.schedules_desc'),
    },
    {
      title: t('sidebar.admin.map'),
      icon: Map,
      href: "/admin/map",
      description: t('admin.dashboard.card.map_desc'),
    },
    {
      title: t('sidebar.admin.locations'),
      icon: MapPin,
      href: "/admin/locations",
      description: t('admin.dashboard.card.locations_desc'),
      },
      {
          title: t('sidebar.admin.news'),
          icon: FilePenLine,
          href: "/admin/news",
          description: t('admin.dashboard.card.news_desc'),
      },
    {
      title: t('sidebar.admin.reports'),
      icon: BarChart,
      href: "/admin/reports",
      description: t('admin.dashboard.card.reports_desc'),
    },
  ]

  return (
       <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">{t('admin.dashboard.title')}</CardTitle>
            <CardDescription>
              {t('admin.dashboard.description')}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {adminSections.map((item) => (
            <Link href={item.href} key={item.title}>
              <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex flex-row items-start justify-between">
                    <item.icon className="h-12 w-12 text-primary" />
                    <ChevronLeft className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="mt-auto pt-4">
                    <h3 className="text-xl font-bold font-headline">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
   )
}
