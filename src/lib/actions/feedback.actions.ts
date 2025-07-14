'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { z } from 'zod';

export type Feedback = {
    FeedbackID: number;
    UserID: number;
    FullName: string;
    FeedbackType: string;
    Subject: string;
    Details: string;
    PhotoURL: string | null;
    Status: string;
    SubmittedAt: Date;
};

const addFeedbackSchema = z.object({
    type: z.string(),
    subject: z.string().min(5),
    details: z.string().min(20),
    photo: z.string().optional(),
    userId: z.number(), // Assuming we get this from the session
});

export async function getFeedback(): Promise<Feedback[]> {
    try {
        const result = await query(`
            SELECT f."FeedbackID", f."UserID", u."FullName", f."FeedbackType", f."Subject", f."Details", f."PhotoURL", f."Status", f."SubmittedAt"
            FROM "Feedback" f
            JOIN "Users" u ON f."UserID" = u."UserID"
            ORDER BY f."SubmittedAt" DESC
        `, []);
        return result.rows as Feedback[];
    } catch (error) {
        console.error(`Database error in getFeedback: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addFeedback(data: z.infer<typeof addFeedbackSchema>) {
    try {
        const validatedData = addFeedbackSchema.parse(data);
        await query(
            'INSERT INTO "Feedback" ("UserID", "FeedbackType", "Subject", "Details", "PhotoURL") VALUES ($1, $2, $3, $4, $5)',
            [
                validatedData.userId,
                validatedData.type,
                validatedData.subject,
                validatedData.details,
                validatedData.photo || null
            ]
        );

        revalidatePath('/contact');
        revalidatePath('/admin/feedback');
        return { success: true, message: 'Feedback submitted successfully' };
    } catch (error) {
        console.error('Error adding feedback:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateFeedbackStatus(feedbackId: number, newStatus: string) {
    try {
        await query('UPDATE "Feedback" SET "Status" = $1 WHERE "FeedbackID" = $2', [newStatus, feedbackId]);
        revalidatePath('/admin/feedback');
        return { success: true };
    } catch (error) {
        console.error('Error updating feedback status:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deleteFeedback(feedbackId: number) {
    try {
        await query('DELETE FROM "Feedback" WHERE "FeedbackID" = $1', [feedbackId]);
        revalidatePath('/admin/feedback');
        return { success: true };
    } catch (error) {
        console.error('Error deleting feedback:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function replyToFeedback(feedbackId: number, reply: string) {
    console.log(`Replying to feedback ${feedbackId} with: ${reply}`);
    // This would typically create a notification or send an email.
    // For now, we'll just log it.
    return { success: true };
}
