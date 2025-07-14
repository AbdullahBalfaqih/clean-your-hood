"use client"

import * as React from "react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Banknote, Copy, Trash2 } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { type RedemptionRequest, updateRedemptionStatus, deleteRedemptionRequest } from "@/lib/actions/redemptions.actions"
import { format } from "date-fns"

export function RedemptionsClient({ initialRequests }: { initialRequests: RedemptionRequest[] }) {
    const [requests, setRequests] = React.useState(initialRequests)
    const [action, setAction] = React.useState<{ type: 'approve' | 'deny', id: number } | null>(null)
    const [requestToDelete, setRequestToDelete] = React.useState<RedemptionRequest | null>(null);
    const { t } = useLanguage()
    const { toast } = useToast()

    const handleUpdateStatus = async () => {
        if (!action) return

        const newStatus = action.type === 'approve' ? "مكتمل" : "ملغي"
        const result = await updateRedemptionStatus(action.id, newStatus)
        const request = requests.find(r => r.RedemptionID === action.id)

        if (result.success) {
            setRequests(requests.map(r => r.RedemptionID === action.id ? { ...r, Status: newStatus } : r))
            toast({
                title: t('admin.redemptions.toast.title', { status: newStatus === 'مكتمل' ? t('common.approved') : t('common.rejected') }),
                description: t('admin.redemptions.toast.description', { user: request?.FullName || 'المستخدم' }),
            })
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' })
        }
        setAction(null)
    }

    const handleDeleteRequest = async () => {
        if (!requestToDelete) return;

        const result = await deleteRedemptionRequest(requestToDelete.RedemptionID);
        if (result.success) {
            toast({ title: "تم حذف طلب الاستبدال", variant: "destructive" });
            setRequests(requests.filter(r => r.RedemptionID !== requestToDelete.RedemptionID));
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setRequestToDelete(null);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: t('admin.redemptions.toast.copied') });
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "مكتمل": return "default"
            case "ملغي": return "destructive"
            default: return "secondary"
        }
    }

    const statusTranslations = {
        "قيد التنفيذ": t('admin.redemptions.status.pending'),
        "مكتمل": t('admin.redemptions.status.completed'),
        "ملغي": t('admin.redemptions.status.cancelled'),
    }

    const getConfirmationMessage = () => {
        if (!action) return ""
        const request = requests.find(r => r.RedemptionID === action.id);
        if (!request) return ""

        switch (action.type) {
            case 'approve': return t('admin.redemptions.confirm.approve', { user: request.FullName, points: request.PointsRedeemed.toLocaleString() })
            case 'deny': return t('admin.redemptions.confirm.deny', { user: request.FullName })
            default: return ""
        }
    }

    return (
        <AlertDialog>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline"><Banknote /> {t('admin.redemptions.title')}</CardTitle>
                    <CardDescription>
                        {t('admin.redemptions.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-primary hover:bg-primary">
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.redemptions.table.request')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.redemptions.table.points_amount')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.redemptions.table.bank_details')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('common.status')}</TableHead>
                                    <TableHead className="text-center text-primary-foreground font-bold">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.RedemptionID}>
                                        <TableCell>
                                            <div className="font-medium">{request.FullName}</div>
                                            <div className="text-sm text-muted-foreground font-mono">
                                                {format(new Date(request.RequestDate), 'yyyy-MM-dd, HH:mm')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-bold">{t('admin.redemptions.points', { count: request.PointsRedeemed.toLocaleString() })}</p>
                                            <p className="text-sm text-muted-foreground">{t('admin.redemptions.equivalent_to', { amount: request.Amount.toLocaleString() })}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">{request.BankName} - {request.AccountHolder}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono text-muted-foreground">{request.AccountNumber}</p>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(request.AccountNumber)}>
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(request.Status) as any}>
                                                {statusTranslations[request.Status as keyof typeof statusTranslations] || request.Status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex gap-2 justify-center">
                                                {request.Status === "قيد التنفيذ" && (
                                                    <>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="outline" size="icon" className="text-primary border-primary hover:bg-primary/10 hover:text-primary" onClick={() => setAction({ type: 'approve', id: request.RedemptionID })}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon" onClick={() => setAction({ type: 'deny', id: request.RedemptionID })}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                    </>
                                                )}
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" onClick={() => setRequestToDelete(request)}>
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

            {action && (
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.confirm_action')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {getConfirmationMessage()}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAction(null)}>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdateStatus} className={action?.type === 'deny' ? 'bg-destructive hover:bg-destructive/90' : ''}>{t('common.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            )}

            {requestToDelete && (
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل تريد حقًا حذف طلب الاستبدال الخاص بـ {requestToDelete?.FullName}؟ لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRequestToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRequest} className="bg-destructive hover:bg-destructive/90">{t('common.confirm_delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            )}
        </AlertDialog>
    )
}
