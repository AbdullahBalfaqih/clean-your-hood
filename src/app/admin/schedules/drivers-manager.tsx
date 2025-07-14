"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Edit, Trash2, User, Phone } from "lucide-react"
import { Dialog as FormDialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { type Driver, addDriver, updateDriver, deleteDriver } from "@/lib/actions/schedules.actions"

const driverFormSchema = z.object({
    name: z.string().min(3, { message: "الاسم مطلوب ويجب أن يكون 3 أحرف على الأقل." }),
    phone: z.string().regex(/^(70|71|73|77|78)\d{7}$/, { message: "يجب أن يكون رقم هاتف يمني صحيح." }),
});

type DriverFormValues = z.infer<typeof driverFormSchema>;

interface DriversManagerProps {
    initialDrivers: Driver[];
}

export function DriversManager({ initialDrivers }: DriversManagerProps) {
    const [drivers, setDrivers] = React.useState(initialDrivers);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingDriver, setEditingDriver] = React.useState<Driver | null>(null);
    const [driverToDelete, setDriverToDelete] = React.useState<Driver | null>(null);
    const { toast } = useToast();
    const { t } = useLanguage();

    const form = useForm<DriverFormValues>({
        resolver: zodResolver(driverFormSchema)
    });

    React.useEffect(() => {
        if (isFormOpen) {
            if (editingDriver) {
                form.reset({
                    name: editingDriver.FullName,
                    phone: editingDriver.Phone,
                });
            } else {
                form.reset({ name: "", phone: "" });
            }
        }
    }, [isFormOpen, editingDriver, form]);

    const handleFormSubmit = async (data: DriverFormValues) => {
        const result = editingDriver
            ? await updateDriver(editingDriver.DriverID, data)
            : await addDriver(data);

        if (result.success) {
            toast({ title: editingDriver ? t('admin.drivers.toast.updated') : t('admin.drivers.toast.added') });
            window.location.reload();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsFormOpen(false);
        setEditingDriver(null);
    };

    const handleDeleteDriver = async () => {
        if (!driverToDelete) return;
        const result = await deleteDriver(driverToDelete.DriverID);

        if (result.success) {
            toast({ title: t('admin.drivers.toast.deleted'), variant: 'destructive' });
            setDrivers(drivers.filter(d => d.DriverID !== driverToDelete.DriverID));
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setDriverToDelete(null);
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => { setEditingDriver(null); setIsFormOpen(true); }}>
                    <PlusCircle className="me-2 h-4 w-4" />
                    {t('admin.drivers.add_new')}
                </Button>
            </div>
            <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-primary hover:bg-primary">
                            <TableHead className="text-primary-foreground font-bold">{t('admin.drivers.table.name')}</TableHead>
                            <TableHead className="text-primary-foreground font-bold">{t('admin.drivers.table.phone')}</TableHead>
                            <TableHead className="text-center text-primary-foreground font-bold">{t('common.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {drivers.map((driver) => (
                            <TableRow key={driver.DriverID}>
                                <TableCell className="font-medium">{driver.FullName}</TableCell>
                                <TableCell className="font-mono text-xs text-left" dir="ltr">{driver.Phone}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="outline" size="icon" onClick={() => { setEditingDriver(driver); setIsFormOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => setDriverToDelete(driver)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <FormDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingDriver ? t('admin.drivers.dialog.edit_title') : t('admin.drivers.dialog.add_title')}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel className="flex items-center gap-2"><User className="w-4 h-4" />{t('admin.drivers.form.name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4" />{t('admin.drivers.form.phone')}</FormLabel><FormControl><Input type="tel" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit">{t('common.save')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </FormDialog>

            <AlertDialog open={!!driverToDelete} onOpenChange={(isOpen) => !isOpen && setDriverToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('admin.drivers.confirm_delete', { name: driverToDelete?.FullName })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDriver}>{t('common.confirm_delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
