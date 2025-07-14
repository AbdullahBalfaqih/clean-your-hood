'use server';

import { revalidatePath } from 'next/cache';
import { getDbPool, query } from '@/lib/db';
import { z } from 'zod';
import { addNotification } from './notifications.actions';

export type RedemptionRequest = {
    RedemptionID: number;
    UserID: number;
    FullName: string; // From JOIN
    PointsRedeemed: number;
    Amount: number;
    BankName: string;
    AccountHolder: string;
    AccountNumber: string;
    Status: string;
    RequestDate: Date;
};

const redeemFormSchema = z.object({
    bankName: z.string(),
    accountNumber: z.string().regex(/^\d{10,20}$/),
    accountHolder: z.string().min(5),
    userId: z.number(),
    points: z.number(),
    amount: z.number(),
});


export async function getRedemptionRequests(): Promise<RedemptionRequest[]> {
    try {
        const result = await query(`
            SELECT r."RedemptionID", r."UserID", u."FullName", r."PointsRedeemed", r."Amount", r."BankName", r."AccountHolder", r."AccountNumber", r."Status", r."RequestDate"
            FROM "Redemptions" r
            JOIN "Users" u ON r."UserID" = u."UserID"
            ORDER BY r."RequestDate" DESC
        `, []);
        return result.rows as RedemptionRequest[];
    } catch (error) {
        console.error(`Database error in getRedemptionRequests: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addRedemptionRequest(data: z.infer<typeof redeemFormSchema>) {
    try {
        const validatedData = redeemFormSchema.parse(data);
        await query(
            'INSERT INTO "Redemptions" ("UserID", "PointsRedeemed", "Amount", "BankName", "AccountHolder", "AccountNumber") VALUES ($1, $2, $3, $4, $5, $6)',
            [
                validatedData.userId,
                validatedData.points,
                validatedData.amount,
                validatedData.bankName,
                validatedData.accountHolder,
                validatedData.accountNumber
            ]
        );

        revalidatePath('/rewards');
        revalidatePath('/admin/redemptions');
        return { success: true };
    } catch (error) {
        console.error('Error adding redemption request:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}


export async function updateRedemptionStatus(requestId: number, newStatus: string) {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query('SELECT "UserID", "PointsRedeemed", "Amount" FROM "Redemptions" WHERE "RedemptionID" = $1', [requestId]);
        if (result.rows.length === 0) {
            throw new Error(`Redemption request with ID ${requestId} not found.`);
        }
        const { UserID, PointsRedeemed, Amount } = result.rows[0];

        // If approved, deduct points from user
        if (newStatus === 'مكتمل') {
            await client.query('UPDATE "Users" SET "PointsBalance" = "PointsBalance" - $1 WHERE "UserID" = $2', [PointsRedeemed, UserID]);

            // Add notification for the user
            await addNotification({
                title: 'تم إرسال المبلغ!',
                content: `لقد قمنا بتحويل مبلغ ${Amount} ريال إلى حسابك مقابل استبدال نقاطك. شكراً لكونك جزءاً من مجتمعنا!`,
                target: 'مستخدم محدد',
                targetUserId: UserID,
            });
        }

        await client.query('UPDATE "Redemptions" SET "Status" = $1 WHERE "RedemptionID" = $2', [newStatus, requestId]);

        await client.query('COMMIT');

        revalidatePath('/admin/redemptions');
        return { success: true };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating redemption status:', err);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    } finally {
        client.release();
    }
}


export async function deleteRedemptionRequest(redemptionId: number) {
    try {
        await query('DELETE FROM "Redemptions" WHERE "RedemptionID" = $1', [redemptionId]);
        revalidatePath('/admin/redemptions');
        return { success: true };
    } catch (error) {
        console.error('Error deleting redemption request:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}
