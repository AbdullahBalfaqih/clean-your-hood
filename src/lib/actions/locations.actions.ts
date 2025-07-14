'use server';

import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import { query } from '@/lib/db';
import { z } from 'zod';

export type BinLocation = {
    LocationID: number;
    Name: string;
    Latitude: number;
    Longitude: number;
    GoogleMapsURL: string | null;
};

const locationFormSchema = z.object({
    name: z.string().min(3),
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    link: z.string().url().optional().or(z.literal('')),
});

export async function getBinLocations(): Promise<BinLocation[]> {
    noStore();
    try {
        const result = await query('SELECT "LocationID", "Name", "Latitude", "Longitude", "GoogleMapsURL" FROM "BinLocations" ORDER BY "Name"', []);
        return result.rows as BinLocation[];
    } catch (error) {
        console.error(`Database error in getBinLocations: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addBinLocation(data: z.infer<typeof locationFormSchema>) {
    try {
        const validatedData = locationFormSchema.parse(data);
        await query(
            'INSERT INTO "BinLocations" ("Name", "Latitude", "Longitude", "GoogleMapsURL") VALUES ($1, $2, $3, $4)',
            [validatedData.name, validatedData.lat, validatedData.lng, validatedData.link || null]
        );

        revalidatePath('/admin/locations');
        revalidatePath('/map');
        return { success: true };
    } catch (error) {
        console.error('Error adding bin location:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateBinLocation(locationId: number, data: z.infer<typeof locationFormSchema>) {
    try {
        const validatedData = locationFormSchema.parse(data);
        await query(
            'UPDATE "BinLocations" SET "Name" = $1, "Latitude" = $2, "Longitude" = $3, "GoogleMapsURL" = $4 WHERE "LocationID" = $5',
            [validatedData.name, validatedData.lat, validatedData.lng, validatedData.link || null, locationId]
        );

        revalidatePath('/admin/locations');
        revalidatePath('/map');
        return { success: true };
    } catch (error) {
        console.error('Error updating bin location:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deleteBinLocation(locationId: number) {
    try {
        await query('DELETE FROM "BinLocations" WHERE "LocationID" = $1', [locationId]);
        revalidatePath('/admin/locations');
        revalidatePath('/map');
        return { success: true };
    } catch (error) {
        console.error('Error deleting bin location:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}
