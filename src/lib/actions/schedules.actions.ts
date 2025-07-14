

'use server';

import { revalidatePath } from 'next/cache';
import { getDbPool, query } from '@/lib/db';
import { z } from 'zod';
import { grantPointsForPickup } from './points.actions';
import type { PoolClient } from 'pg';


export type ScheduleItem = {
    name: string;
    quantity: number;
};

export type Schedule = {
    PickupID: number;
    UserID: number;
    UserFullName: string;
    DriverID: number | null;
    DriverFullName: string | null;
    DriverPhone: string | null;
    RequestDate: Date;
    PickupDate: Date;
    Status: string;
    Notes: string | null;
    Address: string; // From Users table
    Latitude: number | null;
    Longitude: number | null;
    HouseNumber: number; // UserID for now
    items: ScheduleItem[];
};


export type Driver = {
    DriverID: number;
    FullName: string;
    Phone: string;
};

export type PickupHistory = {
    date: string;
    type: string;
    status: string;
    points: number;
};

export type GeneralSchedule = {
    GeneralScheduleID: number;
    DayOfWeek: string;
    PickupTime: string;
    IsEnabled: boolean;
};

const driverFormSchema = z.object({
    name: z.string().min(3, { message: "الاسم مطلوب ويجب أن يكون 3 أحرف على الأقل." }),
    phone: z.string().regex(/^(70|71|73|77|78)\d{7}$/, { message: "يجب أن يكون رقم هاتف يمني صحيح." }),
});

const addScheduleSchema = z.object({
    userId: z.coerce.number().min(1, "يجب اختيار مستخدم."),
    type: z.string({ required_error: "نوع النفايات مطلوب." }),
    date: z.date({ required_error: "تاريخ الرفع مطلوب." }),
    driverId: z.coerce.number().optional(),
    status: z.enum(["مجدول", "مكتمل", "ملغي"]),
});

const updateScheduleStatusSchema = z.object({
    pickupId: z.number(),
    status: z.enum(["مجدول", "مكتمل", "ملغي"]),
});

const createPickupRequestSchema = z.object({
    userId: z.number(),
    pickupDate: z.date(),
    pickupType: z.string(),
    notes: z.string().optional(),
    items: z.record(z.string(), z.object({
        name: z.string(),
        quantity: z.number().min(1),
    })),
});

const generalScheduleSchema = z.object({
    dayOfWeek: z.string({ required_error: "يجب اختيار اليوم." }),
    pickupTime: z.string().min(3, { message: "يجب إدخال الوقت." })
});


export async function getSchedules(): Promise<Schedule[]> {
    try {
        const result = await query(`
          SELECT 
            p."PickupID", p."UserID", u."FullName" as "UserFullName", p."DriverID", d."FullName" as "DriverFullName", d."Phone" as "DriverPhone",
            p."RequestDate", p."PickupDate", p."Status", p."Notes", u."Address",
            u."Latitude", u."Longitude",
            u."UserID" as "HouseNumber"
          FROM "Pickups" p
          JOIN "Users" u ON p."UserID" = u."UserID"
          LEFT JOIN "Drivers" d ON p."DriverID" = d."DriverID"
          ORDER BY p."PickupDate" DESC
        `, []);

        const itemsResult = await query(`SELECT "PickupID", "ItemName", "Quantity" FROM "PickupItems"`, []);
        const itemsMap = new Map<number, ScheduleItem[]>();
        itemsResult.rows.forEach(item => {
            if (!itemsMap.has(item.PickupID)) {
                itemsMap.set(item.PickupID, []);
            }
            itemsMap.get(item.PickupID)!.push({ name: item.ItemName, quantity: item.Quantity });
        });

        return result.rows.map(r => ({
            ...r,
            items: itemsMap.get(r.PickupID) || []
        })) as Schedule[];

    } catch (error) {
        console.error(`Database error in getSchedules: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function getDrivers(): Promise<Driver[]> {
    try {
        const result = await query('SELECT "DriverID", "FullName", "Phone" FROM "Drivers" ORDER BY "FullName"', []);
        return result.rows as Driver[];
    } catch (error) {
        console.error(`Database error in getDrivers: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addSchedule(data: z.infer<typeof addScheduleSchema>) {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const validatedData = addScheduleSchema.parse(data);

        const pickupRes = await client.query(
            'INSERT INTO "Pickups" ("UserID", "PickupDate", "Status", "DriverID", "Notes") VALUES ($1, $2, $3, $4, $5) RETURNING "PickupID"',
            [
                validatedData.userId,
                validatedData.date,
                validatedData.status,
                validatedData.driverId || null,
                `رفع يدوي: ${validatedData.type}`
            ]
        );
        const pickupId = pickupRes.rows[0].PickupID;

        await client.query(
            'INSERT INTO "PickupItems" ("PickupID", "ItemName", "Quantity") VALUES ($1, $2, $3)',
            [pickupId, validatedData.type, 1]
        );

        await client.query('COMMIT');
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding schedule:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'بيانات غير صالحة.' };
        }
        return { success: false, message: 'لا يمكن إكمال الإجراء، ربما بسبب مشكلة في الاتصال بقاعدة البيانات.' };
    } finally {
        client.release();
    }
}

export async function assignDriverToSchedules(scheduleIds: number[], driverId: number) {
    if (scheduleIds.length === 0) {
        return { success: false, message: "No schedule IDs provided." };
    }
    try {
        const idListPlaceholders = scheduleIds.map((_, i) => `$${i + 2}`).join(',');
        await query(
            `UPDATE "Pickups" SET "DriverID" = $1 WHERE "PickupID" IN (${idListPlaceholders})`,
            [driverId, ...scheduleIds]
        );

        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error) {
        console.error('Error assigning driver:', error);
        return { success: false, message: 'لا يمكن إكمال الإجراء، ربما بسبب مشكلة في الاتصال بقاعدة البيانات.' };
    }
}

export async function deleteSchedule(scheduleId: number) {
    try {
        await query('DELETE FROM "Pickups" WHERE "PickupID" = $1', [scheduleId]);
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error) {
        console.error(`Error deleting schedule ${scheduleId}:`, error);
        return { success: false, message: 'لا يمكن إكمال الإجراء، ربما بسبب مشكلة في الاتصال بقاعدة البيانات.' };
    }
}

export async function getPickupsHistoryForUser(userId: number): Promise<PickupHistory[]> {
    try {
        const result = await query(`
            SELECT 
                p."PickupDate" as date,
                COALESCE(
                    (SELECT STRING_AGG(pi."ItemName", ', ') FROM "PickupItems" pi WHERE pi."PickupID" = p."PickupID"), 
                    p."Notes"
                ) as type,
                p."Status" as status,
                COALESCE((SELECT "Points" FROM "PointsLog" pl WHERE pl."SourceID" = p."PickupID" AND pl."LogType" = 'grant'), 0) as points
            FROM "Pickups" p
            WHERE p."UserID" = $1
            ORDER BY p."PickupDate" DESC
        `, [userId]);
        return result.rows.map(r => ({ ...r, type: r.type || 'غير محدد' })) as PickupHistory[];
    } catch (error) {
        console.error(`Database error in getPickupsHistoryForUser: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function createPickupRequest(data: z.infer<typeof createPickupRequestSchema>) {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        const validatedData = createPickupRequestSchema.parse(data);
        if (Object.keys(validatedData.items).length === 0) {
            return { success: false, message: "لا يمكن إرسال كيس فارغ." };
        }

        await client.query('BEGIN');

        const pickupResult = await client.query(
            'INSERT INTO "Pickups" ("UserID", "PickupDate", "Notes", "Status") VALUES ($1, $2, $3, $4) RETURNING "PickupID"',
            [validatedData.userId, validatedData.pickupDate, validatedData.pickupType, 'مجدول']
        );

        const pickupId = pickupResult.rows[0].PickupID;

        for (const item of Object.values(validatedData.items)) {
            await client.query(
                'INSERT INTO "PickupItems" ("PickupID", "ItemName", "Quantity") VALUES ($1, $2, $3)',
                [pickupId, item.name, item.quantity]
            );
        }

        await client.query('COMMIT');
        revalidatePath('/schedule');
        revalidatePath('/admin/schedules');
        revalidatePath('/history');
        return { success: true, message: 'تم إنشاء طلب الرفع بنجاح.' };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating pickup request:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'بيانات غير صالحة.' };
        }
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    } finally {
        client.release();
    }
}

export async function addDriver(data: z.infer<typeof driverFormSchema>) {
    try {
        const validatedData = driverFormSchema.parse(data);
        await query(
            'INSERT INTO "Drivers" ("FullName", "Phone") VALUES ($1, $2)',
            [validatedData.name, validatedData.phone]
        );
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error: any) {
        console.error('Error adding driver:', error);
        if (error.code === '23505') { // UNIQUE VIOLATION
            return { success: false, message: 'رقم الهاتف هذا مسجل لسائق آخر.' };
        }
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateDriver(driverId: number, data: z.infer<typeof driverFormSchema>) {
    try {
        const validatedData = driverFormSchema.parse(data);
        await query(
            'UPDATE "Drivers" SET "FullName" = $1, "Phone" = $2 WHERE "DriverID" = $3',
            [validatedData.name, validatedData.phone, driverId]
        );
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating driver:', error);
        if (error.code === '23505') { // UNIQUE VIOLATION
            return { success: false, message: 'رقم الهاتف هذا مسجل لسائق آخر.' };
        }
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deleteDriver(driverId: number) {
    try {
        await query('DELETE FROM "Drivers" WHERE "DriverID" = $1', [driverId]);
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting driver:', error);
        if (error.code === '23503') { // FOREIGN KEY VIOLATION
            return { success: false, message: 'لا يمكن حذف السائق لأنه معين لجدول رفع حالي.' };
        }
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function getGeneralSchedules(): Promise<GeneralSchedule[]> {
    try {
        const result = await query(`
            SELECT "GeneralScheduleID", "DayOfWeek", "PickupTime", "IsEnabled" 
            FROM "GeneralSchedules" 
            ORDER BY 
                CASE "DayOfWeek" 
                    WHEN 'السبت' THEN 1 
                    WHEN 'الأحد' THEN 2 
                    WHEN 'الاثنين' THEN 3 
                    WHEN 'الثلاثاء' THEN 4 
                    WHEN 'الأربعاء' THEN 5 
                    WHEN 'الخميس' THEN 6 
                    WHEN 'الجمعة' THEN 7 
                END
        `, []);
        return result.rows as GeneralSchedule[];
    } catch (error) {
        if (error instanceof Error && (error.message.includes("does not exist") || (error as any).code === '42P01')) {
            console.warn("Database table 'GeneralSchedules' not found or DB not connected. Returning empty array.");
            return [];
        }
        console.error(`Database error in getGeneralSchedules: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addGeneralSchedule(data: z.infer<typeof generalScheduleSchema>) {
    try {
        const validatedData = generalScheduleSchema.parse(data);
        await query(
            'INSERT INTO "GeneralSchedules" ("DayOfWeek", "PickupTime") VALUES ($1, $2)',
            [validatedData.dayOfWeek, validatedData.pickupTime]
        );
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error) {
        console.error('Error adding general schedule:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateGeneralSchedule(scheduleId: number, data: z.infer<typeof generalScheduleSchema>) {
    try {
        const validatedData = generalScheduleSchema.parse(data);
        await query(
            'UPDATE "GeneralSchedules" SET "DayOfWeek" = $1, "PickupTime" = $2 WHERE "GeneralScheduleID" = $3',
            [validatedData.dayOfWeek, validatedData.pickupTime, scheduleId]
        );
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error) {
        console.error('Error updating general schedule:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deleteGeneralSchedule(scheduleId: number) {
    try {
        await query('DELETE FROM "GeneralSchedules" WHERE "GeneralScheduleID" = $1', [scheduleId]);
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error) {
        console.error('Error deleting general schedule:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updatePickupStatus(pickupId: number, newStatus: 'مكتمل' | 'ملغي') {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            'UPDATE "Pickups" SET "Status" = $1 WHERE "PickupID" = $2',
            [newStatus, pickupId]
        );

        if (newStatus === 'مكتمل') {
            await grantPointsForPickup(pickupId, client);
        }

        await client.query('COMMIT');
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error updating pickup status for ID ${pickupId}:`, err);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    } finally {
        client.release();
    }
}

export async function updateScheduleStatus(data: z.infer<typeof updateScheduleStatusSchema>) {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        const validatedData = updateScheduleStatusSchema.parse(data);
        await client.query('BEGIN');

        await client.query(
            'UPDATE "Pickups" SET "Status" = $1 WHERE "PickupID" = $2',
            [validatedData.status, validatedData.pickupId]
        );

        if (validatedData.status === 'مكتمل') {
            await grantPointsForPickup(validatedData.pickupId, client);
        }

        await client.query('COMMIT');
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating schedule status:', err);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    } finally {
        client.release();
    }
}
