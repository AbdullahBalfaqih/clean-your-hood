
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { arSA } from "date-fns/locale"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { updateScheduleStatus } from "@/lib/actions/schedules.actions";

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, CalendarPlus, PlusCircle, Download, Loader2, Truck, Users as DriversIcon, Clock, CheckCircle, XCircle } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { type Schedule, type Driver, addSchedule, deleteSchedule, assignDriverToSchedules, type GeneralSchedule, updatePickupStatus } from "@/lib/actions/schedules.actions"
import { type User } from "@/lib/actions/users.actions"
import { RosterPrintLayout } from "./roster-print-layout"
import { cn } from "@/lib/utils"
import { DriversManager } from "./drivers-manager"
import { GeneralSchedulesManager } from "./general-schedules-manager"

const addScheduleSchema = z.object({
    userId: z.coerce.number().min(1, "يجب اختيار مستخدم."),
    type: z.string({ required_error: "نوع النفايات مطلوب." }),
    date: z.date({ required_error: "تاريخ الرفع مطلوب." }),
    driverId: z.coerce.number().optional(),
    status: z.enum(["مجدول", "مكتمل", "ملغي"]),
});

type ScheduleFormValues = z.infer<typeof addScheduleSchema>;

const assignDriverSchema = z.object({
    driverId: z.coerce.number({ required_error: "يجب اختيار سائق." }),
})

type AssignDriverValues = z.infer<typeof assignDriverSchema>;

interface SchedulesClientProps {
    initialSchedules: Schedule[];
    users: User[];
    drivers: Driver[];
    initialGeneralSchedules: GeneralSchedule[];
}

export function SchedulesClient({ initialSchedules, users, drivers, initialGeneralSchedules }: SchedulesClientProps) {
    const [schedules, setSchedules] = React.useState(initialSchedules)
    const [scheduleToDelete, setScheduleToDelete] = React.useState<Schedule | null>(null)
    const [editingSchedule, setEditingSchedule] = React.useState<Schedule | null>(null)
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [filterDate, setFilterDate] = React.useState<Date | undefined>(undefined)
    const [filterDriverId, setFilterDriverId] = React.useState<string>("all")
    const [selectedIds, setSelectedIds] = React.useState<number[]>([])
    const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false)
    const [isDriversDialogOpen, setIsDriversDialogOpen] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [isPrinting, setIsPrinting] = React.useState(false)
    const printRef = React.useRef<HTMLDivElement>(null)
    const [isGeneralSchedulesOpen, setIsGeneralSchedulesOpen] = React.useState(false);
    const [scheduleToUpdateStatus, setScheduleToUpdateStatus] = React.useState<{ schedule: Schedule, newStatus: 'مكتمل' | 'ملغي' } | null>(null);

    const { toast } = useToast()
    const { t } = useLanguage()

    const addForm = useForm<ScheduleFormValues>({ resolver: zodResolver(addScheduleSchema) });
    const assignForm = useForm<AssignDriverValues>({ resolver: zodResolver(assignDriverSchema) });

    React.useEffect(() => {
        if (isFormOpen) {
            if (editingSchedule) {
                addForm.reset({
                    userId: editingSchedule.UserID,
                    type: editingSchedule.items.map(item => `${item.name} (${item.quantity})`).join(', '),
                    date: new Date(editingSchedule.PickupDate),
                    driverId: editingSchedule.DriverID ?? undefined,
                    status: editingSchedule.Status as "مجدول" | "مكتمل" | "ملغي",
                });
            } else {
                addForm.reset({ userId: undefined, type: "", date: new Date(), status: "مجدول", driverId: undefined });
            }
        }
    }, [isFormOpen, editingSchedule, addForm]);

    const handleConfirmStatusUpdate = async () => {
        if (!scheduleToUpdateStatus) return;

        const { schedule, newStatus } = scheduleToUpdateStatus;
        const result = await updatePickupStatus(schedule.PickupID, newStatus);

        if (result.success) {
            toast({ title: `تم تحديث حالة الطلب إلى "${newStatus}" بنجاح.` });
            setSchedules(schedules.map(s => s.PickupID === schedule.PickupID ? { ...s, Status: newStatus } : s));
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setScheduleToUpdateStatus(null);
    };
    const handleDeleteSchedule = async () => {
        if (!scheduleToDelete) return;
        const result = await deleteSchedule(scheduleToDelete.PickupID);
        if (result.success) {
            setSchedules(schedules.filter(s => s.PickupID !== scheduleToDelete.PickupID));
            toast({ title: t('admin.schedules.toast.deleted') });
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setScheduleToDelete(null);
    };

    const handleAddFormSubmit = async (data: ScheduleFormValues) => {
        if (editingSchedule) {
            // فقط تحديث الحالة باستخدام updateScheduleStatus
            const result = await updateScheduleStatus({
                pickupId: editingSchedule.PickupID,
                status: data.status
            });

            if (result.success) {
                toast({ title: "تم تحديث حالة المهمة بنجاح" });
                setIsFormOpen(false);

                // تحديث الحالة محلياً حتى تظهر التغييرات فوراً
                setSchedules(prev =>
                    prev.map(s =>
                        s.PickupID === editingSchedule.PickupID
                            ? {
                                ...s,
                                Status: data.status,
                            }
                            : s
                    )
                );

                setEditingSchedule(null);
            } else {
                toast({ title: "خطأ في تحديث الحالة", description: result.message, variant: "destructive" });
            }
            return;
        }

        // إضافة مهمة جديدة كما كان
        const result = await addSchedule(data);
        if (result.success) {
            toast({ title: t("admin.schedules.toast.added") });
            setIsFormOpen(false);
            window.location.reload();
        } else {
            toast({ title: t("common.error"), description: result.message, variant: "destructive" });
        }
    };



    const handleAssignFormSubmit = async (data: AssignDriverValues) => {
        if (selectedIds.length === 0) {
            toast({ title: "لم يتم تحديد طلبات", variant: "destructive" });
            return;
        }
        const result = await assignDriverToSchedules(selectedIds, data.driverId);
        if (result.success) {
            toast({ title: "تم إسناد السائق بنجاح" });
            setIsAssignDialogOpen(false);
            setSelectedIds([]);
            window.location.reload();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
    };
    type PrintSchedule = {
        id: string;
        user: string;
        items: { name: string; quantity: number }[];
        date: string;
        status: string;
        driver: string | null;
        driverPhone: string | null;
        houseNumber: number;
        address: string;
        latitude: number | null;
        longitude: number | null;
        notes: string | null;
    };

    const filteredSchedules = React.useMemo(() => {
        let filtered = schedules;
        if (filterDate) {
            filtered = filtered.filter(s => format(new Date(s.PickupDate), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd'));
        }
        if (filterDriverId !== "all") {
            const driverIdNum = parseInt(filterDriverId, 10);
            filtered = filtered.filter(s => s.DriverID === driverIdNum);
        }
        return filtered;
    }, [schedules, filterDate, filterDriverId]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredSchedules.map(s => s.PickupID));
        } else {
            setSelectedIds([]);
        }
    }
    const statusTranslations = {
        "مجدول": t('admin.schedules.status.scheduled'),
        "مكتمل": t('admin.schedules.status.completed'),
        "ملغي": t('admin.schedules.status.cancelled'),
    } as const;
    const printSchedules = React.useMemo<PrintSchedule[]>(() => {
        if (!filterDate) return [];
        return filteredSchedules.map(s => ({
            id: String(s.PickupID),
            user: s.UserFullName,
            items: s.items,
            date: format(new Date(s.PickupDate), 'yyyy-MM-dd'),
            status: statusTranslations[s.Status as keyof typeof statusTranslations] || s.Status,
            driver: s.DriverFullName,
            driverPhone: s.DriverPhone,
            houseNumber: s.HouseNumber,
            address: s.Address,
            latitude: s.Latitude,
            longitude: s.Longitude,
            notes: s.Notes || null,
        }));
    }, [filteredSchedules, filterDate, t]);



   

    const handleDownloadRoster = () => {
        if (!filterDate) {
            toast({ title: "الرجاء اختيار تاريخ", description: "يجب تحديد تاريخ لإنشاء كشف الحضور.", variant: "destructive" });
            return;
        }
        if (isGenerating) return;
        setIsPrinting(true);
    };

    React.useEffect(() => {
        if (isPrinting) {
            const generatePdf = async () => {
                if (printSchedules.length === 0) {
                    toast({ title: t('admin.schedules.roster.none_title'), description: t('admin.schedules.roster.none_desc'), variant: "destructive" });
                    setIsPrinting(false);
                    return;
                }

                setIsGenerating(true);
                toast({ title: t('admin.schedules.roster.generating_title'), description: t('admin.schedules.roster.generating_desc') });

                const reportElement = printRef.current;
                if (!reportElement) {
                    toast({ title: t('admin.schedules.roster.error_title'), description: "Report element not found.", variant: "destructive" });
                    setIsPrinting(false);
                    setIsPrinting(false);
                    return;
                }

                try {
                    const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), canvas.height * pdf.internal.pageSize.getWidth() / canvas.width);
                    pdf.save(`Nadhif-Hayak-Roster-${format(filterDate!, 'yyyy-MM-dd')}.pdf`);
                    toast({ title: t('admin.schedules.roster.download_complete_title'), description: t('admin.schedules.roster.download_complete_desc') });
                } catch (error) {
                    console.error("Error generating PDF:", error);
                    toast({ title: t('admin.schedules.roster.error_title'), description: t('admin.schedules.roster.error_desc'), variant: "destructive" });
                } finally {
                    setIsGenerating(false);
                    setIsPrinting(false);
                }
            };
            const timer = setTimeout(generatePdf, 500);
            return () => clearTimeout(timer);
        }
    }, [isPrinting, printSchedules, toast, t, filterDate]);


    const getStatusVariant = (status: string) => {
        switch (status) {
            case "مكتمل": return "default";
            case "ملغي": return "destructive";
            case "مجدول": return "secondary";
            default: return "outline";
        }
    };

    const typeTranslations = {
        "إعادة تدوير": t('admin.schedules.types.recycling'),
        "نفايات عامة": t('admin.schedules.types.general'),
        "نفايات عضوية": t('admin.schedules.types.organic'),
        "مواد كبيرة": t('admin.schedules.types.bulky'),
    } as const;

    const handleStatusChange = async (pickupId: number, newStatus: "مجدول" | "مكتمل" | "ملغي") => {
        const result = await updateScheduleStatus({ pickupId, status: newStatus });
        if (result.success) {
            toast({ title: "تم تحديث الحالة" });
            setSchedules(prev =>
                prev.map(s => s.PickupID === pickupId ? { ...s, Status: newStatus } : s)
            );
        } else {
            toast({ title: "خطأ في تحديث الحالة", description: result.message, variant: "destructive" });
        }
    };


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{t('admin.schedules.title')}</CardTitle>
                    <CardDescription>{t('admin.schedules.description')}</CardDescription>
                </CardHeader>

                <CardContent dir="rtl"> {/* ✅ هذا السطر مهم لجعل المحتوى RTL */}
                    <div className="flex flex-wrap flex-row-reverse gap-2 justify-between items-center mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-[240px] justify-start text-start font-normal", !filterDate && "text-muted-foreground")}>
                                        <CalendarPlus className="me-2 h-4 w-4" />
                                        {filterDate ? format(filterDate, "PPP", { locale: arSA }) : <span>{t('admin.schedules.roster.select_date')}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus locale={arSA} />
                                </PopoverContent>
                            </Popover>

                            <Select value={filterDriverId} onValueChange={setFilterDriverId}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="تصفية حسب السائق" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل السائقين</SelectItem>
                                    {drivers.map(driver => (
                                        <SelectItem key={driver.DriverID} value={String(driver.DriverID)}>
                                            {driver.FullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                variant="secondary"
                                onClick={handleDownloadRoster}
                                disabled={isGenerating || !filterDate || selectedIds.length === 0}
                            >
                                {isGenerating ? (
                                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="me-2 h-4 w-4" />
                                )}
                                {isGenerating ? t('admin.schedules.roster.generating_button') : "طباعة الكشف"}
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button onClick={() => setIsAssignDialogOpen(true)} disabled={selectedIds.length === 0}>
                                <Truck className="me-2 h-4 w-4" />
                                إسناد سائق للمحدد ({selectedIds.length})
                            </Button>
                            <Button variant="outline" onClick={() => setIsDriversDialogOpen(true)}>
                                <DriversIcon className="me-2 h-4 w-4" />
                                إدارة السائقين
                            </Button>
                            <Button variant="outline" onClick={() => setIsGeneralSchedulesOpen(true)}>
                                <Clock className="me-2 h-4 w-4" />
                                المواعيد العامة
                            </Button>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-primary hover:bg-primary">
                                    <TableHead className="w-12 text-center text-primary-foreground">
                                        <Checkbox
                                            checked={selectedIds.length > 0 && selectedIds.length === filteredSchedules.length && filteredSchedules.length > 0}
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                            className="border-primary-foreground data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary"
                                        />
                                    </TableHead>
                                    <TableHead className="text-right text-primary-foreground font-bold">{t('admin.schedules.table.user')}</TableHead>
                                    <TableHead className="text-right text-primary-foreground font-bold">{t('admin.schedules.table.type')}</TableHead>
                                    <TableHead className="text-right text-primary-foreground font-bold">{t('admin.schedules.table.driver')}</TableHead>
                                    <TableHead className="text-right text-primary-foreground font-bold">{t('common.status')}</TableHead>
                                    <TableHead className="text-right text-primary-foreground font-bold">{t('التاريخ')}</TableHead>
                                    <TableHead className="text-center text-primary-foreground font-bold">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filteredSchedules.map((schedule) => (
                                    <TableRow key={schedule.PickupID} data-state={selectedIds.includes(schedule.PickupID) ? "selected" : ""}>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={selectedIds.includes(schedule.PickupID)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedIds(prev => checked ? [...prev, schedule.PickupID] : prev.filter(id => id !== schedule.PickupID));
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell className="text-right font-medium">
                                            {schedule.UserFullName} (# {schedule.HouseNumber})
                                        </TableCell>

                                        <TableCell
                                            className="max-w-xs truncate text-right"
                                            title={schedule.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                        >
                                            {schedule.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {schedule.DriverFullName || <span className="text-muted-foreground">{t('admin.schedules.unassigned')}</span>}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Badge variant={getStatusVariant(schedule.Status) as any}>
                                                {statusTranslations[schedule.Status as keyof typeof statusTranslations] || schedule.Status}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {(() => {
                                                const date = new Date(schedule.RequestDate);
                                                const datePart = date.toLocaleDateString("ar-EG", {
                                                    year: "numeric",
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                });
                                                const timePart = date.toLocaleTimeString("ar-EG", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                });
                                                return `${datePart}  ${timePart}`;
                                            })()}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex gap-2 justify-center">
                                                {schedule.Status === 'مجدول' && (
                                                    <>
                                                        <Button variant="outline" size="icon" className="text-primary border-primary hover:bg-primary/10 hover:text-primary" onClick={() => setScheduleToUpdateStatus({ schedule, newStatus: 'مكتمل' })}>
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="destructive" size="icon" onClick={() => setScheduleToUpdateStatus({ schedule, newStatus: 'ملغي' })}>
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                               
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="destructive" size="icon" onClick={() => setScheduleToDelete(schedule)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>


            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingSchedule ? t('admin.schedules.dialog.edit_title') : t('admin.schedules.dialog.add_title')}</DialogTitle>
                        <DialogDescription>{editingSchedule ? t('admin.schedules.dialog.edit_desc') : t('admin.schedules.dialog.add_desc')}</DialogDescription>
                    </DialogHeader>
                    <Form {...addForm}>
                        <form onSubmit={addForm.handleSubmit(handleAddFormSubmit)} className="grid gap-4 py-4">
                            <FormField control={addForm.control} name="userId" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.schedules.form.user')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر مستخدمًا..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {users.map(user => <SelectItem key={user.UserID} value={String(user.UserID)}>{user.FullName} - #{user.UserID}</SelectItem>)}
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={addForm.control} name="type" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.schedules.form.waste_type')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder={t('admin.schedules.form.waste_type_placeholder')} /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="إعادة تدوير">{t('admin.schedules.types.recycling')}</SelectItem>
                                            <SelectItem value="نفايات عامة">{t('admin.schedules.types.general')}</SelectItem>
                                            <SelectItem value="نفايات عضوية">{t('admin.schedules.types.organic')}</SelectItem>
                                            <SelectItem value="مواد كبيرة">{t('admin.schedules.types.bulky')}</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={addForm.control} name="date" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>{t('admin.schedules.form.pickup_date')}</FormLabel>
                                    <Popover><PopoverTrigger asChild>
                                        <FormControl><Button variant={"outline"} className={cn("w-full", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP", { locale: arSA }) : <span>{t('admin.schedules.form.select_date')}</span>}
                                            <CalendarPlus className="ms-auto h-4 w-4 opacity-50" />
                                        </Button></FormControl>
                                    </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} initialFocus locale={arSA} />
                                        </PopoverContent></Popover><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={addForm.control} name="status" render={({ field }) => (
                                <FormItem><FormLabel>{t('common.status')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder={t('admin.schedules.form.status_placeholder')} /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="مجدول">{t('admin.schedules.status.scheduled')}</SelectItem>
                                            <SelectItem value="مكتمل">{t('admin.schedules.status.completed')}</SelectItem>
                                            <SelectItem value="ملغي">{t('admin.schedules.status.cancelled')}</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit">{t('common.save')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إسناد سائق</DialogTitle>
                        <DialogDescription>
                            أنت على وشك إسناد {selectedIds.length} مهمة رفع. اختر السائق من القائمة.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...assignForm}>
                        <form onSubmit={assignForm.handleSubmit(handleAssignFormSubmit)} className="space-y-4">
                            <FormField control={assignForm.control} name="driverId" render={({ field }) => (
                                <FormItem><FormLabel>السائق</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر سائقًا..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {drivers.map(driver => <SelectItem key={driver.DriverID} value={String(driver.DriverID)}>{driver.FullName}</SelectItem>)}
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit">تأكيد الإسناد</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDriversDialogOpen} onOpenChange={setIsDriversDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('admin.drivers.title')}</DialogTitle>
                        <DialogDescription>{t('admin.drivers.description')}</DialogDescription>
                    </DialogHeader>
                    <DriversManager initialDrivers={drivers} />
                </DialogContent>
            </Dialog>

            <Dialog open={isGeneralSchedulesOpen} onOpenChange={setIsGeneralSchedulesOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>إدارة المواعيد العامة</DialogTitle>
                        <DialogDescription>إضافة وتعديل وحذف مواعيد الجمع الأسبوعية العامة.</DialogDescription>
                    </DialogHeader>
                    <GeneralSchedulesManager initialSchedules={initialGeneralSchedules} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!scheduleToUpdateStatus} onOpenChange={() => setScheduleToUpdateStatus(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.confirm_action')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد أنك تريد تغيير حالة الطلب رقم {scheduleToUpdateStatus?.schedule.PickupID} إلى "{scheduleToUpdateStatus?.newStatus}"؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setScheduleToUpdateStatus(null)}>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmStatusUpdate}>{t('common.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!scheduleToDelete} onOpenChange={(isOpen) => !isOpen && setScheduleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('admin.schedules.confirm_delete', { id: scheduleToDelete?.PickupID })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSchedule}>{t('common.confirm_delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isPrinting && <div className="absolute -z-10 -left-[9999px] top-0"><div ref={printRef}><RosterPrintLayout schedules={printSchedules} reportDate={filterDate!} /></div></div>}
        </>
    )
}
