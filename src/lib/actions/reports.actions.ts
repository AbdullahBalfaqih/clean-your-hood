'use server';

import { query } from '@/lib/db';
import { format, subMonths } from 'date-fns';
import { arSA } from 'date-fns/locale';
import type { User } from './users.actions';
import type { Schedule as FullScheduleType } from './schedules.actions';
import type { Donation } from './donations.actions';
import type { FinancialSupportSubmission } from './financial.actions';
import type { RedemptionRequest } from './redemptions.actions';
import type { Feedback } from './feedback.actions';

// --- Chart Data Types ---
export type CollectionChartData = {
    month: string;
    recycling: number;
    general: number;
    organic: number;
};
export type UserGrowthData = { month: string; users: number };
export type FeedbackChartData = { name: string; value: number };
export type FinancialChartData = { name: string; value: number };

// --- Main Report Data Structure ---
export type Stats = {
    totalUsers: number;
    userChange: string;
    totalSupport: number;
    supportChange: string;
    recycledWaste: number;
    wasteChange: string;
    participationRate: number;
    participationChange: string;
};

// Define a local Schedule type that includes the 'Type' property
type Schedule = FullScheduleType & {
    Type: string;
};

export type FullReportData = {
    stats: Stats;
    users: User[];
    schedules: Schedule[];
    donations: Donation[];
    financialSupport: FinancialSupportSubmission[];
    redemptions: RedemptionRequest[];
    feedback: Feedback[];
};

export type ReportsData = {
    stats: Stats;
    collectionChartData: CollectionChartData[];
    userGrowthChartData: UserGrowthData[];
    financialChartData: FinancialChartData[];
    feedbackChartData: FeedbackChartData[];
    fullReportData?: FullReportData;
};

// --- Helper Functions ---
const getMonthlyStats = async (
    tableName: string,
    dateColumn: string,
    countColumn: string,
    condition?: string
): Promise<{ current: number; previous: number, total: number }> => {
    const whereClause = condition ? `WHERE ${condition}` : '';

    const result = await query(`
        SELECT 
            COUNT(CASE WHEN "${dateColumn}" >= NOW() - interval '1 month' THEN "${countColumn}" ELSE NULL END) AS "currentMonth",
            COUNT(CASE WHEN "${dateColumn}" < NOW() - interval '1 month' AND "${dateColumn}" >= NOW() - interval '2 months' THEN "${countColumn}" ELSE NULL END) AS "previousMonth",
            COUNT(DISTINCT "${countColumn}") as total
        FROM "${tableName}"
        ${whereClause}
    `, []);

    return {
        current: Number(result.rows[0].currentMonth) || 0,
        previous: Number(result.rows[0].previousMonth) || 0,
        total: Number(result.rows[0].total) || 0
    };
};

const getMonthlySumStats = async (
    tableName: string,
    sumColumn: string,
    dateColumn: string,
    condition?: string
): Promise<{ current: number; previous: number, total: number }> => {
    const whereClause = condition ? `WHERE ${condition}` : '';

    const result = await query(`
        SELECT
            SUM(CASE WHEN "${dateColumn}" >= NOW() - interval '1 month' THEN "${sumColumn}" ELSE 0 END) as "currentMonth",
            SUM(CASE WHEN "${dateColumn}" < NOW() - interval '1 month' AND "${dateColumn}" >= NOW() - interval '2 months' THEN "${sumColumn}" ELSE 0 END) as "previousMonth",
            SUM("${sumColumn}") as total
        FROM "${tableName}"
        ${whereClause}
    `, []);
    return {
        current: Number(result.rows[0].currentMonth) || 0,
        previous: Number(result.rows[0].previousMonth) || 0,
        total: Number(result.rows[0].total) || 0
    };
}

const getRecycledWasteStats = async (): Promise<{ current: number; previous: number; total: number }> => {
    const result = await query(`
        WITH "CategorizedItems" AS (
            SELECT
                p."PickupDate",
                pi."Quantity",
                CASE
                    WHEN pi."ItemName" LIKE '%بلاستيك%' OR pi."ItemName" LIKE '%ورق%' OR pi."ItemName" LIKE '%زجاج%' OR pi."ItemName" LIKE '%معدن%' OR pi."ItemName" LIKE '%إلكترونية%' THEN 'Recycling'
                    ELSE 'Other'
                END AS "Category"
            FROM "Pickups" p
            JOIN "PickupItems" pi ON p."PickupID" = pi."PickupID"
            WHERE p."Status" = 'مكتمل'
        )
        SELECT
            SUM(CASE WHEN "PickupDate" >= NOW() - interval '1 month' THEN "Quantity" ELSE 0 END) as "currentMonth",
            SUM(CASE WHEN "PickupDate" < NOW() - interval '1 month' AND "PickupDate" >= NOW() - interval '2 months' THEN "Quantity" ELSE 0 END) as "previousMonth",
            SUM("Quantity") as total
        FROM "CategorizedItems"
        WHERE "Category" = 'Recycling'
    `, []);
    return {
        current: Number(result.rows[0].currentMonth) || 0,
        previous: Number(result.rows[0].previousMonth) || 0,
        total: Number(result.rows[0].total) || 0
    };
};


const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
};

// --- Main Data Fetching Action ---
export async function getReportsData(includeFullReport = false): Promise<ReportsData> {
    try {
        // Stats
        const [userStats, supportStats, recycledStats, pickupStats] = await Promise.all([
            getMonthlyStats('Users', 'CreatedAt', 'UserID'),
            getMonthlySumStats('FinancialSupport', 'Amount', 'SubmittedAt', `"Status" = 'مقبول'`),
            getRecycledWasteStats(),
            // استدعاء مصحح
            getMonthlyStats('Pickups', 'PickupDate', 'UserID', `"Status" = 'مكتمل'`),
        ]);

        const totalUsersResult = await query('SELECT COUNT(*) as total FROM "Users"', []);
        const totalUsers = Number(totalUsersResult.rows[0].total);


        const participationRate = totalUsers > 0 ? (pickupStats.total / totalUsers) * 100 : 0;

        const stats: Stats = {
            totalUsers: totalUsers,
            userChange: calculateChange(userStats.current, userStats.previous),
            totalSupport: supportStats.total,
            supportChange: calculateChange(supportStats.current, supportStats.previous),
            recycledWaste: recycledStats.total,
            wasteChange: calculateChange(recycledStats.current, recycledStats.previous),
            participationRate: participationRate,
            participationChange: '+2%', // Mocked for now
        };

        // Chart Data
        const [collectionChartData, userGrowthChartData, feedbackChartData, financialChartData] = await Promise.all([
            getCollectionChartData(),
            getUserGrowthChartData(),
            getFeedbackChartData(),
            getFinancialSummaryChartData(),
        ]);

        let fullReportData: FullReportData | undefined = undefined;
        if (includeFullReport) {
            const { getUsers } = await import('./users.actions');
            const { getSchedules } = await import('./schedules.actions');
            const { getDonations } = await import('./donations.actions');
            const { getFinancialSupportSubmissions } = await import('./financial.actions');
            const { getRedemptionRequests } = await import('./redemptions.actions');
            const { getFeedback } = await import('./feedback.actions');

            const [users, schedules, donations, financialSupport, redemptions, feedback] = await Promise.all([
                getUsers(),
                getSchedules(),
                getDonations(),
                getFinancialSupportSubmissions(),
                getRedemptionRequests(),
                getFeedback()
            ]);
            fullReportData = { stats, users, schedules: schedules as Schedule[], donations, financialSupport, redemptions, feedback };
        }

        return {
            stats,
            collectionChartData,
            userGrowthChartData,
            financialChartData,
            feedbackChartData,
            fullReportData,
        };
    } catch (error) {
        console.error('Error fetching reports data:', error);
        throw new Error('Failed to fetch reports data from the database.');
    }
}

// --- Individual Chart Data Functions ---

async function getCollectionChartData(): Promise<CollectionChartData[]> {
    const result = await query(`
    WITH "CategorizedItems" AS (
        SELECT
            p."PickupDate",
            pi."Quantity",
            CASE
                WHEN pi."ItemName" LIKE '%بلاستيك%' OR pi."ItemName" LIKE '%ورق%' OR pi."ItemName" LIKE '%زجاج%' OR pi."ItemName" LIKE '%معدن%' OR pi."ItemName" LIKE '%إلكترونية%' THEN 'Recycling'
                WHEN pi."ItemName" LIKE '%عضوي%' OR pi."ItemName" LIKE '%حدائق%' OR pi."ItemName" LIKE '%طعام%' THEN 'Organic'
                ELSE 'General'
            END AS "Category"
        FROM "Pickups" p
        JOIN "PickupItems" pi ON p."PickupID" = pi."PickupID"
        WHERE p."Status" = 'مكتمل' AND p."PickupDate" >= NOW() - interval '6 months'
    )
    SELECT
        to_char("PickupDate", 'YYYY-MM') as "MonthKey",
        "Category",
        SUM("Quantity") as "TotalQuantity"
    FROM "CategorizedItems"
    GROUP BY "MonthKey", "Category"
    ORDER BY "MonthKey"
  `, []);

    const reportMap: { [key: string]: { month: string; recycling: number; organic: number; general: number } } = {};

    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMMM', { locale: arSA });
        reportMap[monthKey] = { month: monthName, recycling: 0, organic: 0, general: 0 };
    }

    result.rows.forEach(row => {
        const monthKey = row.MonthKey;
        if (reportMap[monthKey]) {
            switch (row.Category) {
                case 'Recycling':
                    reportMap[monthKey].recycling += Number(row.TotalQuantity);
                    break;
                case 'Organic':
                    reportMap[monthKey].organic += Number(row.TotalQuantity);
                    break;
                case 'General':
                    reportMap[monthKey].general += Number(row.TotalQuantity);
                    break;
            }
        }
    });

    return Object.values(reportMap);
}

async function getUserGrowthChartData(): Promise<UserGrowthData[]> {
    const result = await query(`
        SELECT 
            to_char("CreatedAt", 'YYYY-MM') as "MonthKey",
            COUNT("UserID") as "NewUsers"
        FROM "Users"
        WHERE "CreatedAt" >= NOW() - interval '6 months'
        GROUP BY "MonthKey"
        ORDER BY "MonthKey"
    `, []);

    const reportMap: { [key: string]: UserGrowthData } = {};
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMMM', { locale: arSA });
        reportMap[monthKey] = { month: monthName, users: 0 };
    }

    result.rows.forEach(row => {
        const monthKey = row.MonthKey;
        if (reportMap[monthKey]) {
            reportMap[monthKey].users = Number(row.NewUsers);
        }
    });

    return Object.values(reportMap);
}

async function getFeedbackChartData(): Promise<FeedbackChartData[]> {
    const result = await query(`
        SELECT "FeedbackType" as name, COUNT(*) as value
        FROM "Feedback"
        GROUP BY "FeedbackType"
    `, []);
    return result.rows.map(r => ({ ...r, value: Number(r.value) })) as FeedbackChartData[];
}

async function getFinancialSummaryChartData(): Promise<FinancialChartData[]> {
    const [supportResult, redemptionResult] = await Promise.all([
        query("SELECT SUM(\"Amount\") as \"Total\" FROM \"FinancialSupport\" WHERE \"Status\" = 'مقبول'", []),
        query("SELECT SUM(\"Amount\") as \"Total\" FROM \"Redemptions\" WHERE \"Status\" = 'مكتمل'", []),
    ]);

    return [
        { name: 'Financial Support', value: Number(supportResult.rows[0].Total) || 0 },
        { name: 'Redemptions', value: Number(redemptionResult.rows[0].Total) || 0 },
    ];
}
