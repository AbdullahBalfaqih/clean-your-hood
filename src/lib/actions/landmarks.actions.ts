'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { z } from 'zod';

// Type
export type Landmark = {
    LandmarkID: number;
    Name: string;
    Type: string;
    Latitude: number;
    Longitude: number;
};

// Zod Schema (no longer exported)
const landmarkFormSchema = z.object({
    name: z.string().min(3, { message: "اسم المعلم مطلوب." }),
    type: z.enum(["mosque", "hospital", "school", "park"], { required_error: "نوع المعلم مطلوب." }),
    lat: z.coerce.number(),
    lng: z.coerce.number(),
});

// Actions
export async function getLandmarks(): Promise<Landmark[]> {
    try {
        const result = await query(`
            SELECT "LandmarkID", "Name", "Type", "Latitude", "Longitude" 
            FROM "Landmarks" 
            ORDER BY "Name"
        `, []);
        return result.rows as Landmark[];
    } catch (error) {
        if (error instanceof Error && (error as any).code === '42P01') { // 42P01 is undefined_table in PostgreSQL
            console.warn("Database table 'Landmarks' not found or DB not connected. Returning empty array.");
            return [];
        }
        console.error(`Database error in getLandmarks: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addLandmark(data: z.infer<typeof landmarkFormSchema>) {
    try {
        const validatedData = landmarkFormSchema.parse(data);
        await query(
            'INSERT INTO "Landmarks" ("Name", "Type", "Latitude", "Longitude") VALUES ($1, $2, $3, $4)',
            [validatedData.name, validatedData.type, validatedData.lat, validatedData.lng]
        );

        revalidatePath('/admin/map');
        return { success: true };
    } catch (error) {
        console.error('Error adding landmark:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateLandmark(landmarkId: number, data: z.infer<typeof landmarkFormSchema>) {
    try {
        const validatedData = landmarkFormSchema.parse(data);
        await query(
            'UPDATE "Landmarks" SET "Name" = $1, "Type" = $2, "Latitude" = $3, "Longitude" = $4 WHERE "LandmarkID" = $5',
            [validatedData.name, validatedData.type, validatedData.lat, validatedData.lng, landmarkId]
        );
        revalidatePath('/admin/map');
        return { success: true };
    } catch (error) {
        console.error('Error updating landmark:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deleteLandmark(landmarkId: number) {
    try {
        await query('DELETE FROM "Landmarks" WHERE "LandmarkID" = $1', [landmarkId]);
        revalidatePath('/admin/map');
        return { success: true };
    } catch (error) {
        console.error('Error deleting landmark:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}
