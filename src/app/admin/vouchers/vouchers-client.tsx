
"use client"

import * as React from "react"
import Image from "next/image"
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
import { PlusCircle, Edit, Trash2, Ticket, Upload, ClipboardCheck, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Voucher, addVoucher, updateVoucher, deleteVoucher, type VoucherRedemption, processVoucherRedemption, deleteVoucherRedemption } from "@/lib/actions/vouchers.actions"

const voucherFormSchema = z.object({
    partner: z.string().min(2, { message: "اسم الشريك مطلوب." }),
    title: z.string().min(5, { message: "عنوان القسيمة مطلوب." }),
    description: z.string().min(10, { message: "الوصف مطلوب." }),
    points: z.coerce.number().min(1, { message: "النقاط مطلوبة." }),
    quantity: z.coerce.number().min(0, { message: "الكمية مطلوبة." }),
    status: z.enum(["نشط", "غير نشط"], { required_error: "الحالة مطلوبة." }),
    partnerLogo: z.string().optional(),
});

type VoucherFormValues = z.infer<typeof voucherFormSchema>;

const processRequestSchema = z.object({
    couponCode: z.string().min(4, { message: "كود القسيمة مطلوب." })
})
type ProcessRequestValues = z.infer<typeof processRequestSchema>;

interface VouchersClientProps {
    initialVouchers: Voucher[];
    initialRedemptions: VoucherRedemption[];
}

export function VouchersClient({ initialVouchers, initialRedemptions }: VouchersClientProps) {
    const [vouchers, setVouchers] = React.useState(initialVouchers)
    const [redemptions, setRedemptions] = React.useState(initialRedemptions)
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [editingVoucher, setEditingVoucher] = React.useState<Voucher | null>(null)
    const [voucherToDelete, setVoucherToDelete] = React.useState<Voucher | null>(null)
    const [requestToProcess, setRequestToProcess] = React.useState<VoucherRedemption | null>(null)
    const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
    const [requestToDelete, setRequestToDelete] = React.useState<VoucherRedemption | null>(null);

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast()
    const { t } = useLanguage()

    const voucherForm = useForm<VoucherFormValues>({
        resolver: zodResolver(voucherFormSchema),
        defaultValues: {
            partner: "",
            title: "",
            description: "",
            points: 0,
            quantity: 0,
            status: "نشط",
            partnerLogo: "",
        },
    });


    const processForm = useForm<ProcessRequestValues>({
        resolver: zodResolver(processRequestSchema)
    });
    React.useEffect(() => {
        if (isFormOpen) {
            if (editingVoucher) {
                voucherForm.reset({
                    partner: editingVoucher.PartnerName,
                    title: editingVoucher.Title,
                    description: editingVoucher.Description,
                    points: editingVoucher.PointsRequired,
                    quantity: editingVoucher.Quantity,
                    status: editingVoucher.Status,
                    partnerLogo: editingVoucher.PartnerLogoURL ?? ""
                });
                setLogoPreview(editingVoucher.PartnerLogoURL);
            } else {
                voucherForm.reset({
                    partner: "",
                    title: "",
                    description: "",
                    points: 0,
                    quantity: 0,
                    status: "نشط",
                    partnerLogo: ""
                });
                setLogoPreview(null);
            }
        }
    }, [isFormOpen, editingVoucher, voucherForm]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setLogoPreview(dataUrl);
                voucherForm.setValue("partnerLogo", dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVoucherFormSubmit = async (data: VoucherFormValues) => {
        const result = editingVoucher
            ? await updateVoucher(editingVoucher.VoucherID, data)
            : await addVoucher(data);

        if (result.success) {
            toast({ title: editingVoucher ? t('admin.vouchers.toast.updated') : t('admin.vouchers.toast.added') });
            window.location.reload();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsFormOpen(false);
        setEditingVoucher(null);
    };

    const handleDelete = async () => {
        if (!voucherToDelete) return;
        const result = await deleteVoucher(voucherToDelete.VoucherID);

        if (result.success) {
            toast({ title: t('admin.vouchers.toast.deleted'), variant: 'destructive' });
            setVouchers(vouchers.filter(v => v.VoucherID !== voucherToDelete.VoucherID));
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setVoucherToDelete(null);
    };
    const handleDeleteRequest = async () => {
        if (!requestToDelete) return;
        const result = await deleteVoucherRedemption(requestToDelete.RedemptionID);

        if (result.success) {
            toast({ title: "تم حذف طلب الاستبدال بنجاح", variant: 'destructive' });
            setRedemptions(redemptions.filter(r => r.RedemptionID !== requestToDelete.RedemptionID));
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setRequestToDelete(null);
    }

    const handleProcessRequestSubmit = async (data: ProcessRequestValues) => {
        if (!requestToProcess) return;
        setIsSubmitting(true);
        const result = await processVoucherRedemption(requestToProcess.RedemptionID, data.couponCode);

        if (result.success) {
            const message = `مرحباً ${requestToProcess.UserFullName}، تهانينا! هذا هو كود قسيمتك '${requestToProcess.VoucherTitle}' من ${requestToProcess.PartnerName}: ${data.couponCode}`;
            const whatsappUrl = `https://wa.me/${requestToProcess.UserPhone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            toast({ title: t('admin.vouchers.toast.processed_title'), description: t('admin.vouchers.toast.processed_desc') });
            setRedemptions(redemptions.map(r => r.RedemptionID === requestToProcess.RedemptionID ? { ...r, Status: 'مكتمل', CouponCode: data.couponCode } : r))
            setRequestToProcess(null);
            processForm.reset();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsSubmitting(false);
    }

    const statusTranslations: { [key: string]: string } = {
        'نشط': t('admin.vouchers.status.active'),
        'غير نشط': t('admin.vouchers.status.inactive'),
    }

    const redemptionStatusTranslations: { [key: string]: string } = {
        'قيد المراجعة': t('admin.vouchers.requests.status.pending'),
        'مكتمل': t('admin.vouchers.requests.status.completed'),
    }

    const getRedemptionStatusVariant = (status: string) => {
        switch (status) {
            case "مكتمل": return "default";
            default: return "secondary";
        }
    }

    return (
        <>
            <Tabs defaultValue="manage">
                <div className="flex justify-between items-center mb-6">
                    
                    <Button onClick={() => { setEditingVoucher(null); setIsFormOpen(true); }}>
                        <PlusCircle className="me-2 h-4 w-4" />
                        {t('admin.vouchers.add_new')}
                    </Button>
                    <TabsList>
                        <TabsTrigger value="requests">{t('admin.vouchers.tabs.requests')}</TabsTrigger>
                        <TabsTrigger value="manage">{t('admin.vouchers.tabs.manage')}</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="manage">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline"><Ticket /> {t('admin.vouchers.title')}</CardTitle>
                            <CardDescription>{t('admin.vouchers.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-primary hover:bg-primary">
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.vouchers.table.partner')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.vouchers.table.voucher')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.vouchers.table.points')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.vouchers.table.quantity')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('common.status')}</TableHead>
                                
                                            <TableHead className="text-center text-primary-foreground font-bold ">{t('common.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vouchers.map((v) => (
                                            <TableRow key={v.VoucherID}>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2 text-center">
                                                        <Image
                                                            src={v.PartnerLogoURL || "https://placehold.co/40x40.png"}
                                                            alt={v.PartnerName}
                                                            width={32}
                                                            height={32}
                                                            className="rounded-full"
                                                            data-ai-hint="company logo"
                                                        />
                                                        <span className="font-medium">{v.PartnerName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">{v.Title}</TableCell>
                                                <TableCell className="text-center font-mono">
                                                    {v.PointsRequired.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center font-mono">
                                                    {v.Quantity.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={v.Status === "نشط" ? "default" : "outline"}>
                                                        {statusTranslations[v.Status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditingVoucher(v);
                                                                setIsFormOpen(true);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => setVoucherToDelete(v)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="requests">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline"><ClipboardCheck /> {t('admin.vouchers.requests.title')}</CardTitle>
                            <CardDescription>{t('admin.vouchers.requests.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-primary hover:bg-primary">
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.vouchers.requests.table.user')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.vouchers.requests.table.voucher')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.vouchers.requests.table.date')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('common.status')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('رمز الاستبدال')}</TableHead>
                                            <TableHead className="text-center text-primary-foreground font-bold text-center">{t('common.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {redemptions.map((r) => (
                                            <TableRow key={r.RedemptionID}>
                                                <TableCell className="font-medium text-center">{r.UserFullName}</TableCell>
                                                <TableCell className="text-center">{r.VoucherTitle}</TableCell>
                                                <TableCell className="text-center">
                                                    {format(new Date(r.RequestDate), 'yyyy-MM-dd')}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={getRedemptionStatusVariant(r.Status)}>
                                                        {redemptionStatusTranslations[r.Status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center flex justify-center gap-2">
                                                    {r.Status === 'قيد المراجعة' ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setRequestToProcess(r)}
                                                        >
                                                            <ClipboardCheck className="me-2 h-4 w-4" />{' '}
                                                            {t('admin.vouchers.requests.action.process')}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                            {r.CouponCode}
                                                        </span>
                                                    )}

                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="destructive" size="icon" onClick={() => setRequestToDelete(r)}><Trash2 className="h-4 w-4" /></Button>

                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingVoucher ? t('admin.vouchers.dialog.edit_title') : t('admin.vouchers.dialog.add_title')}</DialogTitle>
                    </DialogHeader>
                    <Form {...voucherForm}>
                        <form onSubmit={voucherForm.handleSubmit(handleVoucherFormSubmit)} className="space-y-4">
                            <FormField control={voucherForm.control} name="partnerLogo" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.vouchers.form.logo')}</FormLabel>
                                    <div className="flex items-center gap-4">
                                        <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-2 text-center cursor-pointer hover:bg-muted/50 transition-colors h-24 w-24 flex items-center justify-center">
                                            <Input id="logo-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                                            {logoPreview ? (<Image src={logoPreview} alt={t('admin.vouchers.form.logo_preview')} layout="fill" className="rounded-md object-contain p-1" />)
                                                : (<div className="flex flex-col items-center justify-center space-y-1 text-muted-foreground"><Upload className="h-6 w-6" /><span className="text-xs">{t('admin.vouchers.form.upload_instruction')}</span></div>)}
                                        </div>
                                        <FormField control={voucherForm.control} name="partner" render={({ field }) => (
                                            <FormItem className="flex-grow"><FormLabel>{t('admin.vouchers.form.partner_name')}</FormLabel><FormControl><Input placeholder={t('admin.vouchers.form.partner_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div><FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={voucherForm.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.vouchers.form.voucher_title')}</FormLabel><FormControl><Input placeholder={t('admin.vouchers.form.title_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={voucherForm.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.vouchers.form.description')}</FormLabel><FormControl><Textarea placeholder={t('admin.vouchers.form.description_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={voucherForm.control} name="points" render={({ field }) => (
                                    <FormItem><FormLabel>{t('admin.vouchers.form.points')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={voucherForm.control} name="quantity" render={({ field }) => (
                                    <FormItem><FormLabel>{t('admin.vouchers.form.quantity')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={voucherForm.control} name="status" render={({ field }) => (
                                <FormItem><FormLabel>{t('common.status')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder={t('admin.vouchers.form.status_placeholder')} /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="نشط">{t('admin.vouchers.status.active')}</SelectItem>
                                            <SelectItem value="غير نشط">{t('admin.vouchers.status.inactive')}</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="submit">{t('common.save')}</Button>

                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>
                               
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!requestToProcess} onOpenChange={() => setRequestToProcess(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.vouchers.process_dialog.title')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.vouchers.process_dialog.description', {
                                voucherTitle: requestToProcess?.VoucherTitle,
                                userName: requestToProcess?.UserFullName
                            })}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...processForm}>
                        <form onSubmit={processForm.handleSubmit(handleProcessRequestSubmit)} className="space-y-4">
                            <FormField
                                control={processForm.control}
                                name="couponCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.vouchers.process_dialog.coupon_label')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('admin.vouchers.process_dialog.coupon_placeholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                 <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                                    {t('admin.vouchers.process_dialog.button')}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setRequestToProcess(null)}>{t('common.cancel')}</Button>

                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!voucherToDelete || !!requestToDelete} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setVoucherToDelete(null);
                    setRequestToDelete(null);
                }
            }}>                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {voucherToDelete ? t('admin.vouchers.confirm_delete', { title: voucherToDelete.Title }) : 'هل تريد حقًا حذف طلب الاستبدال هذا؟'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={voucherToDelete ? handleDelete : handleDeleteRequest} className="bg-destructive hover:bg-destructive/90">{t('common.confirm_delete')}</AlertDialogAction>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>

                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
