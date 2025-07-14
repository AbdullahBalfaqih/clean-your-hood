
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Trash2, Bell } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { type Notification, addNotification, deleteNotification } from "@/lib/actions/notifications.actions"
import { type User } from "@/lib/actions/users.actions"

const notificationFormSchema = z.object({
    title: z.string().min(5, { message: "العنوان مطلوب." }),
    content: z.string().min(10, { message: "المحتوى مطلوب." }),
    target: z.enum(["الكل", "المستخدمون", "المدراء", "مستخدم محدد"]),
    targetUserId: z.coerce.number().optional(),
}).refine(data => {
    if (data.target === "مستخدم محدد") {
        return !!data.targetUserId;
    }
    return true;
}, {
    message: "يجب اختيار مستخدم محدد.",
    path: ["targetUserId"],
});


type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export function NotificationsClient({ initialNotifications, users }: { initialNotifications: Notification[], users: User[] }) {
    const [notifications, setNotifications] = React.useState(initialNotifications)
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [notificationToDelete, setNotificationToDelete] = React.useState<Notification | null>(null)
    const { toast } = useToast()
    const { t } = useLanguage()

    const form = useForm<NotificationFormValues>({
        resolver: zodResolver(notificationFormSchema),
        defaultValues: { target: "الكل" }
    });

    const targetValue = form.watch("target");

    React.useEffect(() => {
        if (isFormOpen) {
            form.reset({ title: "", content: "", target: "الكل", targetUserId: undefined });
        }
    }, [isFormOpen, form]);

    const handleFormSubmit = async (data: NotificationFormValues) => {
        const result = await addNotification(data);
        if (result.success) {
            toast({ title: t('admin.notifications.toast.sent') });
            window.location.reload();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsFormOpen(false);
    };

    const handleDelete = async () => {
        if (!notificationToDelete) return;
        const result = await deleteNotification(notificationToDelete.NotificationID);

        if (result.success) {
            toast({ title: t('admin.notifications.toast.deleted'), variant: 'destructive' });
            setNotifications(notifications.filter(n => n.NotificationID !== notificationToDelete.NotificationID));
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setNotificationToDelete(null);
    };

    const audienceTranslations: { [key: string]: string } = {
        'الكل': t('admin.notifications.audience.all'),
        'المستخدمون': t('admin.notifications.audience.users'),
        'المدراء': t('admin.notifications.audience.admins'),
        'مستخدم محدد': t('admin.notifications.audience.specific_user'),
    }

    const getAudienceDisplay = (notification: Notification) => {
        if (notification.TargetAudience === 'مستخدم محدد' && notification.TargetUserName) {
            return `${t('admin.notifications.audience.specific_user')}: ${notification.TargetUserName}`;
        }
        return audienceTranslations[notification.TargetAudience] || notification.TargetAudience;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2 font-headline"><Bell /> {t('admin.notifications.title')}</CardTitle>
                            <CardDescription>{t('admin.notifications.description')}</CardDescription>
                        </div>
                        <Button onClick={() => setIsFormOpen(true)}>
                            <PlusCircle className="me-2 h-4 w-4" />
                            {t('admin.notifications.send_new')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-primary hover:bg-primary">
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.notifications.table.title')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.notifications.table.content')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.notifications.table.audience')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.notifications.table.date')}</TableHead>
                                    <TableHead className="text-center text-primary-foreground font-bold">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {notifications.map((item) => (
                                    <TableRow key={item.NotificationID}>
                                        <TableCell className="font-medium">{item.Title}</TableCell>
                                        <TableCell className="max-w-md truncate" title={item.Content}>{item.Content}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{getAudienceDisplay(item)}</Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(item.SentAt), 'yyyy-MM-dd')}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="destructive" size="icon" onClick={() => setNotificationToDelete(item)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.notifications.dialog.send_title')}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.notifications.form.title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="content" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.notifications.form.content')}</FormLabel><FormControl><Textarea placeholder={t('admin.notifications.form.content_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="target" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.notifications.form.target_audience')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="الكل">{audienceTranslations['الكل']}</SelectItem>
                                            <SelectItem value="المستخدمون">{audienceTranslations['المستخدمون']}</SelectItem>
                                            <SelectItem value="المدراء">{audienceTranslations['المدراء']}</SelectItem>
                                            <SelectItem value="مستخدم محدد">{audienceTranslations['مستخدم محدد']}</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            {targetValue === "مستخدم محدد" && (
                                <FormField control={form.control} name="targetUserId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>اختر المستخدم</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="اختر مستخدمًا..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {users.map(user => <SelectItem key={user.UserID} value={String(user.UserID)}>{user.FullName} - #{user.UserID}</SelectItem>)}
                                            </SelectContent>
                                        </Select><FormMessage />
                                    </FormItem>
                                )} />
                            )}
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit">{t('common.send')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!notificationToDelete} onOpenChange={(isOpen) => !isOpen && setNotificationToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('admin.notifications.confirm_delete', { title: notificationToDelete?.Title })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>{t('common.confirm_delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
