"use client"

import * as React from "react"
import { format } from "date-fns"
import { arSA } from "date-fns/locale"
import { LeafRecycleIcon } from "@/components/icons"
import { MapPin } from "lucide-react"

type PickupItem = {
    name: string;
    quantity: number;
};

type Schedule = {
    id: string;
    user: string;
    items: PickupItem[];      // بدل type string، مصفوفة الأصناف والكميات
    date: string;
    status: string;
    driver: string | null;
    driverPhone: string | null;
    houseNumber: number;
    address: string;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
}

interface RosterPrintLayoutProps {
    schedules: Schedule[]
    reportDate: Date
}

export const RosterPrintLayout = ({ schedules, reportDate }: RosterPrintLayoutProps) => {
    if (schedules.length === 0) {
        return null
    }

    return (
        <div id="print-roster" className="p-4 bg-white text-black font-body" style={{ width: '210mm', minHeight: '297mm' }}>
            <header className="flex justify-between items-center pb-4 border-b-2 border-black">
                <div>
                    <h1 className="text-3xl font-bold font-headline">كشف جمع النفايات اليومي</h1>
                    <p className="text-lg">
                        التاريخ: {format(reportDate, "EEEE, dd MMMM yyyy", { locale: arSA })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <LeafRecycleIcon className="h-12 w-12 text-green-700" />
                    <span className="text-2xl font-bold font-headline text-green-700">نظف حيك</span>
                </div>
            </header>

            <main className="mt-6">
                <table className="w-full border-collapse text-right text-sm">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border border-gray-400">رقم المنزل</th>
                            <th className="p-2 border border-gray-400">الساكن</th>
                            <th className="p-2 border border-gray-400">نوع النفايات و الكمية</th>
                            <th className="p-2 border border-gray-400">العنوان</th>
                            <th className="p-2 border border-gray-400">رقم هاتف السائق</th>
                            <th className="p-2 border border-gray-400">رابط الخريطة</th>
                            <th className="p-2 border border-gray-400">ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedules.map((schedule) => {
                            const destinationUrl = (schedule.latitude !== null && schedule.longitude !== null)
                                ? `https://www.google.com/maps/dir/?api=1&destination=${schedule.latitude},${schedule.longitude}`
                                : null;

                            console.log("destinationUrl for", schedule.id, "is", destinationUrl);

                            return (
                                <tr key={schedule.id} className="odd:bg-gray-50">
                                    <td className="p-2 border border-gray-400 font-mono font-bold">{schedule.houseNumber}</td>
                                    <td className="p-2 border border-gray-400">{schedule.user}</td>
                                    <td className="p-2 border border-gray-400 whitespace-pre-line">
                                        {schedule.items && schedule.items.length > 0 ? (
                                            schedule.items.map(item => (
                                                <div key={item.name}>
                                                    {item.name} ({item.quantity})
                                                </div>
                                            ))
                                        ) : (
                                            <span>غير محدد</span>
                                        )}
                                    </td>
                                    <td className="p-2 border border-gray-400">
                                        <p className="font-semibold">{schedule.address}</p>
                                    </td>
                                    <td className="p-2 border border-gray-400 font-mono">{schedule.driverPhone || "غير محدد"}</td>
                                    <td className="p-2 border border-gray-400 text-center">
                                        {destinationUrl ? (
                                            <a
                                                href={destinationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-blue-600 text-white rounded inline-block cursor-pointer"
                                            >
                                                افتح الخريطة
                                            </a>
                                        ) : (
                                            "لا يوجد"
                                        )}
                                    </td>
                                    <td className="p-2 border border-gray-400 whitespace-pre-wrap">
                                        {schedule.notes || "—"}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </main>

            <footer className="mt-8 text-center text-sm text-gray-500 absolute bottom-4 right-0 left-0">
                <p>تم إنشاء هذا التقرير تلقائيًا من نظام "نظيف حيك".</p>
                <p>صفحة {1} من {1}</p>
            </footer>
        </div>
    )
}
