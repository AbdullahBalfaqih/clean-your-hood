'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { z } from 'zod';

export type NewsArticle = {
    NewsID: number;
    Title: string;
    Content: string;
    Author: string;
    ImageURL: string | null;
    PublishDate: Date;
};

const newsFormSchema = z.object({
    title: z.string().min(5),
    author: z.string().min(2),
    content: z.string().min(20),
    imageURL: z.string().optional(),
});

export async function getNews(): Promise<NewsArticle[]> {
    try {
        const result = await query('SELECT "NewsID", "Title", "Content", "Author", "ImageURL", "PublishDate" FROM "News" ORDER BY "PublishDate" DESC', []);
        return result.rows as NewsArticle[];
    } catch (error) {
        console.error(`Database error in getNews: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function getNewsArticleById(articleId: number): Promise<NewsArticle | null> {
    try {
        const result = await query('SELECT "NewsID", "Title", "Content", "Author", "ImageURL", "PublishDate" FROM "News" WHERE "NewsID" = $1', [articleId]);

        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0] as NewsArticle;
    } catch (error) {
        console.error(`Database error in getNewsArticleById: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addNews(data: z.infer<typeof newsFormSchema>) {
    try {
        const validatedData = newsFormSchema.parse(data);
        await query(
            'INSERT INTO "News" ("Title", "Content", "Author", "ImageURL") VALUES ($1, $2, $3, $4)',
            [
                validatedData.title,
                validatedData.content,
                validatedData.author,
                validatedData.imageURL || 'https://placehold.co/600x400.png'
            ]
        );

        revalidatePath('/admin/news');
        revalidatePath('/news');
        return { success: true };
    } catch (error) {
        console.error('Error adding news:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateNews(articleId: number, data: z.infer<typeof newsFormSchema>) {
    try {
        const validatedData = newsFormSchema.parse(data);
        await query(
            `UPDATE "News" SET "Title" = $1, "Content" = $2, "Author" = $3, "ImageURL" = $4 WHERE "NewsID" = $5`,
            [
                validatedData.title,
                validatedData.content,
                validatedData.author,
                validatedData.imageURL || 'https://placehold.co/600x400.png',
                articleId
            ]
        );

        revalidatePath('/admin/news');
        revalidatePath('/news');
        revalidatePath(`/news/${articleId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating news:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deleteNews(articleId: number) {
    try {
        await query('DELETE FROM "News" WHERE "NewsID" = $1', [articleId]);
        revalidatePath('/admin/news');
        revalidatePath('/news');
        return { success: true };
    } catch (error) {
        console.error('Error deleting news:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}
