"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Check, X, Truck, Gift, Trash2 } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/components/theme-provider"
import { type Donation, updateDonationStatus, deleteDonation } from "@/lib/actions/donations.actions"
import { useToast } from "@/hooks/use-toast"

export function DonationsClient({ initialDonations }: { initialDonations: Donation[] }) {
    const [donations, setDonations] = React.useState(initialDonations)
    const [action, setAction] = React.useState<{ type: 'accept' | 'reject' | 'dispatch' | 'delete', id: number } | null>(null);
    const { t } = useLanguage()
    const { toast } = useToast()

    const handleConfirmAction = async () => {
        if (!action) return;

        if (action.type === 'delete') {
            const result = await deleteDonation(action.id);
            if (result.success) {
                toast({ title: "تم حذف طلب التبرع بنجاح", variant: "destructive" });
                setDonations(donations.filter(d => d.DonationID !== action.id));
            } else {
                toast({ title: t('common.error'), description: result.message, variant: "destructive" });
            }
        } else {
            let newStatus = "";
            if (action.type === 'accept') newStatus = "مقبول";
            if (action.type === 'reject') newStatus = "مرفوض";
            if (action.type === 'dispatch') newStatus = "تم الاستلام";

            const result = await updateDonationStatus(action.id, newStatus);
            if (result.success) {
                toast({ title: "تم تحديث الحالة بنجاح" });
                setDonations(donations.map(d => d.DonationID === action.id ? { ...d, Status: newStatus } : d));
            } else {
                toast({ title: "خطأ", description: result.message, variant: "destructive" });
            }
        }
        setAction(null);
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "مقبول":
                return "default"
            case "تم الاستلام":
                return "secondary"
            case "مرفوض":
                return "destructive"
            default:
                return "outline"
        }
    }

    const statusTranslations: { [key: string]: string } = {
        "معلق": t('donations.status.pending'),
        "مقبول": t('donations.status.approved'),
        "تم الاستلام": t('donations.status.received'),
        "مرفوض": t('donations.status.rejected'),
    };

    const typeTranslations: { [key: string]: string } = {
        "نسائي": t('donations.type.female'),
        "أطفال": t('donations.type.kids'),
        "رجالي": t('donations.type.male'),
        "مختلط": t('donations.type.mixed'),
    };

    const conditionTranslations: { [key: string]: string } = {
        "جديدة": t('donations.condition.new'),
        "مستخدمة (بحالة جيدة)": t('donations.condition.used_good'),
    };


    const getConfirmationDialogDetails = () => {
        if (!action) return { title: "", description: "", confirmText: "" };
        const donation = donations.find(d => d.DonationID === action.id);
        if (!donation) return { title: "", description: "", confirmText: "" };

        switch (action.type) {
            case 'accept': return { title: t('common.confirm_action'), description: t('donations.confirm.approve', { id: donation.DonationID, user: donation.FullName }), confirmText: t('common.confirm') }
            case 'reject': return { title: t('common.confirm_action'), description: t('donations.confirm.reject', { id: donation.DonationID, user: donation.FullName }), confirmText: t('common.confirm') }
            case 'dispatch': return { title: t('common.confirm_action'), description: t('donations.confirm.dispatch', { id: donation.DonationID }), confirmText: t('common.confirm') }
            case 'delete': return { title: t('common.are_you_sure'), description: `هل تريد حقاً حذف طلب التبرع رقم ${donation.DonationID} من ${donation.FullName}؟ لا يمكن التراجع عن هذا الإجراء.`, confirmText: t('common.confirm_delete') }
            default: return { title: "", description: "", confirmText: "" }
        }
    }

    const dialogDetails = getConfirmationDialogDetails();

    return (
        <AlertDialog open={!!action} onOpenChange={(isOpen) => !isOpen && setAction(null)}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift />{t('admin.donations.title')}</CardTitle>
                    <CardDescription>
                        {t('admin.donations.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-primary hover:bg-primary">
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.donations.table.id')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.donations.table.donor')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.donations.table.type_condition')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.donations.table.quantity')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('common.status')}</TableHead>
                                    <TableHead className="text-center text-primary-foreground font-bold">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {donations.map((donation) => (
                                    <TableRow key={donation.DonationID}>
                                        <TableCell className="font-mono">{donation.DonationID}</TableCell>
                                        <TableCell className="font-medium">{donation.FullName}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p>{typeTranslations[donation.ClothingType] || donation.ClothingType}</p>
                                                <p className="text-sm text-muted-foreground">{conditionTranslations[donation.Condition] || donation.Condition}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{t('donations.quantity_piece', { quantity: donation.Quantity })}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(donation.Status) as any}>
                                                {statusTranslations[donation.Status] || donation.Status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex gap-2 justify-center">
                                                {donation.Status === "معلق" && (
                                                    <>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="outline" size="icon" className="text-primary border-primary hover:bg-primary/10 hover:text-primary" onClick={() => setAction({ type: 'accept', id: donation.DonationID })}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon" onClick={() => setAction({ type: 'reject', id: donation.DonationID })}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                    </>
                                                )}
                                                {donation.Status === "مقبول" && (
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="secondary" size="sm" onClick={() => setAction({ type: 'dispatch', id: donation.DonationID })}>
                                                            <Truck className="me-2 h-4 w-4" />
                                                            {t('donations.action.dispatch')}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                )}
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" onClick={() => setAction({ type: 'delete', id: donation.DonationID })}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{dialogDetails.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dialogDetails.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setAction(null)}>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmAction} className={action?.type === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}>{dialogDetails.confirmText}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
