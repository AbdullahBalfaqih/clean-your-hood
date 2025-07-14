
"use client"

import * as React from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Award, Banknote, DollarSign, Gift, Star, Users, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/components/theme-provider"
import { type UserContribution, type UserBadge } from "@/lib/actions/points.actions"
import { addRedemptionRequest } from "@/lib/actions/redemptions.actions"
import { type Voucher, redeemVoucher } from "@/lib/actions/vouchers.actions"

const badges = [
    { id: "beginner_recycler", icon: Star, color: "text-accent" },
    { id: "plastic_free_pioneer", icon: Award, color: "text-blue-500" },
    { id: "compost_champion", icon: Star, color: "text-primary" },
    { id: "waste_warrior", icon: Award, color: "text-destructive" },
]

const banks = ["العمقي", "بن دول", "الكريمي", "البسيري", "القطيبي"]

const redeemFormSchema = z.object({
    bankName: z.string({ required_error: "يرجى تحديد البنك." }),
    accountNumber: z.string().regex(/^\d{10,20}$/, { message: "رقم الحساب يجب أن يكون بين 10 و 20 رقمًا." }),
    accountHolder: z.string().min(5, { message: "اسم صاحب الحساب مطلوب." }),
})

type RedeemFormValues = z.infer<typeof redeemFormSchema>

interface RewardsClientProps {
    leaderboard: UserContribution[],
    currentUserPoints: number,
    currentUserId: number,
    initialUserBadges: UserBadge[],
    vouchers: Voucher[],
}

export function RewardsClient({ leaderboard, currentUserPoints: initialPoints, currentUserId, initialUserBadges, vouchers }: RewardsClientProps) {
    const { toast } = useToast()
    const { t } = useLanguage()
    const [isRedeemDialogOpen, setIsRedeemDialogOpen] = React.useState(false)
    const [voucherToRedeem, setVoucherToRedeem] = React.useState<Voucher | null>(null)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [currentUserPoints, setCurrentUserPoints] = React.useState(initialPoints)

    const form = useForm<RedeemFormValues>({
        resolver: zodResolver(redeemFormSchema),
        defaultValues: {
            bankName: "",
            accountNumber: "",
            accountHolder: "",
        },
    })

    async function onRedeemSubmit(data: RedeemFormValues) {
        setIsSubmitting(true)
        const pointsToRedeem = currentUserPoints;
        const amount = pointsToRedeem * 2; // Conversion rate

        const result = await addRedemptionRequest({
            ...data,
            userId: currentUserId,
            points: pointsToRedeem,
            amount: amount,
        });

        if (result.success) {
            toast({
                title: t('rewards.redeem.toast.success_title'),
                description: t('rewards.redeem.toast.success_desc'),
            })
            setIsRedeemDialogOpen(false)
            form.reset()
            setCurrentUserPoints(0);
        } else {
            toast({
                title: t('common.error'),
                description: result.message,
                variant: 'destructive'
            })
        }
        setIsSubmitting(false)
    }

    const handleRedeemVoucher = async () => {
        if (!voucherToRedeem) return;
        setIsSubmitting(true);
        const result = await redeemVoucher(currentUserId, voucherToRedeem.VoucherID);
        if (result.success) {
            toast({ title: t('rewards.redeem.voucher_toast_success') });
            setCurrentUserPoints(prev => prev - voucherToRedeem.PointsRequired);
            // In a real app with more complex state management, we'd update voucher quantity too.
            // For now, an optimistic update of points is sufficient.
        } else {
            toast({ title: t('rewards.redeem.voucher_toast_fail'), description: result.message, variant: 'destructive' });
        }
        setIsSubmitting(false);
        setVoucherToRedeem(null);
    };

    const earnedBadgesToDisplay = React.useMemo(() => {
        return initialUserBadges.map(earnedBadge => {
            const details = badges.find(b => b.id === earnedBadge.BadgeName);
            if (!details) return null;
            return {
                ...details,
                translatedName: t(`badges.${details.id}`)
            };
        }).filter(Boolean);
    }, [initialUserBadges, t]);

    return (
        <>
            <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('rewards.stats.total_points')}</CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold font-headline text-primary">{currentUserPoints.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {t('rewards.stats.keep_it_up')}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="font-headline">{t('rewards.my_badges')}</CardTitle>
                            <CardDescription>
                                {t('rewards.badges_desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-4">
                            {earnedBadgesToDisplay.length > 0 ? (
                                earnedBadgesToDisplay.map(badge => (
                                    badge && (
                                        <div key={badge.id} className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50 w-24 text-center">
                                            <badge.icon className={`h-8 w-8 ${badge.color}`} />
                                            <span className="text-xs font-semibold">{badge.translatedName}</span>
                                        </div>
                                    )
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('rewards.badges_none')}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Banknote /> {t('rewards.redeem.title')}</CardTitle>
                            <CardDescription>
                                {t('rewards.redeem.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 border border-dashed rounded-lg text-center bg-muted/50">
                                <h3 className="text-2xl font-bold text-primary">{t('rewards.redeem.rate')}</h3>
                                <p className="text-muted-foreground mt-2">
                                    {t('rewards.redeem.rate_desc')}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">{t('rewards.redeem.how_it_works_title')}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {t('rewards.redeem.how_it_works_desc')}
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={() => setIsRedeemDialogOpen(true)} disabled={currentUserPoints <= 0}>
                                <DollarSign className="me-2 h-4 w-4" />
                                {t('rewards.redeem.redeem_button')}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><Gift /> {t('rewards.vouchers.title')}</CardTitle>
                            <CardDescription>
                                {t('rewards.vouchers.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4">
                            {vouchers.filter(v => v.Status === 'نشط' && v.Quantity > 0).length > 0 ? (
                                vouchers.filter(v => v.Status === 'نشط' && v.Quantity > 0).map(voucher => (
                                    <Card key={voucher.VoucherID} className="flex items-center p-3 gap-3 bg-muted/50">
                                        <Image
                                            src={voucher.PartnerLogoURL || "https://placehold.co/64x64.png"}
                                            alt={voucher.PartnerName}
                                            width={56}
                                            height={56}
                                            className="rounded-md border object-contain"
                                            data-ai-hint="company logo"
                                        />
                                        <div className="flex-grow">
                                            <p className="font-bold">{voucher.Title}</p>
                                            <p className="text-sm text-muted-foreground">{voucher.PartnerName}</p>
                                        </div>
                                        <div className="text-center px-4 shrink-0">
                                            <p className="font-bold text-xl text-primary">{voucher.PointsRequired.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">{t('rewards.vouchers.points_label')}</p>
                                        </div>
                                        <Button
                                            onClick={() => setVoucherToRedeem(voucher)}
                                            disabled={currentUserPoints < voucher.PointsRequired || isSubmitting}
                                            className="shrink-0"
                                        >
                                            {t('rewards.vouchers.redeem_button')}
                                        </Button>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground p-8 flex flex-col items-center justify-center h-full">
                                    <p>{t('rewards.vouchers.none_available')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Users /> {t('rewards.leaderboard.title')}</CardTitle>
                        <CardDescription>
                            {t('rewards.leaderboard.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">{t('rewards.leaderboard.rank')}</TableHead>
                                    <TableHead>{t('rewards.leaderboard.user')}</TableHead>
                                    <TableHead className="text-end">{t('rewards.leaderboard.points')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaderboard.map((user, index) => (
                                    <TableRow key={user.UserID} className={index === 0 ? 'bg-accent/20' : ''}>
                                        <TableCell className="font-medium text-lg">#{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{user.FullName.substring(0, 1)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.FullName}</span>
                                                {index === 0 && <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">{t('rewards.leaderboard.best')}</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-end font-semibold">{user.PointsBalance.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('rewards.redeem.dialog.title')}</DialogTitle>
                        <DialogDescription>
                            {t('rewards.redeem.dialog.description', { points: currentUserPoints.toLocaleString(), amount: (currentUserPoints * 2).toLocaleString() })}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onRedeemSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="accountHolder"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('rewards.redeem.form.account_holder')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('rewards.redeem.form.account_holder_placeholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('rewards.redeem.form.bank_name')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('rewards.redeem.form.bank_name_placeholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {banks.map((bank) => (
                                                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="accountNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('rewards.redeem.form.account_number')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Account number" {...field} dir="ltr" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsRedeemDialogOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                                    {t('rewards.redeem.form.confirm_button')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!voucherToRedeem} onOpenChange={(isOpen) => !isOpen && setVoucherToRedeem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('rewards.redeem.voucher_dialog_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('rewards.redeem.voucher_dialog_desc', {
                                points: voucherToRedeem?.PointsRequired.toLocaleString(),
                                title: voucherToRedeem?.Title
                            })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRedeemVoucher} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                            {t('common.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
