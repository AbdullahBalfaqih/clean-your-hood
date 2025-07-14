'use server';

import { revalidatePath } from 'next/cache';
import { getDbPool, query } from '@/lib/db';
import { z } from 'zod';
import { getPointSettings, grantPoints } from './points.actions';
import type { PoolClient } from 'pg';

// Types
export type Donation = {
    DonationID: number;
    UserID: number;
    FullName: string; // From JOIN
    ClothingType: string;
    Condition: string;
    Quantity: number;
    Status: string;
    RequestDate: Date;
};

// Zod Schemas
const addDonationSchema = z.object({
    clothingType: z.string(),
    condition: z.string(),
    quantity: z.coerce.number().min(1),
    pickupAddress: z.string().min(10),
    notes: z.string().optional(),
    userId: z.number(), // Assuming we know the logged-in user's ID
});

// Actions
export async function getDonations(): Promise<Donation[]> {
    try {
        const result = await query(`
      SELECT d."DonationID", d."UserID", u."FullName", d."ClothingType", d."Condition", d."Quantity", d."Status", d."RequestDate"
      FROM "Donations" d
      JOIN "Users" u ON d."UserID" = u."UserID"
      ORDER BY d."RequestDate" DESC
    `, []);
        return result.rows as Donation[];
    } catch (error) {
        console.error(`Database error in getDonations: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addDonation(data: z.infer<typeof addDonationSchema>) {
    try {
        const validatedData = addDonationSchema.parse(data);
        await query(
            'INSERT INTO "Donations" ("UserID", "ClothingType", "Condition", "Quantity", "PickupAddress", "Notes") VALUES ($1, $2, $3, $4, $5, $6)',
            [
                validatedData.userId,
                validatedData.clothingType,
                validatedData.condition,
                validatedData.quantity,
                validatedData.pickupAddress,
                validatedData.notes || null,
            ]
        );

        revalidatePath('/donate');
        revalidatePath('/admin/donations');
        return { success: true, message: 'Donation request submitted successfully' };
    } catch (error) {
        console.error('Error adding donation:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid data provided.' };
        }
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateDonationStatus(donationId: number, newStatus: string) {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const donationResult = await client.query('SELECT "UserID", "Quantity", "Status" FROM "Donations" WHERE "DonationID" = $1', [donationId]);

        if (donationResult.rows.length === 0) {
            throw new Error('Donation not found.');
        }

        const { UserID, Quantity, Status: currentStatus } = donationResult.rows[0];

        // Proceed only if status is actually changing to 'مقبول'
        if (newStatus === 'مقبول' && currentStatus !== 'مقبول') {
            const settings = await getPointSettings();
            if (settings.autoGrantEnabled && settings.donationPerPiece > 0) {
                const pointsToGrant = Quantity * settings.donationPerPiece;
                if (pointsToGrant > 0) {
                    // Pass the transaction client to grantPoints
                    await grantPoints(UserID, pointsToGrant, `نقاط مقابل تبرع #${donationId}`, client);
                }
            }
        }

        // Update the donation status
        await client.query('UPDATE "Donations" SET "Status" = $1 WHERE "DonationID" = $2', [newStatus, donationId]);

        await client.query('COMMIT');

        revalidatePath('/admin/donations');
        revalidatePath('/admin/points');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating donation status:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    } finally {
        client.release();
    }
}


export async function deleteDonation(donationId: number) {
    try {
        await query('DELETE FROM "Donations" WHERE "DonationID" = $1', [donationId]);
        revalidatePath('/admin/donations');
        return { success: true };
    } catch (error) {
        console.error('Error deleting donation:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}
