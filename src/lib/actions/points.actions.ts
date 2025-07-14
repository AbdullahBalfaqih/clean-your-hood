'use server';

import { revalidatePath } from 'next/cache';
import { getDbPool, query } from '@/lib/db';
import { z } from 'zod';
import type { PoolClient } from 'pg';

export type UserBadge = {
    BadgeID: number;
    BadgeName: string;
};

export type UserContribution = {
    UserID: number;
    FullName: string;
    HouseNumber: number;
    LastContributionType: string | null;
    LastContributionQuantity: string | null;
    LastContributionDate: string | null;
    PointsBalance: number;
    Badges: UserBadge[];
};

export type PointSettings = {
    autoGrantEnabled: boolean;
    recyclingPerKg: number;
    organicPerKg: number;
    donationPerPiece: number;
};


export async function getUserContributions(): Promise<UserContribution[]> {
    try {
        const usersResult = await query(`
            SELECT "UserID", "FullName", "UserID" as "HouseNumber", "PointsBalance" 
            FROM "Users" 
            ORDER BY "PointsBalance" DESC
        `, []);

        const userBadgesResult = await query(`
            SELECT ub."UserID", b."BadgeID", b."BadgeName" 
            FROM "UserBadges" ub
            JOIN "Badges" b ON ub."BadgeID" = b."BadgeID"
        `, []);

        const badgesMap = new Map<number, UserBadge[]>();
        for (const row of userBadgesResult.rows) {
            if (!badgesMap.has(row.UserID)) {
                badgesMap.set(row.UserID, []);
            }
            badgesMap.get(row.UserID)!.push({ BadgeID: row.BadgeID, BadgeName: row.BadgeName });
        }

        const users: UserContribution[] = usersResult.rows.map(user => ({
            UserID: user.UserID,
            FullName: user.FullName,
            HouseNumber: user.HouseNumber,
            PointsBalance: user.PointsBalance,
            Badges: badgesMap.get(user.UserID) || [],
            LastContributionType: 'إعادة تدوير',
            LastContributionQuantity: '5 كجم',
            LastContributionDate: '2024-07-20',
        }));

        return users;
    } catch (error) {
        console.error(`Database error in getUserContributions: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function getUserBadges(userId: number): Promise<UserBadge[]> {
    try {
        const result = await query(`
            SELECT b."BadgeID", b."BadgeName"
            FROM "UserBadges" ub
            JOIN "Badges" b ON ub."BadgeID" = b."BadgeID"
            WHERE ub."UserID" = $1
        `, [userId]);
        return result.rows as UserBadge[];
    } catch (error) {
        console.error(`Database error in getUserBadges: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}

export async function grantPoints(userId: number, points: number, reason?: string, client?: PoolClient) {
    const execute = client ? client.query.bind(client) : query;
    try {
        await execute('UPDATE "Users" SET "PointsBalance" = "PointsBalance" + $1 WHERE "UserID" = $2', [points, userId]);
        await execute('INSERT INTO "PointsLog" ("UserID", "Points", "LogType", "Reason") VALUES ($1, $2, $3, $4)', [userId, points, 'grant', reason || 'Manual grant by admin']);

        // Revalidation is only done if not in a transaction
        if (!client) {
            revalidatePath('/admin/points');
        }
        return { success: true };
    } catch (err) {
        console.error(`Error granting points to user ${userId}:`, err);
        if (client) throw err; // Re-throw to be handled by the transaction
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deductPoints(userId: number, points: number, reason?: string) {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE "Users" SET "PointsBalance" = CASE WHEN "PointsBalance" - $1 < 0 THEN 0 ELSE "PointsBalance" - $1 END WHERE "UserID" = $2', [points, userId]);
        await client.query('INSERT INTO "PointsLog" ("UserID", "Points", "LogType", "Reason") VALUES ($1, $2, $3, $4)', [userId, -points, 'deduct', reason || 'Manual deduction by admin']);
        await client.query('COMMIT');

        revalidatePath('/admin/points');
        return { success: true };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error deducting points from user ${userId}:`, err);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    } finally {
        client.release();
    }
}

export async function grantBadge(userId: number, badgeId: string) {
    try {
        const numericBadgeId = parseInt(badgeId, 10);
        if (isNaN(numericBadgeId)) {
            return { success: false, message: "Invalid badge ID." };
        }

        await query('INSERT INTO "UserBadges" ("UserID", "BadgeID") VALUES ($1, $2)', [userId, numericBadgeId]);

        revalidatePath('/admin/points');
        revalidatePath('/rewards');
        return { success: true };
    } catch (error: any) {
        console.error(`Granting badge ${badgeId} to user ${userId}.`, error);
        if (error.code === '23505') { // UNIQUE VIOLATION in PostgreSQL
            return { success: false, message: 'User already has this badge.' };
        }
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function revokeUserBadge(userId: number, badgeId: number) {
    try {
        await query('DELETE FROM "UserBadges" WHERE "UserID" = $1 AND "BadgeID" = $2', [userId, badgeId]);
        revalidatePath('/admin/points');
        return { success: true };
    } catch (error) {
        console.error(`Error revoking badge ${badgeId} from user ${userId}:`, error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function getPointSettings(): Promise<PointSettings> {
    try {
        const result = await query('SELECT * FROM "PointSettings"', []);
        if (result.rows.length > 0) {
            const settings = result.rows[0];
            return {
                autoGrantEnabled: settings.AutoGrantEnabled,
                recyclingPerKg: settings.RecyclingPerKg,
                organicPerKg: settings.OrganicPerKg,
                donationPerPiece: settings.DonationPerPiece
            };
        }
    } catch (e: any) {
        if (e.code === '42P01') { // Table does not exist
            console.warn("Could not fetch PointSettings, falling back to defaults.", e);
        } else {
            console.error("Error fetching PointSettings", e);
        }
    }

    // Default fallback
    return {
        autoGrantEnabled: true,
        recyclingPerKg: 10,
        organicPerKg: 5,
        donationPerPiece: 2,
    };
}

export async function updatePointSettings(settings: PointSettings) {
    try {
        await query(`
        INSERT INTO "PointSettings" ("SettingsID", "AutoGrantEnabled", "RecyclingPerKg", "OrganicPerKg", "DonationPerPiece")
        VALUES (1, $1, $2, $3, $4)
        ON CONFLICT ("SettingsID") 
        DO UPDATE SET
            "AutoGrantEnabled" = EXCLUDED."AutoGrantEnabled",
            "RecyclingPerKg" = EXCLUDED."RecyclingPerKg",
            "OrganicPerKg" = EXCLUDED."OrganicPerKg",
            "DonationPerPiece" = EXCLUDED."DonationPerPiece"
    `, [settings.autoGrantEnabled, settings.recyclingPerKg, settings.organicPerKg, settings.donationPerPiece]);

        revalidatePath('/admin/points');
        return { success: true, message: 'Settings updated successfully!' };
    } catch (error) {
        console.error('Error updating point settings:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function grantPointsForPickup(pickupId: number, client: PoolClient) {
    try {
        const settings = await getPointSettings();
        if (!settings.autoGrantEnabled) {
            console.log("Auto point granting is disabled.");
            return;
        }

        const pickupResult = await client.query(`
            SELECT p."UserID", pi."ItemName", pi."Quantity" 
            FROM "Pickups" p
            JOIN "PickupItems" pi ON p."PickupID" = pi."PickupID"
            WHERE p."PickupID" = $1
        `, [pickupId]);

        if (pickupResult.rows.length === 0) {
            console.log(`No items found for pickup ${pickupId}. No points to grant.`);
            return;
        }

        const userId = pickupResult.rows[0].UserID;
        let totalPoints = 0;

        for (const item of pickupResult.rows) {
            if (['بلاستيك', 'ورق', 'زجاج', 'معدن'].some(t => item.ItemName.includes(t))) {
                totalPoints += item.Quantity * settings.recyclingPerKg;
            } else if (item.ItemName.includes('عضوي')) {
                totalPoints += item.Quantity * settings.organicPerKg;
            }
        }

        if (totalPoints > 0) {
            const reason = `Automatic grant for completed pickup #${pickupId}`;
            await client.query('UPDATE "Users" SET "PointsBalance" = "PointsBalance" + $1 WHERE "UserID" = $2', [totalPoints, userId]);
            await client.query('INSERT INTO "PointsLog" ("UserID", "Points", "LogType", "Reason", "SourceID") VALUES ($1, $2, $3, $4, $5)', [userId, totalPoints, 'grant', reason, pickupId]);
            console.log(`Granted ${totalPoints} points to user ${userId} for pickup ${pickupId}.`);
        }
    } catch (error) {
        console.error(`Error in grantPointsForPickup for pickupId ${pickupId}:`, error);
        throw error;
    }
}
