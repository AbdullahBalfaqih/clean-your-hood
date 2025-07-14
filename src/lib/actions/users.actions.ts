
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { query } from '@/lib/db'

export type User = {
    UserID: number
    FullName: string
    Email: string
    PhoneNumber: string
    Role: 'مستخدم' | 'مدير'
    Address: string | null;
    Landmark: string | null;
    Latitude: number | null;
    Longitude: number | null;
    PointsBalance: number;
    PhotoURL: string | null;
}

const userFormSchema = z.object({
    name: z.string().min(1, { message: 'الاسم مطلوب.' }),
    email: z.string().email({ message: 'بريد إلكتروني غير صالح.' }).optional().or(z.literal('')),
    phone: z.string().min(7, { message: "رقم الهاتف مطلوب." }),
    role: z.enum(['مستخدم', 'مدير']),
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.").optional(),
})

const editUserFormSchema = userFormSchema.omit({ password: true });

const registerUserSchema = z.object({
    fullName: z.string().min(2, { message: "الاسم الكامل مطلوب." }),
    phone: z.string().regex(/^(70|71|73|77|78)\d{7}$/, {
        message: "يجب أن يكون رقم هاتف يمني صحيح (9 أرقام يبدأ بـ 70, 71, 73, 77, أو 78).",
    }),
    password: z.string().min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." }),
    email: z.string().email({ message: "بريد إلكتروني غير صالح." }).optional().or(z.literal('')),
    coordinates: z.string().min(1, "الرجاء تحديد موقعك على الخريطة."),
    address: z.string().min(10, { message: "عنوان المنزل التفصيلي مطلوب." }),
    landmark: z.string().optional(),
});

const loginSchema = z.object({
    phone: z.string().min(1, 'رقم الهاتف مطلوب.'),
    password: z.string().min(1, 'كلمة المرور مطلوبة.'),
});

const profileFormUpdateSchema = z.object({
    fullName: z.string().min(1, "الاسم الكامل مطلوب."),
    phone: z.string().regex(/^(70|71|73|77|78)\d{7}$/, { message: "يجب أن يكون رقم هاتف يمني صحيح." }),
    email: z.string().email({ message: "بريد إلكتروني غير صالح." }).optional().or(z.literal('')),
    photoURL: z.string().optional(),
});

const addressFormUpdateSchema = z.object({
    address: z.string().min(10, { message: "عنوان المنزل التفصيلي مطلوب." }),
    landmark: z.string().optional(),
    coordinates: z.string().min(1, "الرجاء تحديد موقعك على الخريطة."),
});

const securityFormUpdateSchema = z.object({
    currentPassword: z.string().min(1, { message: "كلمة المرور الحالية مطلوبة." }),
    newPassword: z.string().min(8, { message: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل." }),
});


export async function getUsers(): Promise<User[]> {
    try {
        const result = await query(`
          SELECT "UserID", "FullName", "Email", "PhoneNumber", "Role", "Address", "Landmark", "Latitude", "Longitude", "PointsBalance", "PhotoURL" 
          FROM "Users" 
          ORDER BY "CreatedAt" DESC
        `, [])
        return result.rows as User[]
    } catch (error) {
        console.error(`Database error in getUsers: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}

export async function getUserProfile(userId: number): Promise<User | null> {
    try {
        const result = await query('SELECT "UserID", "FullName", "Email", "PhoneNumber", "Role", "Address", "Landmark", "Latitude", "Longitude", "PointsBalance", "PhotoURL" FROM "Users" WHERE "UserID" = $1', [userId]);
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0] as User;
    } catch (error) {
        console.error(`Database error in getUserProfile: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export async function addUser(data: z.infer<typeof userFormSchema>) {
    try {
        const validatedData = userFormSchema.parse(data)
        if (!validatedData.password) {
            return { success: false, message: 'كلمة المرور مطلوبة للمستخدمين الجدد.' };
        }
        const hashedPassword = validatedData.password; // Placeholder for hashing

        await query(
            'INSERT INTO "Users" ("FullName", "Email", "PhoneNumber", "Role", "PasswordHash") VALUES ($1, $2, $3, $4, $5)',
            [validatedData.name, validatedData.email || null, validatedData.phone, validatedData.role, hashedPassword]
        );

        revalidatePath('/admin/users')
        return { success: true, message: 'User added successfully' }
    } catch (error: any) {
        console.error('Error adding user:', error)
        if (error.code === '23505') { // PostgreSQL unique violation
            return { success: false, message: 'رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل.' };
        }
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' }
    }
}

export async function updateUser(userId: number, data: z.infer<typeof editUserFormSchema>) {
    try {
        const validatedData = editUserFormSchema.parse(data)

        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (validatedData.name) {
            setClauses.push(`"FullName" = $${paramIndex++}`);
            values.push(validatedData.name);
        }
        if (validatedData.email) {
            setClauses.push(`"Email" = $${paramIndex++}`);
            values.push(validatedData.email);
        }
        if (validatedData.phone) {
            setClauses.push(`"PhoneNumber" = $${paramIndex++}`);
            values.push(validatedData.phone);
        }
        if (validatedData.role) {
            setClauses.push(`"Role" = $${paramIndex++}`);
            values.push(validatedData.role);
        }

        if (setClauses.length === 0) {
            return { success: true, message: 'No changes provided.' };
        }

        values.push(userId);
        const queryString = `UPDATE "Users" SET ${setClauses.join(', ')} WHERE "UserID" = $${paramIndex}`;

        await query(queryString, values);

        revalidatePath('/admin/users')
        revalidatePath('/admin/map')
        return { success: true, message: 'User updated successfully' }
    } catch (error: any) {
        console.error('Error updating user:', error)
        if (error.code === '23505') { // PostgreSQL unique violation
            return { success: false, message: 'رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل.' };
        }
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' }
    }
}

export async function deleteUser(userId: number) {
    try {
        await query('DELETE FROM "Users" WHERE "UserID" = $1', [userId])
        revalidatePath('/admin/users')
        revalidatePath('/admin/map')
        return { success: true, message: 'User deleted successfully' }
    } catch (error) {
        console.error('Error deleting user:', error)
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' }
    }
}

export async function registerUser(data: z.infer<typeof registerUserSchema>) {
    try {
        const validatedData = registerUserSchema.parse(data);
        const [lat, lng] = validatedData.coordinates.split(',').map(Number);
        const hashedPassword = validatedData.password;

        const result = await query(`
        INSERT INTO "Users" ("FullName", "Email", "PhoneNumber", "PasswordHash", "Address", "Landmark", "Latitude", "Longitude") 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING "UserID", "FullName", "Role"
      `, [
            validatedData.fullName,
            validatedData.email || null,
            validatedData.phone,
            hashedPassword,
            validatedData.address,
            validatedData.landmark || null,
            lat,
            lng
        ]);

        revalidatePath('/admin/map');
        revalidatePath('/admin/users');

        const newUser = result.rows[0];

        return { success: true, message: 'User registered successfully', user: { id: newUser.UserID, name: newUser.FullName, role: newUser.Role } };
    } catch (error: any) {
        console.error('Error registering user:', error);
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid data provided.' };
        }
        if (error.code === '23505') {
            return { success: false, message: 'رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل.' };
        }
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function loginUser(data: z.infer<typeof loginSchema>): Promise<{ success: boolean; message: string; user?: { UserID: number; FullName: string; Role: 'مستخدم' | 'مدير'; Email: string | null } }> {
    try {
        const validatedData = loginSchema.parse(data);

        const result = await query('SELECT "UserID", "FullName", "Email", "Role", "PasswordHash" FROM "Users" WHERE "PhoneNumber" = $1', [validatedData.phone]);

        if (result.rows.length === 0) {
            return { success: false, message: 'رقم الهاتف غير مسجل لدينا.' };
        }

        const user: User & { PasswordHash: string } = result.rows[0];
        const passwordMatches = user.PasswordHash === validatedData.password;

        if (!passwordMatches) {
            return { success: false, message: 'كلمة المرور غير صحيحة.' };
        }

        const { PasswordHash, ...userToReturn } = user;

        return { success: true, message: 'تم تسجيل الدخول بنجاح!', user: userToReturn };

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, message: 'بيانات غير صالحة.' };
        }
        console.error('Login error:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string; newPassword?: string }> {
    try {
        const userResult = await query('SELECT "UserID" FROM "Users" WHERE "Email" = $1', [email]);

        if (userResult.rows.length === 0) {
            return { success: false, message: 'البريد الإلكتروني غير مسجل لدينا.' };
        }
        const userId = userResult.rows[0].UserID;
        const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
        const newPasswordHash = newPassword; // Placeholder for hashing

        await query('UPDATE "Users" SET "PasswordHash" = $1 WHERE "UserID" = $2', [newPasswordHash, userId]);

        revalidatePath('/forgot-password');
        return { success: true, message: 'تم إنشاء كلمة مرور جديدة.', newPassword: newPassword };

    } catch (error) {
        console.error('Forgot password error:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateUserProfile(userId: number, data: z.infer<typeof profileFormUpdateSchema>) {
    try {
        const validatedData = profileFormUpdateSchema.parse(data);
        await query(
            'UPDATE "Users" SET "FullName" = $1, "PhoneNumber" = $2, "Email" = $3, "PhotoURL" = $4 WHERE "UserID" = $5',
            [validatedData.fullName, validatedData.phone, validatedData.email || null, validatedData.photoURL, userId]
        );
        revalidatePath('/profile');
        return { success: true, message: "تم تحديث الملف الشخصي" };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateUserAddress(userId: number, data: z.infer<typeof addressFormUpdateSchema>) {
    try {
        const validatedData = addressFormUpdateSchema.parse(data);
        const [lat, lng] = validatedData.coordinates.split(',').map(Number);
        await query(
            'UPDATE "Users" SET "Address" = $1, "Landmark" = $2, "Latitude" = $3, "Longitude" = $4 WHERE "UserID" = $5',
            [validatedData.address, validatedData.landmark || null, lat, lng, userId]
        );
        revalidatePath('/profile');
        return { success: true, message: 'تم تحديث العنوان' };
    } catch (error) {
        console.error('Error updating user address:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function changeUserPassword(userId: number, data: z.infer<typeof securityFormUpdateSchema>) {
    try {
        const validatedData = securityFormUpdateSchema.parse(data);
        const result = await query('SELECT "PasswordHash" FROM "Users" WHERE "UserID" = $1', [userId]);

        if (result.rows.length === 0) {
            return { success: false, message: 'User not found.' };
        }

        const user = result.rows[0];
        const passwordMatches = user.PasswordHash === validatedData.currentPassword;

        if (!passwordMatches) {
            return { success: false, message: 'كلمة المرور الحالية غير صحيحة.' };
        }
        const newHashedPassword = validatedData.newPassword;

        await query('UPDATE "Users" SET "PasswordHash" = $1 WHERE "UserID" = $2', [newHashedPassword, userId]);

        revalidatePath('/profile');
        return { success: true, message: 'تم تغيير كلمة المرور بنجاح!' };
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}
