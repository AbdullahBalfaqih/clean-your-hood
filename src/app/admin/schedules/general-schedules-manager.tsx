
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Edit, Trash2, Clock, CalendarDays } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { type GeneralSchedule, addGeneralSchedule, updateGeneralSchedule, deleteGeneralSchedule } from "@/lib/actions/schedules.actions"

const generalScheduleSchema = z.object({
    dayOfWeek: z.string({ required_error: "يجب اختيار اليوم."}),
    pickupTime: z.string().min(3, { message: "يجب إدخال الوقت."})
});

type FormValues = z.infer<typeof generalScheduleSchema>;

interface GeneralSchedulesManagerProps {
  initialSchedules: GeneralSchedule[];
}

const weekDays = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export function GeneralSchedulesManager({ initialSchedules }: GeneralSchedulesManagerProps) {
    const [schedules, setSchedules] = React.useState(initialSchedules);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingSchedule, setEditingSchedule] = React.useState<GeneralSchedule | null>(null);
    const [scheduleToDelete, setScheduleToDelete] = React.useState<GeneralSchedule | null>(null);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(generalScheduleSchema)
    });

    React.useEffect(() => {
        if (isFormOpen) {
            if (editingSchedule) {
                form.reset({
                    dayOfWeek: editingSchedule.DayOfWeek,
                    pickupTime: editingSchedule.PickupTime,
                });
            } else {
                form.reset({ dayOfWeek: undefined, pickupTime: "" });
            }
        }
    }, [isFormOpen, editingSchedule, form]);

    const handleFormSubmit = async (data: FormValues) => {
        const result = editingSchedule
            ? await updateGeneralSchedule(editingSchedule.GeneralScheduleID, data)
            : await addGeneralSchedule(data);

        if (result.success) {
            toast({ title: editingSchedule ? "تم تحديث الموعد" : "تمت إضافة الموعد" });
            window.location.reload(); 
        } else {
            toast({ title: "خطأ", description: result.message, variant: 'destructive' });
        }
        setIsFormOpen(false);
        setEditingSchedule(null);
    };

    const handleDelete = async () => {
        if (!scheduleToDelete) return;
        const result = await deleteGeneralSchedule(scheduleToDelete.GeneralScheduleID);

        if(result.success) {
            toast({ title: "تم حذف الموعد", variant: 'destructive' });
            setSchedules(schedules.filter(s => s.GeneralScheduleID !== scheduleToDelete.GeneralScheduleID));
        } else {
            toast({ title: "خطأ", description: result.message, variant: 'destructive' });
        }
        setScheduleToDelete(null);
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => { setEditingSchedule(null); setIsFormOpen(true); }}>
                    <PlusCircle className="me-2 h-4 w-4" />
                    إضافة موعد جديد
                </Button>
            </div>
            <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-primary hover:bg-primary">
                            <TableHead className="text-primary-foreground font-bold">اليوم</TableHead>
                            <TableHead className="text-primary-foreground font-bold">الوقت</TableHead>
                            <TableHead className="text-center text-primary-foreground font-bold">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedules.map((schedule) => (
                            <TableRow key={schedule.GeneralScheduleID}>
                                <TableCell className="font-medium">{schedule.DayOfWeek}</TableCell>
                                <TableCell>{schedule.PickupTime}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="outline" size="icon" onClick={() => { setEditingSchedule(schedule); setIsFormOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => setScheduleToDelete(schedule)}>
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
                        <DialogTitle>{editingSchedule ? 'تعديل موعد عام' : 'إضافة موعد عام جديد'}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="dayOfWeek"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><CalendarDays className="w-4 h-4"/> اليوم</FormLabel>
                                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="اختر يومًا..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {weekDays.map(day => (
                                                    <SelectItem key={day} value={day}>{day}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField control={form.control} name="pickupTime" render={({ field }) => (
                                <FormItem><FormLabel className="flex items-center gap-2"><Clock className="w-4 h-4"/> وقت الرفع</FormLabel><FormControl><Input placeholder="مثال: 9:00 صباحًا - 11:00 صباحًا" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>إلغاء</Button>
                                <Button type="submit">حفظ</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!scheduleToDelete} onOpenChange={(isOpen) => !isOpen && setScheduleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                           سيتم حذف الموعد المحدد ليوم {scheduleToDelete?.DayOfWeek} بشكل نهائي.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>تأكيد الحذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
