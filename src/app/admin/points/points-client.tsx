

"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Award, Coins, MinusCircle, PlusCircle, Badge as BadgeIcon, Search, Loader2, Shield, Star, ShieldQuestion, ShieldX, Home } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { type UserContribution, grantPoints, deductPoints, grantBadge, updatePointSettings, type PointSettings, revokeUserBadge, type UserBadge } from "@/lib/actions/points.actions"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const pointActionSchema = z.object({
    points: z.coerce.number().min(1, { message: "النقاط مطلوبة." }),
    reason: z.string().optional(),
})
type PointActionValues = z.infer<typeof pointActionSchema>;

const badgeActionSchema = z.object({
    badgeId: z.string({ required_error: "يجب اختيار شارة." }),
})
type BadgeActionValues = z.infer<typeof badgeActionSchema>;

const badgeDetailsMap: { [key: string]: { icon: React.ElementType, color: string } } = {
    'beginner_recycler': { icon: Star, color: 'text-amber-500' },
    'plastic_free_pioneer': { icon: Award, color: 'text-blue-500' },
    'compost_champion': { icon: Star, color: 'text-green-600' },
    'waste_warrior': { icon: Shield, color: 'text-red-600' },
};

const availableBadges = [
    { id: '1', name: 'beginner_recycler' },
    { id: '2', name: 'plastic_free_pioneer' },
    { id: '3', name: 'compost_champion' },
    { id: '4', name: 'waste_warrior' },
];

export function PointsClient({ initialUsers, initialSettings }: { initialUsers: UserContribution[], initialSettings: PointSettings }) {
    const [users, setUsers] = React.useState(initialUsers);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedUser, setSelectedUser] = React.useState<UserContribution | null>(null);
    const [dialogType, setDialogType] = React.useState<'grant' | 'deduct' | 'badge' | null>(null);
    const [manageBadgesUser, setManageBadgesUser] = React.useState<UserContribution | null>(null);
    const [settings, setSettings] = React.useState(initialSettings);
    const [isSavingSettings, setIsSavingSettings] = React.useState(false);

    const { toast } = useToast();
    const { t } = useLanguage();

    const pointForm = useForm<PointActionValues>({ resolver: zodResolver(pointActionSchema) });
    const badgeForm = useForm<BadgeActionValues>({ resolver: zodResolver(badgeActionSchema) });

    const openDialog = (user: UserContribution, type: 'grant' | 'deduct' | 'badge') => {
        setSelectedUser(user);
        setDialogType(type);
        if (type === 'grant' || type === 'deduct') {
            pointForm.reset({ points: 0, reason: "" });
        } else {
            badgeForm.reset({ badgeId: undefined });
        }
    };

    const handlePointSubmit = async (data: PointActionValues) => {
        if (!selectedUser) return;

        const result = dialogType === 'grant'
            ? await grantPoints(selectedUser.UserID, data.points, data.reason)
            : await deductPoints(selectedUser.UserID, data.points, data.reason);

        if (result.success) {
            const actionT = t(dialogType === 'grant' ? 'admin.points.toast.action.added' : 'admin.points.toast.action.deducted');
            const prepositionT = t(dialogType === 'grant' ? 'admin.points.toast.preposition.to' : 'admin.points.toast.preposition.from');
            toast({
                title: dialogType === 'grant' ? t('admin.points.toast.granted') : t('admin.points.toast.deducted'),
                description: t('admin.points.toast.desc', { action: actionT, points: data.points, preposition: prepositionT, name: selectedUser.FullName })
            });
            window.location.reload();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setDialogType(null);
    };

    const handleBadgeSubmit = async (data: BadgeActionValues) => {
        if (!selectedUser) return;
        const result = await grantBadge(selectedUser.UserID, data.badgeId);
        const badgeInfo = availableBadges.find(b => b.id === data.badgeId);

        if (result.success) {
            toast({
                title: t('admin.points.toast.badge_granted'),
                description: t('admin.points.toast.badge_granted_desc', { badgeName: t(`badges.${badgeInfo?.name || ''}`), userName: selectedUser.FullName })
            });
            window.location.reload();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setDialogType(null);
    };

    const handleRevokeBadge = async (userId: number, badgeId: number) => {
        const result = await revokeUserBadge(userId, badgeId);
        if (result.success) {
            toast({ title: "تم سحب الشارة بنجاح" });
            const updatedUsers = users.map(user =>
                user.UserID === userId
                    ? { ...user, Badges: user.Badges.filter(b => b.BadgeID !== badgeId) }
                    : user
            );
            setUsers(updatedUsers);

            if (manageBadgesUser) {
                setManageBadgesUser({
                    ...manageBadgesUser,
                    Badges: manageBadgesUser.Badges.filter(b => b.BadgeID !== badgeId)
                });
            }
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
    };

    const handleSettingsChange = (key: keyof PointSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        const result = await updatePointSettings(settings);
        if (result.success) {
            toast({ title: "تم حفظ الإعدادات بنجاح" });
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsSavingSettings(false);
    };

    const filteredUsers = users.filter(u =>
        u.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(u.HouseNumber).includes(searchTerm)
    );

    const translatedBadges = availableBadges.map(b => ({ ...b, translatedName: t(`badges.${b.name}`) }));

    return (
        <>
            <div className="grid gap-6">
                <Card>
                    <CardHeader className="text-right flex flex-col items-end space-y-2">
                        <CardTitle className="font-headline text-3xl text-primary flex items-center gap-3">
                            <Award /> {t('admin.points.title')}
                        </CardTitle>
                        <CardDescription className="text-right">{t('admin.points.description')}</CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="text-right">
                            <CardTitle className="flex items-center justify-end gap-2"><Coins />{t('admin.points.settings.title')}</CardTitle>
                            <CardDescription>{t('admin.points.settings.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 text-right">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <Switch id="auto-points" checked={settings.autoGrantEnabled} onCheckedChange={(checked) => handleSettingsChange('autoGrantEnabled', checked)} dir="rtl" />
                                <Label htmlFor="auto-points" className="font-semibold">{t('admin.points.settings.enable_auto')}</Label>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold border-b pb-2">{t('admin.points.settings.rules_title')}</h3>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">{t('admin.points.settings.rule.recycling')}</Label>
                                    <Input type="number" value={settings.recyclingPerKg} onChange={(e) => handleSettingsChange('recyclingPerKg', parseInt(e.target.value, 10) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">{t('admin.points.settings.rule.organic')}</Label>
                                    <Input type="number" value={settings.organicPerKg} onChange={(e) => handleSettingsChange('organicPerKg', parseInt(e.target.value, 10) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">{t('admin.points.settings.rule.donation')}</Label>
                                    <Input type="number" value={settings.donationPerPiece} onChange={(e) => handleSettingsChange('donationPerPiece', parseInt(e.target.value, 10) || 0)} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleSaveSettings} disabled={isSavingSettings}>
                                {isSavingSettings && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
                                {t('admin.points.settings.save')}
                            </Button>
                        </CardFooter>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader className="text-right">
                            <div className="flex justify-between items-center">
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder={t('admin.points.search_placeholder')} className="pe-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <CardTitle>{t('admin.points.users_log')}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-primary hover:bg-primary">
                                            <TableHead className="text-right text-primary-foreground">{t('admin.points.table.user')}</TableHead>
                                            <TableHead className="text-right text-primary-foreground">{t('admin.points.table.last_contribution')}</TableHead>
                                            <TableHead className="text-right text-primary-foreground">{t('admin.points.table.points')}</TableHead>
                                            <TableHead className="text-center text-primary-foreground">{t('common.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user.UserID}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar><AvatarFallback>{user.FullName.substring(0, 1)}</AvatarFallback></Avatar>
                                                        <div>
                                                            <p className="font-bold text-base">{user.FullName}</p>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><Home className="w-3 h-3" /> #{user.HouseNumber}</p>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                {user.Badges.length > 0 && user.Badges.map(badge => {
                                                                    const details = badgeDetailsMap[badge.BadgeName];
                                                                    if (!details) return null;
                                                                    const BadgeDisplayIcon = details.icon;
                                                                    return (
                                                                        <TooltipProvider key={badge.BadgeID}>
                                                                            <Tooltip>
                                                                                <TooltipTrigger>
                                                                                    <BadgeDisplayIcon className={`h-5 w-5 ${details.color}`} />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>{t(`badges.${badge.BadgeName}`)}</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p>{user.LastContributionType}</p>
                                                    <p className="text-sm text-muted-foreground">{user.LastContributionDate}</p>
                                                </TableCell>
                                                <TableCell className="font-bold font-mono text-xl text-primary">{user.PointsBalance.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 justify-center flex-wrap">
                                                        <Button variant="outline" size="sm" onClick={() => openDialog(user, 'grant')}><PlusCircle className="ms-1 h-3.5 w-3.5" />{t('admin.points.action.grant')}</Button>
                                                        <Button variant="outline" size="sm" onClick={() => openDialog(user, 'deduct')}><MinusCircle className="ms-1 h-3.5 w-3.5" />{t('admin.points.action.deduct')}</Button>
                                                        <Button variant="outline" size="sm" onClick={() => openDialog(user, 'badge')}><BadgeIcon className="ms-1 h-3.5 w-3.5" />{t('admin.points.action.grant_badge')}</Button>
                                                        <Button variant="outline" size="sm" onClick={() => setManageBadgesUser(user)}><ShieldQuestion className="ms-1 h-3.5 w-3.5" />{t('admin.points.manage_badges')}</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={!!dialogType} onOpenChange={(isOpen) => !isOpen && setDialogType(null)}>
                <DialogContent>
                    <DialogHeader className="text-right">
                        <DialogTitle>
                            {dialogType === 'grant' && t('admin.points.dialog.grant_title', { name: selectedUser?.FullName })}
                            {dialogType === 'deduct' && t('admin.points.dialog.deduct_title', { name: selectedUser?.FullName })}
                            {dialogType === 'badge' && t('admin.points.dialog.badge_title', { name: selectedUser?.FullName })}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogType === 'grant' && t('admin.points.dialog.grant_desc')}
                            {dialogType === 'deduct' && t('admin.points.dialog.deduct_desc')}
                            {dialogType === 'badge' && t('admin.points.dialog.badge_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    {dialogType === 'grant' || dialogType === 'deduct' ? (
                        <Form {...pointForm}>
                            <form onSubmit={pointForm.handleSubmit(handlePointSubmit)} className="space-y-4 text-right">
                                <FormField control={pointForm.control} name="points" render={({ field }) => (
                                    <FormItem><FormLabel>{t('admin.points.form.points_label')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={pointForm.control} name="reason" render={({ field }) => (
                                    <FormItem><FormLabel>{t('admin.points.form.reason_label')}</FormLabel><FormControl><Textarea placeholder={t('admin.points.form.reason_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDialogType(null)}>{t('common.cancel')}</Button>
                                    <Button type="submit">{dialogType === 'grant' ? t('admin.points.confirm_grant') : t('admin.points.confirm_deduct')}</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    ) : (
                        <Form {...badgeForm}>
                            <form onSubmit={badgeForm.handleSubmit(handleBadgeSubmit)} className="space-y-4 text-right">
                                <FormField control={badgeForm.control} name="badgeId" render={({ field }) => (
                                    <FormItem><FormLabel>{t('admin.points.form.badges_label')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder={t('admin.points.form.badge_placeholder')} /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {translatedBadges.map(badge => (
                                                    <SelectItem key={badge.id} value={badge.id}>{badge.translatedName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select><FormMessage />
                                    </FormItem>
                                )} />
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDialogType(null)}>{t('common.cancel')}</Button>
                                    <Button type="submit">{t('admin.points.confirm_grant_badge')}</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!manageBadgesUser} onOpenChange={(isOpen) => !isOpen && setManageBadgesUser(null)}>
                <DialogContent>
                    <DialogHeader className="text-right">
                        <DialogTitle>{t('admin.points.dialog.manage_badges_title', { name: manageBadgesUser?.FullName })}</DialogTitle>
                        <DialogDescription>{t('admin.points.dialog.manage_badges_desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        {manageBadgesUser?.Badges && manageBadgesUser.Badges.length > 0 ? (
                            manageBadgesUser.Badges.map(badge => {
                                if (!badge.BadgeName) return null; // Defensive check
                                const details = badgeDetailsMap[badge.BadgeName];
                                const BadgeDisplayIcon = details?.icon || ShieldQuestion;
                                const translatedBadgeName = t(`badges.${badge.BadgeName}`);

                                return (
                                    <div key={badge.BadgeID} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <ShieldX className="ms-2 h-4 w-4" />
                                                    {t('admin.points.revoke_badge')}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader className="text-right">
                                                    <AlertDialogTitle>{t('admin.points.confirm_revoke')}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {t('admin.points.confirm_revoke_desc', { badgeName: translatedBadgeName })}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRevokeBadge(manageBadgesUser.UserID, badge.BadgeID)}>{t('common.confirm_delete')}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold">{translatedBadgeName}</span>
                                            <BadgeDisplayIcon className={`h-6 w-6 ${details?.color || 'text-muted-foreground'}`} />
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-center text-muted-foreground py-4">{t('admin.points.no_badges_to_manage')}</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
