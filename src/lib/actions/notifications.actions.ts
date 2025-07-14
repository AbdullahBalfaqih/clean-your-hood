'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { z } from 'zod';

export type Notification = {
    NotificationID: number;
    Title: string;
    Content: string;
    TargetAudience: string;
    TargetUserID: number | null;
    TargetUserName: string | null; // For display purposes
    SentAt: Date;
};

const notificationFormSchema = z.object({
    title: z.string().min(5),
    content: z.string().min(10),
    target: z.enum(["الكل", "المستخدمون", "المدراء", "مستخدم محدد"]),
    targetUserId: z.coerce.number().optional(),
});

export async function getNotifications(): Promise<Notification[]> {
    try {
        const result = await query(`
            SELECT 
                n."NotificationID", n."Title", n."Content", n."TargetAudience", n."TargetUserID",
                u."FullName" as "TargetUserName", n."SentAt" 
            FROM "Notifications" n
            LEFT JOIN "Users" u ON n."TargetUserID" = u."UserID"
            ORDER BY n."SentAt" DESC
        `, []);

        return result.rows as Notification[];
    } catch (error) {
        console.error(`Database error in getNotifications: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addNotification(data: z.infer<typeof notificationFormSchema>) {
    try {
        const validatedData = notificationFormSchema.parse(data);

        await query(
            'INSERT INTO "Notifications" ("Title", "Content", "TargetAudience", "TargetUserID") VALUES ($1, $2, $3, $4)',
            [
                validatedData.title,
                validatedData.content,
                validatedData.target,
                validatedData.target === 'مستخدم محدد' ? validatedData.targetUserId : null
            ]
        );

        revalidatePath('/admin/notifications');
        return { success: true };
    } catch (error) {
        console.error('Error adding notification:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deleteNotification(notificationId: number) {
    try {
        await query('DELETE FROM "Notifications" WHERE "NotificationID" = $1', [notificationId]);
        revalidatePath('/admin/notifications');
        return { success: true };
    } catch (error) {
        console.error('Error deleting notification:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}
