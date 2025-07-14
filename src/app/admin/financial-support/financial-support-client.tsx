"use client"

import * as React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SheetTitle, Sheet, SheetContent, SheetDescription, SheetHeader, SheetFooter } from "@/components/ui/sheet"
import { Check, X, Eye, HandCoins, Trash2, Banknote } from "lucide-react"
import { useLanguage } from "@/components/theme-provider"
import { type FinancialSupportSubmission, updateFinancialSupportStatus, deleteFinancialSupportSubmission, getBankAccounts, type BankAccount } from "@/lib/actions/financial.actions"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankAccountsManager } from "./bank-accounts-manager"

interface FinancialSupportClientProps {
    initialSubmissions: FinancialSupportSubmission[];
    initialBankAccounts: BankAccount[];
}

export function FinancialSupportClient({ initialSubmissions, initialBankAccounts }: FinancialSupportClientProps) {
    const [submissions, setSubmissions] = React.useState(initialSubmissions);
    const [selectedSubmission, setSelectedSubmission] = React.useState<FinancialSupportSubmission | null>(null);
    const [submissionToDelete, setSubmissionToDelete] = React.useState<FinancialSupportSubmission | null>(null);
    const { t } = useLanguage()
    const { toast } = useToast()

    const handleUpdateStatus = async (id: number, newStatus: "مقبول" | "مرفوض") => {
        const result = await updateFinancialSupportStatus(id, newStatus);
        if (result.success) {
            toast({ title: "تم تحديث الحالة بنجاح" });
            setSubmissions(submissions.map(s => s.SupportID === id ? { ...s, Status: newStatus } : s));
            setSelectedSubmission(s => s ? { ...s, Status: newStatus } : null);
        } else {
            toast({ title: t('common.error'), description: result.message, variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!submissionToDelete) return;

        const result = await deleteFinancialSupportSubmission(submissionToDelete.SupportID);
        if (result.success) {
            toast({ title: "تم حذف طلب الدعم بنجاح", variant: "destructive" });
            setSubmissions(submissions.filter(s => s.SupportID !== submissionToDelete.SupportID));
            if (selectedSubmission?.SupportID === submissionToDelete.SupportID) {
                setSelectedSubmission(null);
            }
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setSubmissionToDelete(null);
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "مقبول": return "default";
            case "مرفوض": return "destructive";
            default: return "secondary";
        }
    };

    const statusTranslations: { [key: string]: string } = {
        "قيد المراجعة": t('support.status.in_review'),
        "مقبول": t('support.status.approved'),
        "مرفوض": t('support.status.rejected'),
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline"><HandCoins /> {t('admin.financial_support.title')}</CardTitle>
                    <CardDescription>
                        {t('admin.financial_support.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="requests">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="requests">طلبات الدعم</TabsTrigger>
                            <TabsTrigger value="accounts">إدارة الحسابات البنكية</TabsTrigger>
                        </TabsList>
                        <TabsContent value="requests" className="mt-4">
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-primary hover:bg-primary">
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.financial_support.table.id')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.financial_support.table.donor')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.financial_support.table.amount_bank')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('admin.financial_support.table.date')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold text-center">{t('common.status')}</TableHead>
                                            <TableHead className="text-center text-primary-foreground font-bold text-center">{t('common.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {submissions.map((sub) => (
                                            <TableRow key={sub.SupportID}>
                                                <TableCell className="font-mono text-center">{sub.SupportID}</TableCell>

                                                <TableCell className="font-medium text-center">{sub.FullName}</TableCell>

                                                <TableCell>
                                                    <div className="text-center">
                                                        <p className="font-bold">{t('support.amount_in_currency', { amount: sub.Amount.toLocaleString() })}</p>
                                                        <p className="text-sm text-muted-foreground">{sub.BankName}</p>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    {format(new Date(sub.SubmittedAt), 'yyyy-MM-dd')}
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <Badge variant={getStatusVariant(sub.Status) as any}>
                                                        {statusTranslations[sub.Status] || sub.Status}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(sub)}>
                                                        <Eye className="me-2 h-4 w-4" />
                                                        {t('common.view_details')}
                                                    </Button>
                                                </TableCell>

                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                        <TabsContent value="accounts" className="mt-4">
                            <BankAccountsManager initialBankAccounts={initialBankAccounts} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Sheet open={!!selectedSubmission} onOpenChange={(isOpen) => !isOpen && setSelectedSubmission(null)}>
                <SheetContent side="right" className="w-[400px] sm:w-[500px] flex flex-col">
                    {selectedSubmission && (
                        <>
                            <SheetHeader className="text-start">
                                <SheetTitle>{t('support.sheet.title', { id: selectedSubmission.SupportID })}</SheetTitle>
                                <SheetDescription>
                                    {t('support.sheet.sent_by', { donorName: selectedSubmission.FullName, date: format(new Date(selectedSubmission.SubmittedAt), 'yyyy-MM-dd') })}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-4 space-y-4 flex-grow overflow-y-auto">
                                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-2">
                                    <h4 className="font-semibold">{t('support.sheet.support_data')}</h4>
                                    <p className="text-sm text-muted-foreground">{t('support.sheet.donor')}: <span className="font-bold text-foreground">{selectedSubmission.FullName}</span></p>
                                    <p className="text-sm text-muted-foreground">{t('support.sheet.amount')}: <span className="font-bold text-foreground">{t('support.amount_in_currency', { amount: selectedSubmission.Amount.toLocaleString() })}</span></p>
                                    <p className="text-sm text-muted-foreground">{t('support.sheet.bank')}: <span className="font-bold text-foreground">{selectedSubmission.BankName}</span></p>
                                    <div className="text-sm text-muted-foreground">{t('support.sheet.status')}: <Badge variant={getStatusVariant(selectedSubmission.Status) as any}>{statusTranslations[selectedSubmission.Status] || selectedSubmission.Status}</Badge></div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold">{t('support.sheet.receipt')}</h4>
                                    <div className="relative aspect-[3/4] w-full border rounded-md overflow-hidden">
                                        {selectedSubmission.ReceiptURL ? (
                                            <Image
                                                src={selectedSubmission.ReceiptURL}
                                                alt="إيصال الدعم"
                                                layout="fill"
                                                className="object-contain"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full text-sm text-muted-foreground">
                                                {t('support.sheet.no_receipt') || "لا يوجد إيصال مرفق"}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                            <SheetFooter className="mt-auto">
                                <div className="w-full space-y-2">
                                    {selectedSubmission.Status === 'قيد المراجعة' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary" onClick={() => handleUpdateStatus(selectedSubmission.SupportID, "مقبول")}>
                                                <Check className="me-2 h-4 w-4" />
                                                {t('common.approve')}
                                            </Button>
                                            <Button variant="destructive" onClick={() => handleUpdateStatus(selectedSubmission.SupportID, "مرفوض")}>
                                                <X className="me-2 h-4 w-4" />
                                                {t('common.reject')}
                                            </Button>
                                        </div>
                                    )}
                                    <Button variant="destructive" className="w-full" onClick={() => setSubmissionToDelete(selectedSubmission)}>
                                        <Trash2 className="me-2 h-4 w-4" />
                                        {t('common.delete')}
                                    </Button>
                                </div>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!submissionToDelete} onOpenChange={(isOpen) => !isOpen && setSubmissionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل تريد حقًا حذف طلب الدعم رقم {submissionToDelete?.SupportID} من {submissionToDelete?.FullName}؟ لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{t('common.confirm_delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
