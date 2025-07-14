"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Edit, Trash2, Banknote, User } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { type BankAccount, addBankAccount, updateBankAccount, deleteBankAccount } from "@/lib/actions/financial.actions"

const bankAccountSchema = z.object({
    bankName: z.string().min(3, { message: "اسم البنك مطلوب." }),
    accountNumber: z.string().min(5, { message: "رقم الحساب مطلوب." }),
    accountHolderName: z.string().min(3, { message: "اسم صاحب الحساب مطلوب." }),
});

type FormValues = z.infer<typeof bankAccountSchema>;

interface BankAccountsManagerProps {
    initialBankAccounts: BankAccount[];
}

export function BankAccountsManager({ initialBankAccounts }: BankAccountsManagerProps) {
    const [accounts, setAccounts] = React.useState(initialBankAccounts);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingAccount, setEditingAccount] = React.useState<BankAccount | null>(null);
    const [accountToDelete, setAccountToDelete] = React.useState<BankAccount | null>(null);
    const { toast } = useToast();
    const { t } = useLanguage();

    const form = useForm<FormValues>({
        resolver: zodResolver(bankAccountSchema)
    });

    React.useEffect(() => {
        if (isFormOpen) {
            if (editingAccount) {
                form.reset({
                    bankName: editingAccount.BankName,
                    accountNumber: editingAccount.AccountNumber,
                    accountHolderName: editingAccount.AccountHolderName,
                });
            } else {
                form.reset({ bankName: "", accountNumber: "", accountHolderName: "" });
            }
        }
    }, [isFormOpen, editingAccount, form]);

    const handleFormSubmit = async (data: FormValues) => {
        const result = editingAccount
            ? await updateBankAccount(editingAccount.BankAccountID, data)
            : await addBankAccount(data);

        if (result.success) {
            toast({ title: editingAccount ? "تم تحديث الحساب" : "تمت إضافة الحساب" });
            window.location.reload();
        } else {
            toast({ title: "خطأ", description: result.message, variant: 'destructive' });
        }
        setIsFormOpen(false);
        setEditingAccount(null);
    };

    const handleDelete = async () => {
        if (!accountToDelete) return;
        const result = await deleteBankAccount(accountToDelete.BankAccountID);

        if (result.success) {
            toast({ title: "تم حذف الحساب البنكي", variant: 'destructive' });
            setAccounts(accounts.filter(acc => acc.BankAccountID !== accountToDelete.BankAccountID));
        } else {
            toast({ title: "خطأ", description: result.message, variant: 'destructive' });
        }
        setAccountToDelete(null);
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => { setEditingAccount(null); setIsFormOpen(true); }}>
                    <PlusCircle className="me-2 h-4 w-4" />
                    إضافة حساب جديد
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-primary hover:bg-primary">
                            <TableHead className="text-primary-foreground font-bold text-center">اسم البنك</TableHead>
                            <TableHead className="text-primary-foreground font-bold text-center">صاحب الحساب</TableHead>
                            <TableHead className="text-primary-foreground font-bold text-center">رقم الحساب</TableHead>
                            <TableHead className="text-primary-foreground font-bold text-center">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accounts.map((account) => (
                            <TableRow key={account.BankAccountID}>
                                <TableCell className="font-medium text-center">{account.BankName}</TableCell>
                                <TableCell className="text-center">{account.AccountHolderName}</TableCell>
                                <TableCell className="font-mono text-center" dir="ltr">{account.AccountNumber}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="outline" size="icon" onClick={() => { setEditingAccount(account); setIsFormOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => setAccountToDelete(account)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAccount ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي جديد'}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField control={form.control} name="bankName" render={({ field }) => (
                                <FormItem><FormLabel className="flex items-center gap-2"><Banknote className="w-4 h-4" /> اسم البنك</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                                <FormItem><FormLabel className="flex items-center gap-2"><User className="w-4 h-4" /> اسم صاحب الحساب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="accountNumber" render={({ field }) => (
                                <FormItem><FormLabel className="flex items-center gap-2"># رقم الحساب</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit">{t('common.save')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!accountToDelete} onOpenChange={(isOpen) => !isOpen && setAccountToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف الحساب البنكي الخاص بـ "{accountToDelete?.BankName}" نهائيًا.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{t('common.confirm_delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
