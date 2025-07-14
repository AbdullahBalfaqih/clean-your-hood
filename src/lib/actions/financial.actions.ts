'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { z } from 'zod';
import { addNotification } from './notifications.actions';

// --- Types ---
export type FinancialSupportSubmission = {
    SupportID: number;
    UserID: number;
    FullName: string;
    Amount: number;
    BankName: string;
    ReceiptURL: string;
    Status: string;
    SubmittedAt: Date;
};

export type BankAccount = {
    BankAccountID: number;
    BankName: string;
    AccountNumber: string;
    AccountHolderName: string;
};


// --- Zod Schemas ---
const addSupportSchema = z.object({
    donorName: z.string().min(3),
    amount: z.coerce.number().min(1),
    bank: z.string(),
    receiptImage: z.string(),
    userId: z.number(),
});

const bankAccountSchema = z.object({
    bankName: z.string().min(3, "اسم البنك مطلوب."),
    accountNumber: z.string().min(5, "رقم الحساب مطلوب."),
    accountHolderName: z.string().min(3, "اسم صاحب الحساب مطلوب."),
});


// --- Financial Support Actions ---
export async function getFinancialSupportSubmissions(): Promise<FinancialSupportSubmission[]> {
    try {
        const result = await query(`
            SELECT fs."SupportID", fs."UserID", u."FullName", fs."Amount", fs."BankName", fs."ReceiptURL", fs."Status", fs."SubmittedAt"
            FROM "FinancialSupport" fs
            JOIN "Users" u ON fs."UserID" = u."UserID"
            ORDER BY fs."SubmittedAt" DESC
        `, []);
        return result.rows as FinancialSupportSubmission[];
    } catch (error) {
        console.error(`Database error in getFinancialSupportSubmissions: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export async function addFinancialSupportSubmission(data: z.infer<typeof addSupportSchema>) {
    try {
        const validatedData = addSupportSchema.parse(data);
        await query(
            'INSERT INTO "FinancialSupport" ("UserID", "Amount", "BankName", "ReceiptURL") VALUES ($1, $2, $3, $4)',
            [
                validatedData.userId,
                validatedData.amount,
                validatedData.bank,
                validatedData.receiptImage
            ]
        );

        revalidatePath('/support');
        revalidatePath('/admin/financial-support');
        return { success: true, message: 'Support submission received successfully.' };
    } catch (error) {
        console.error('Error adding financial support:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function updateFinancialSupportStatus(submissionId: number, newStatus: string) {
    try {
        // If approved, find the user and amount to send a notification
        if (newStatus === 'مقبول') {
            const submissionResult = await query('SELECT "UserID", "Amount" FROM "FinancialSupport" WHERE "SupportID" = $1', [submissionId]);
            if (submissionResult.rows.length > 0) {
                const { UserID, Amount } = submissionResult.rows[0];
                // Send a notification to the user
                await addNotification({
                    title: 'شكراً لدعمك!',
                    content: `لقد قمنا بتأكيد استلام دعمك بمبلغ ${Amount} ريال. مساهمتك تساعدنا على الاستمرار.`,
                    target: 'مستخدم محدد',
                    targetUserId: UserID,
                });
            }
        }

        await query('UPDATE "FinancialSupport" SET "Status" = $1 WHERE "SupportID" = $2', [newStatus, submissionId]);

        revalidatePath('/admin/financial-support');
        return { success: true };
    } catch (error) {
        console.error('Error updating financial support status:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

export async function deleteFinancialSupportSubmission(submissionId: number) {
    try {
        await query('DELETE FROM "FinancialSupport" WHERE "SupportID" = $1', [submissionId]);
        revalidatePath('/admin/financial-support');
        return { success: true };
    } catch (error) {
        console.error('Error deleting financial support submission:', error);
        return { success: false, message: 'فشل الاتصال بقاعدة البيانات. لا يمكن إكمال الإجراء.' };
    }
}

// --- Bank Account Actions ---

export async function getBankAccounts(): Promise<BankAccount[]> {
    try {
        const result = await query('SELECT "BankAccountID", "BankName", "AccountNumber", "AccountHolderName" FROM "BankAccounts" ORDER BY "BankName"', []);
        return result.rows as BankAccount[];
    } catch (error) {
        if (error instanceof Error && (error as any).code === '42P01') { // 42P01 is undefined_table in PostgreSQL
            console.warn("BankAccounts table not found. Returning default list.");
            return [
                { BankAccountID: 1, BankName: "بنك العمقي", AccountNumber: "123-456-7890", AccountHolderName: "مؤسسة نظيف حيك" },
                { BankAccountID: 2, BankName: "بنك بن دول", AccountNumber: "098-765-4321", AccountHolderName: "مؤسسة نظيف حيك" },
                { BankAccountID: 3, BankName: "بنك الكريمي", AccountNumber: "555-555-5555", AccountHolderName: "مؤسسة نظيف حيك" },
            ];
        }
        console.error(`Database error in getBankAccounts: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}


export async function addBankAccount(data: z.infer<typeof bankAccountSchema>) {
    try {
        const validatedData = bankAccountSchema.parse(data);
        await query(
            'INSERT INTO "BankAccounts" ("BankName", "AccountNumber", "AccountHolderName") VALUES ($1, $2, $3)',
            [validatedData.bankName, validatedData.accountNumber, validatedData.accountHolderName]
        );

        revalidatePath('/admin/financial-support');
        revalidatePath('/support');
        return { success: true };
    } catch (error) {
        console.error('Error adding bank account:', error);
        return { success: false, message: 'فشل إضافة الحساب البنكي.' };
    }
}

export async function updateBankAccount(bankAccountId: number, data: z.infer<typeof bankAccountSchema>) {
    try {
        const validatedData = bankAccountSchema.parse(data);
        await query(
            'UPDATE "BankAccounts" SET "BankName" = $1, "AccountNumber" = $2, "AccountHolderName" = $3 WHERE "BankAccountID" = $4',
            [validatedData.bankName, validatedData.accountNumber, validatedData.accountHolderName, bankAccountId]
        );

        revalidatePath('/admin/financial-support');
        revalidatePath('/support');
        return { success: true };
    } catch (error) {
        console.error('Error updating bank account:', error);
        return { success: false, message: 'فشل تحديث الحساب البنكي.' };
    }
}

export async function deleteBankAccount(bankAccountId: number) {
    try {
        await query('DELETE FROM "BankAccounts" WHERE "BankAccountID" = $1', [bankAccountId]);
        revalidatePath('/admin/financial-support');
        revalidatePath('/support');
        return { success: true };
    } catch (error) {
        console.error('Error deleting bank account:', error);
        return { success: false, message: 'فشل حذف الحساب البنكي.' };
    }
}
