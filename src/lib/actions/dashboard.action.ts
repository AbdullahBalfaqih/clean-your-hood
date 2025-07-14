

'use server';

import { query } from '@/lib/db';
import type { Notification } from './notifications.actions';
import type { GeneralSchedule } from './schedules.actions';
import { format, subMonths, getDay, addDays } from 'date-fns';
import { arSA } from 'date-fns/locale';

// --- Types ---
export type NextPickup = {
    date: Date;
    type: string;
};

export type NextGeneralPickup = {
    day: string;
    time: string;
};

export type MonthlyReportItem = {
    month: string;
    recycling: number;
    organic: number;
    general: number;
};

export type EnvironmentalImpact = {
    treesSaved: number;
    co2Reduced: number;
    kmDrivenEquivalent: number;
};

export type DashboardData = {
    points: number;
    nextPickup: NextPickup | null;
    nextGeneralPickup: NextGeneralPickup | null;
    notifications: Notification[];
    monthlyReport: MonthlyReportItem[];
    environmentalImpact: EnvironmentalImpact;
};

// --- Main Action ---

export async function getDashboardData(userId: number): Promise<DashboardData | null> {
    try {
        const [
            userResult,
            pickupResult,
            notificationsResult,
            reportResult,
            generalSchedulesResult
        ] = await Promise.all([
            // 1. Get user points
            query('SELECT "PointsBalance" FROM "Users" WHERE "UserID" = $1', [userId]),

            // 2. Get next scheduled pickup
            query(`
                SELECT "PickupDate", COALESCE((SELECT STRING_AGG(pi."ItemName", ', ') FROM "PickupItems" pi WHERE pi."PickupID" = p."PickupID"), 'رفع متنوع') as "Type"
                FROM "Pickups" p
                WHERE "UserID" = $1 AND "Status" = 'مجدول' AND "PickupDate" >= NOW()
                ORDER BY "PickupDate" ASC
                LIMIT 1
            `, [userId]),

            // 3. Get latest notifications for the user
            query(`
                SELECT "NotificationID", "Title", "Content", "TargetAudience", "SentAt" 
                FROM "Notifications"
                WHERE 
                    "TargetAudience" = 'الكل' 
                    OR "TargetAudience" = 'المستخدمون'
                    OR ("TargetAudience" = 'مستخدم محدد' AND "TargetUserID" = $1)
                ORDER BY "SentAt" DESC
                LIMIT 5
            `, [userId]),

            // 4. Get monthly report data for the last 6 months
            query(`
                SELECT 
                    to_char("PickupDate", 'YYYY-MM') as "MonthKey",
                    pi."ItemName",
                    SUM(pi."Quantity") as "TotalQuantity"
                FROM "Pickups" p
                JOIN "PickupItems" pi ON p."PickupID" = pi."PickupID"
                WHERE p."UserID" = $1 AND p."Status" = 'مكتمل' AND p."PickupDate" >= NOW() - INTERVAL '6 months'
                GROUP BY "MonthKey", pi."ItemName"
                ORDER BY "MonthKey"
            `, [userId]),

            // 5. Get general schedules
            query('SELECT "DayOfWeek", "PickupTime" FROM "GeneralSchedules" WHERE "IsEnabled" = TRUE', [])
        ]);

        const points = userResult.rows[0]?.PointsBalance ?? 0;

        const nextPickup = pickupResult.rows.length > 0 ? {
            date: new Date(pickupResult.rows[0].PickupDate),
            type: pickupResult.rows[0].Type
        } : null;

        const notifications = notificationsResult.rows as Notification[];
        const generalSchedules = generalSchedulesResult.rows as GeneralSchedule[];
        const nextGeneralPickup = findNextGeneralPickup(generalSchedules);

        // --- Process Report Data ---
        const reportDataMap: { [month: string]: MonthlyReportItem } = {};
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthKey = format(date, 'yyyy-MM');
            const monthName = format(date, 'MMMM', { locale: arSA });
            reportDataMap[monthKey] = { month: monthName, recycling: 0, organic: 0, general: 0 };
        }

        reportResult.rows.forEach(row => {
            const monthKey = row.MonthKey;
            if (reportDataMap[monthKey]) {
                // Simple mapping for demonstration. In a real scenario, you'd use a category mapping.
                if (['بلاستيك', 'ورق', 'زجاج', 'معدن'].some(t => row.ItemName.includes(t))) {
                    reportDataMap[monthKey].recycling += Number(row.TotalQuantity);
                } else if (row.ItemName.includes('عضوي')) {
                    reportDataMap[monthKey].organic += Number(row.TotalQuantity);
                } else {
                    reportDataMap[monthKey].general += Number(row.TotalQuantity);
                }
            }
        });
        const monthlyReport = Object.values(reportDataMap);

        // --- Calculate Environmental Impact ---
        const environmentalImpact = calculateEnvironmentalImpact(points);

        return {
            points,
            nextPickup,
            nextGeneralPickup,
            notifications,
            monthlyReport,
            environmentalImpact
        };

    } catch (error) {
        console.error(`Database error in getDashboardData for user ${userId}:`, error);
        return null;
    }
}

// Helper function for impact calculation
function calculateEnvironmentalImpact(points: number): EnvironmentalImpact {
    // These are example conversion factors. Adjust them based on real-world data.
    const pointsToKgRecycled = 0.05; // Each point represents a smaller fraction of a kg
    const kgRecycledToTrees = 0.0017; // Reduced factor: saving trees is a bigger effort
    const kgRecycledToCo2 = 0.15; // Reduced factor
    const co2ToKmDriven = 4; // km driven per kg of CO2 (more realistic for average car)

    const totalKgRecycled = points * pointsToKgRecycled;

    return {
        treesSaved: totalKgRecycled * kgRecycledToTrees,
        co2Reduced: totalKgRecycled * kgRecycledToCo2,
        kmDrivenEquivalent: (totalKgRecycled * kgRecycledToCo2) * co2ToKmDriven,
    };
}


function findNextGeneralPickup(schedules: GeneralSchedule[]): NextGeneralPickup | null {
    if (!schedules || schedules.length === 0) return null;

    const dayNameToIndex: { [key: string]: number } = {
        'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3,
        'الخميس': 4, 'الجمعة': 5, 'السبت': 6
    };

    const todayIndex = getDay(new Date());
    let closestDay: NextGeneralPickup | null = null;
    let minDiff = 8;

    schedules.forEach(schedule => {
        const scheduleDayIndex = dayNameToIndex[schedule.DayOfWeek];
        if (scheduleDayIndex === undefined) return;

        let diff = scheduleDayIndex - todayIndex;
        if (diff < 0) {
            diff += 7; // It's next week
        }

        if (diff < minDiff) {
            minDiff = diff;
            const nextDate = addDays(new Date(), diff);
            const dayName = format(nextDate, 'EEEE', { locale: arSA });
            closestDay = { day: dayName, time: schedule.PickupTime };
        }
    });

    return closestDay;
}
