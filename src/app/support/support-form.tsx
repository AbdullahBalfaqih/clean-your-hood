"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, User, Banknote, Upload, Clipboard, Send, Loader2 } from "lucide-react"
import { useLanguage } from "@/components/theme-provider"
import { addFinancialSupportSubmission, getBankAccounts, type BankAccount } from "@/lib/actions/financial.actions"
import { useSession } from "@/components/app-layout"

const supportFormSchema = z.object({
    donorName: z.string().min(3, { message: "الرجاء إدخال اسمك الكامل." }),
    amount: z.coerce.number().min(1, { message: "الرجاء إدخال المبلغ المدفوع." }),
    bank: z.string({ required_error: "يرجى تحديد البنك الذي تم التحويل إليه." }),
    receiptImage: z.string({ required_error: "إرفاق إيصال التحويل إلزامي." }),
})

type SupportFormValues = z.infer<typeof supportFormSchema>

export function SupportForm() {
    const { toast } = useToast()
    const { t } = useLanguage()
    const { currentUser } = useSession()
    const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
    const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    React.useEffect(() => {
        async function fetchBankAccounts() {
            const accounts = await getBankAccounts()
            setBankAccounts(accounts)
        }
        fetchBankAccounts()
    }, [])

    const form = useForm<SupportFormValues>({
        resolver: zodResolver(supportFormSchema),
        defaultValues: {
            donorName: "",
            amount: 0,
            bank: "",
            receiptImage: undefined,
        }
    })

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const dataUrl = reader.result as string
                setReceiptPreview(dataUrl)
                form.setValue("receiptImage", dataUrl, { shouldValidate: true })
            }
            reader.readAsDataURL(file)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast({ title: t('support.toast.copied_title'), description: t('support.toast.copied_desc') })
    }

    async function onSubmit(data: SupportFormValues) {
        if (!currentUser) {
            toast({
                title: "الرجاء تسجيل الدخول",
                description: "يجب أن تكون مسجلاً للدخول لتأكيد الدعم.",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        const result = await addFinancialSupportSubmission({ ...data, userId: currentUser.id })

        if (result.success) {
            toast({
                title: t('support.toast.success_title'),
                description: t('support.toast.success_desc'),
            })
            form.reset()
            setReceiptPreview(null)
        } else {
            toast({
                title: t('common.error'),
                description: result.message,
                variant: "destructive"
            })
        }
        setIsSubmitting(false)
    }

    return (
        <Card className="w-full">
            <CardHeader className="text-center">
                <DollarSign className="mx-auto h-12 w-12 text-primary" />
                <CardTitle className="text-3xl font-headline">{t('support.title')}</CardTitle>
                <CardDescription className="text-lg">
                    {t('support.description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold font-headline text-primary">{t('support.bank_accounts_title')}</h3>
                        <div className="space-y-3">
                            {bankAccounts.map(account => (
                                <Card key={account.BankAccountID} className="bg-muted/50">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold">{account.BankName}</p>
                                            <p className="text-sm">{account.AccountHolderName}</p>
                                            <p className="font-mono text-muted-foreground tracking-widest">{account.AccountNumber}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(account.AccountNumber)}>
                                            <Clipboard className="w-5 h-5" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground pt-4">{t('support.form_instructions')}</p>
                    </div>
                    <div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="donorName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><User className="w-4 h-4" /> {t('support.form.donor_name')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('support.form.donor_name_placeholder')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Banknote className="w-4 h-4" /> {t('support.form.amount_label')}</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="5000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bank"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Banknote className="w-4 h-4" /> {t('support.form.bank_label')}</FormLabel>
                                            <Select value={field.value || ""} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('support.form.bank_placeholder')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {bankAccounts.map(b => (
                                                        <SelectItem key={b.BankAccountID} value={b.BankName}>{b.BankName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="receiptImage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">{t('support.form.receipt_label')}</FormLabel>
                                            <FormControl>
                                                <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors h-40 flex items-center justify-center">
                                                    <Input
                                                        id="receipt-upload"
                                                        type="file"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={handleFileChange}
                                                        accept="image/*"
                                                    />
                                                    {receiptPreview ? (
                                                        <Image src={receiptPreview} alt={t('support.form.receipt_preview_alt')} layout="fill" className="rounded-md object-contain p-1" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                                                            <Upload className="h-8 w-8" />
                                                            <span>{t('support.form.upload_instruction')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" size="lg" className="w-full text-lg font-bold" disabled={isSubmitting || !currentUser}>
                                    {isSubmitting ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Send className="me-2 h-5 w-5" />}
                                    {t('support.form.submit_button')}
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
