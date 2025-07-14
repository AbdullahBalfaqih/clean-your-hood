
'use server';

import { revalidatePath } from 'next/cache';
import { query, getDbPool } from '@/lib/db';
import { z } from 'zod';

export type Voucher = {
    VoucherID: number;
    PartnerName: string;
    PartnerLogoURL: string | null;
    Title: string;
    Description: string;
    PointsRequired: number;
    Quantity: number;
    Status: 'نشط' | 'غير نشط';
};

export type VoucherRedemption = {
    RedemptionID: number;
    UserID: number;
    UserFullName: string;
    UserPhone: string;
    VoucherID: number;
    VoucherTitle: string;
    PartnerName: string;
    RequestDate: Date;
    Status: 'قيد المراجعة' | 'مكتمل';
    CouponCode: string | null;
};

const voucherFormSchema = z.object({
    partner: z.string().min(2),
    title: z.string().min(5),
    description: z.string().min(10),
    points: z.coerce.number().min(1),
    quantity: z.coerce.number().min(0),
    status: z.enum(["نشط", "غير نشط"]),
    partnerLogo: z.string().optional(),
});


export async function getVouchers(): Promise<Voucher[]> {
    try {
        const result = await query('SELECT "VoucherID", "PartnerName", "PartnerLogoURL", "Title", "Description", "PointsRequired", "Quantity", "Status" FROM "Vouchers" ORDER BY "PartnerName"', []);
        return result.rows as Voucher[];
    } catch (error) {
        console.error(`Database error in getVouchers: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addVoucher(data: z.infer<typeof voucherFormSchema>) {
    try {
        const validatedData = voucherFormSchema.parse(data);
        await query(`
        INSERT INTO "Vouchers" ("PartnerName", "Title", "Description", "PointsRequired", "Quantity", "Status", "PartnerLogoURL") 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
            validatedData.partner,
            validatedData.title,
            validatedData.description,
            validatedData.points,
            validatedData.quantity,
            validatedData.status,
            validatedData.partnerLogo || 'https://placehold.co/40x40.png'
        ]);

        revalidatePath('/admin/vouchers');
        return { success: true };
    } catch (error) {
        console.error('Error adding voucher:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateVoucher(voucherId: number, data: z.infer<typeof voucherFormSchema>) {
    try {
        const validatedData = voucherFormSchema.parse(data);
        await query(`
        UPDATE "Vouchers" SET 
            "PartnerName" = $1, 
            "Title" = $2, 
            "Description" = $3, 
            "PointsRequired" = $4, 
            "Quantity" = $5, 
            "Status" = $6,
            "PartnerLogoURL" = $7
        WHERE "VoucherID" = $8
    `, [
            validatedData.partner,
            validatedData.title,
            validatedData.description,
            validatedData.points,
            validatedData.quantity,
            validatedData.status,
            validatedData.partnerLogo || 'https://placehold.co/40x40.png',
            voucherId
        ]);

        revalidatePath('/admin/vouchers');
        return { success: true };
    } catch (error) {
        console.error('Error updating voucher:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deleteVoucher(voucherId: number) {
    try {
        await query('DELETE FROM "Vouchers" WHERE "VoucherID" = $1', [voucherId]);
        revalidatePath('/admin/vouchers');
        return { success: true };
    } catch (error) {
        console.error('Error deleting voucher:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function redeemVoucher(userId: number, voucherId: number) {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const voucherResult = await client.query('SELECT "PointsRequired", "Quantity" FROM "Vouchers" WHERE "VoucherID" = $1 FOR UPDATE', [voucherId]);
        if (voucherResult.rows.length === 0) {
            throw new Error('القسيمة غير موجودة.');
        }
        const { PointsRequired, Quantity } = voucherResult.rows[0];

        if (Quantity <= 0) {
            throw new Error('هذه القسيمة نفدت من المخزون.');
        }

        const userResult = await client.query('SELECT "PointsBalance" FROM "Users" WHERE "UserID" = $1 FOR UPDATE', [userId]);
        if (userResult.rows.length === 0) {
            throw new Error('المستخدم غير موجود.');
        }
        const { PointsBalance } = userResult.rows[0];

        if (PointsBalance < PointsRequired) {
            throw new Error('ليس لديك نقاط كافية لاستبدال هذه القسيمة.');
        }

        await client.query('UPDATE "Users" SET "PointsBalance" = "PointsBalance" - $1 WHERE "UserID" = $2', [PointsRequired, userId]);
        await client.query('UPDATE "Vouchers" SET "Quantity" = "Quantity" - 1 WHERE "VoucherID" = $1', [voucherId]);

        await client.query(
            'INSERT INTO "PointsLog" ("UserID", "Points", "LogType", "Reason") VALUES ($1, $2, $3, $4)',
            [userId, -PointsRequired, 'redeem_voucher', `Redeemed voucher ID: ${voucherId}`]
        );

        await client.query(
            'INSERT INTO "VoucherRedemptions" ("UserID", "VoucherID", "Status") VALUES ($1, $2, $3)',
            [userId, voucherId, 'قيد المراجعة']
        );

        await client.query('COMMIT');

        revalidatePath('/rewards');
        revalidatePath('/admin/vouchers');
        revalidatePath('/admin/points');
        return { success: true };

    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('Error redeeming voucher:', err);
        return { success: false, message: err.message || 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    } finally {
        client.release();
    }
}

export async function getVoucherRedemptions(): Promise<VoucherRedemption[]> {
    try {
        const result = await query(`
            SELECT 
                vr."RedemptionID",
                vr."UserID",
                u."FullName" AS "UserFullName",
                u."PhoneNumber" AS "UserPhone",
                vr."VoucherID",
                v."Title" AS "VoucherTitle",
                v."PartnerName",
                vr."RequestDate",
                vr."Status",
                vr."CouponCode"
            FROM "VoucherRedemptions" vr
            JOIN "Users" u ON vr."UserID" = u."UserID"
            JOIN "Vouchers" v ON vr."VoucherID" = v."VoucherID"
            ORDER BY vr."RequestDate" DESC
        `, []);

        return (result.rows as VoucherRedemption[]).map(item => ({
            ...item,
            UserPhone: item.UserPhone.startsWith('+967')
                ? item.UserPhone
                : `+967${item.UserPhone.replace(/^0+/, '')}`
        }));
    } catch (error: any) {
        console.error(`Database error in getVoucherRedemptions: ${error.message}`);
        throw error;
    }
}

export async function processVoucherRedemption(redemptionId: number, couponCode: string) {
    try {
        await query(`
            UPDATE "VoucherRedemptions" 
            SET "Status" = 'مكتمل', "CouponCode" = $1
            WHERE "RedemptionID" = $2
        `, [couponCode, redemptionId]);

        revalidatePath('/admin/vouchers');
        return { success: true };
    } catch (error) {
        console.error('Error processing voucher redemption:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deleteVoucherRedemption(redemptionId: number) {
    try {
        await query('DELETE FROM "VoucherRedemptions" WHERE "RedemptionID" = $1', [redemptionId]);
        revalidatePath('/admin/vouchers');
        return { success: true };
    } catch (error) {
        console.error('Error deleting voucher redemption:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}
