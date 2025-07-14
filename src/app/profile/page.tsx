
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

import { useSession } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

import { User, MapPin, Lock, Trash2, Save, LocateFixed, Palette, Sun, Moon, Laptop, Languages, Loader2 } from "lucide-react"
import { useLanguage } from "@/components/theme-provider"
import { getUserProfile, updateUserProfile, updateUserAddress, changeUserPassword, deleteUser } from "@/lib/actions/users.actions"
import { Skeleton } from "@/components/ui/skeleton"

export const revalidate = 0;

const InteractiveMap = dynamic(() => import('../register/interactive-map'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-muted flex items-center justify-center rounded-lg">
            <p>جاري تحميل الخريطة...</p>
        </div>
    )
})

const profileFormSchema = z.object({
    fullName: z.string().min(1, "الاسم الكامل مطلوب."),
    phone: z.string().regex(/^(70|71|73|77|78)\d{7}$/, { message: "يجب أن يكون رقم هاتف يمني صحيح." }),
    email: z.string().email({ message: "بريد إلكتروني غير صالح." }).optional().or(z.literal('')),
})

const addressFormSchema = z.object({
    address: z.string().min(10, { message: "عنوان المنزل التفصيلي مطلوب." }),
    landmark: z.string().optional(),
    coordinates: z.string().min(1, "الرجاء تحديد موقعك على الخريطة."),
})

const securityFormSchema = z.object({
    currentPassword: z.string().min(1, { message: "كلمة المرور الحالية مطلوبة." }),
    newPassword: z.string().min(8, { message: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل." }),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين.",
    path: ["confirmPassword"],
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type AddressFormValues = z.infer<typeof addressFormSchema>
type SecurityFormValues = z.infer<typeof securityFormSchema>

const ProfileSkeleton = () => (
    <Card>
        <CardHeader className="text-right">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-start gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex justify-start">
                <Skeleton className="h-10 w-28" />
            </div>
        </CardContent>
    </Card>
);

function ProfilePageContent() {
    const { toast } = useToast()
    const router = useRouter()
    const { currentUser, setCurrentUser, isLoading: isSessionLoading, logout } = useSession();

    const [location, setLocation] = React.useState<{ lat: number, lng: number } | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSubmitting, setIsSubmitting] = React.useState<string | null>(null)
    const { theme, setTheme } = useTheme()
    const { language, setLanguage, t } = useLanguage()

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: { fullName: "", phone: "", email: "" },
    })

    const addressForm = useForm<AddressFormValues>({
        resolver: zodResolver(addressFormSchema),
        defaultValues: { address: "", landmark: "", coordinates: "" },
    })

    const securityForm = useForm<SecurityFormValues>({
        resolver: zodResolver(securityFormSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
    })

    const memoizedProfileReset = React.useCallback((data: ProfileFormValues) => {
        profileForm.reset(data);
    }, [profileForm]);

    const memoizedAddressReset = React.useCallback((data: AddressFormValues) => {
        addressForm.reset(data);
    }, [addressForm]);

    React.useEffect(() => {
        if (isSessionLoading) return;
        if (!currentUser) {
            router.push('/login');
            return;
        }

        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const profileData = await getUserProfile(currentUser.id);
                if (profileData) {
                    memoizedProfileReset({
                        fullName: profileData.FullName,
                        phone: profileData.PhoneNumber,
                        email: profileData.Email || "",
                    });
                    memoizedAddressReset({
                        address: profileData.Address || "",
                        landmark: profileData.Landmark || "",
                        coordinates:
                            !isNaN(Number(profileData.Latitude)) && !isNaN(Number(profileData.Longitude))
                                ? `${Number(profileData.Latitude).toFixed(6)}, ${Number(profileData.Longitude).toFixed(6)}`
                                : "",

                    });
                    if (profileData.Latitude && profileData.Longitude) {
                        setLocation({ lat: profileData.Latitude, lng: profileData.Longitude });
                    }
                } else {
                    toast({ title: "خطأ", description: 'فشل تحميل بيانات الملف الشخصي.', variant: 'destructive' })
                }
            } catch (e) {
                toast({ title: t('common.error'), description: 'فشل تحميل بيانات الملف الشخصي.', variant: 'destructive' })
            } finally {
                setIsLoading(false)
            }
        }
        fetchProfile()
    }, [isSessionLoading, currentUser, router, toast, t, memoizedProfileReset, memoizedAddressReset])

    const handleLocationChange = React.useCallback((newLocation: { lat: number, lng: number }) => {
        setLocation(newLocation);
        addressForm.setValue('coordinates', `${newLocation.lat.toFixed(6)}, ${newLocation.lng.toFixed(6)}`, { shouldValidate: true });
    }, [addressForm])

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    handleLocationChange({ lat: latitude, lng: longitude })
                    toast({ title: t('profile.toast.location_set_title'), description: t('profile.toast.location_set_desc') });
                },
                () => toast({ title: t('profile.toast.location_error_title'), description: t('profile.toast.location_error_desc'), variant: "destructive" })
            );
        }
    }

    const handleLangChange = (selectedLang: 'ar' | 'en') => {
        setLanguage(selectedLang);
    };

    async function onProfileSubmit(data: ProfileFormValues) {
        if (!currentUser) return;
        setIsSubmitting("profile");
        const result = await updateUserProfile(currentUser.id, data);
        if (result.success) {
            toast({ title: "تم تحديث الملف الشخصي بنجاح!" });
            if (currentUser.name !== data.fullName) {
                const updatedUser = { ...currentUser, name: data.fullName };
                setCurrentUser(updatedUser);
            }
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsSubmitting(null);
    }

    async function onAddressSubmit(data: AddressFormValues) {
        if (!currentUser) return;
        setIsSubmitting("address");
        const result = await updateUserAddress(currentUser.id, data);
        if (result.success) {
            toast({ title: "تم تحديث العنوان بنجاح!" });
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsSubmitting(null);
    }

    async function onSecuritySubmit(data: SecurityFormValues) {
        if (!currentUser) return;
        setIsSubmitting("security");
        const result = await changeUserPassword(currentUser.id, data);
        if (result.success) {
            toast({ title: result.message });
            securityForm.reset();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsSubmitting(null);
    }

    async function onDeleteAccount() {
        if (!currentUser) return;
        setIsSubmitting("delete");
        const result = await deleteUser(currentUser.id);
        if (result.success) {
            toast({ title: "تم حذف الحساب بنجاح!", variant: "destructive" });
            logout();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsSubmitting(null);
    }

    const fullName = profileForm.watch("fullName");
    const initials = fullName ? fullName.split(" ").map(n => n[0]).join("").toUpperCase() : "";

    return (
        <div className="space-y-6">
            <CardHeader className="p-0 text-right">
                <CardTitle className="text-3xl font-headline">{t('profile.title')}</CardTitle>
                <CardDescription>{t('profile.description')}</CardDescription>
            </CardHeader>
            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                    <TabsTrigger value="profile" className="whitespace-normal"><User className="me-2" />{t('profile.tabs.profile')}</TabsTrigger>
                    <TabsTrigger value="address"><MapPin className="me-2" />{t('profile.tabs.address')}</TabsTrigger>
                    <TabsTrigger value="security"><Lock className="me-2" />{t('profile.tabs.security')}</TabsTrigger>
                    <TabsTrigger value="appearance"><Palette className="me-2" />{t('profile.tabs.appearance')}</TabsTrigger>
                    <TabsTrigger value="account" className="text-destructive"><Trash2 className="me-2" />{t('profile.tabs.account')}</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    {isLoading || isSessionLoading ? <ProfileSkeleton /> : (
                        <Card>
                            <CardHeader className="text-right">
                                <CardTitle>{t('profile.personal.title')}</CardTitle>
                                <CardDescription>{t('profile.personal.description')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...profileForm}>
                                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 text-right">
                                        <div className="flex items-center justify-start gap-4">
                                            <Avatar className="w-24 h-24 border-4 border-primary/20">
                                                <AvatarFallback className="text-4xl bg-muted">{initials}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <FormField control={profileForm.control} name="fullName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('profile.personal.full_name')}</FormLabel>
                                                <FormControl><Input placeholder={t('profile.personal.full_name')} {...field} className="text-right" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField control={profileForm.control} name="phone" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('profile.personal.phone')}</FormLabel>
                                                    <FormControl><Input type="tel" placeholder="77xxxxxxxx" {...field} dir="ltr" className="text-right" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={profileForm.control} name="email" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('profile.personal.email')}</FormLabel>
                                                    <FormControl><Input type="email" placeholder="m@example.com" {...field} className="text-right" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <div className="flex justify-start">
                                            <Button type="submit" disabled={isSubmitting === 'profile' || !currentUser}>
                                                {isSubmitting === 'profile' ? <Loader2 className="me-2 animate-spin" /> : <Save className="me-2" />}
                                                {t('profile.personal.save_button')}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="address" className="mt-6">
                    <Card>
                        <CardHeader className="text-right">
                            <CardTitle>{t('profile.address.title')}</CardTitle>
                            <CardDescription>{t('profile.address.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...addressForm}>
                                <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-6 text-right">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            <FormField control={addressForm.control} name="address" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('profile.address.address_details')}</FormLabel>
                                                    <FormControl><Textarea placeholder={t('profile.address.address_details')} className="min-h-[100px] text-right" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={addressForm.control} name="landmark" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('profile.address.landmark')}</FormLabel>
                                                    <FormControl><Input placeholder="e.g. Next to Rahman Mosque" {...field} className="text-right" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={addressForm.control} name="coordinates" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('profile.address.coordinates')}</FormLabel>
                                                    <FormControl><Input readOnly placeholder={t('profile.address.coordinates_placeholder')} {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <div className="relative min-h-[250px] md:min-h-full rounded-lg overflow-hidden border">
                                            {location && <InteractiveMap location={location} onLocationChange={handleLocationChange} />}
                                            <Button type="button" size="icon" variant="secondary" onClick={handleGetCurrentLocation} className="absolute top-2 end-2 z-10">
                                                <LocateFixed className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <Button type="submit" disabled={isSubmitting === 'address' || !currentUser}>
                                            {isSubmitting === 'address' ? <Loader2 className="me-2 animate-spin" /> : <Save className="me-2" />}
                                            {t('profile.address.save_button')}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    <Card>
                        <CardHeader className="text-right">
                            <CardTitle>{t('profile.security.title')}</CardTitle>
                            <CardDescription>{t('profile.security.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...securityForm}>
                                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6 max-w-md text-right">
                                    <FormField control={securityForm.control} name="currentPassword" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('profile.security.current_password')}</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input type="password" {...field} className="text-right" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={securityForm.control} name="newPassword" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('profile.security.new_password')}</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input type="password" {...field} className="text-right" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={securityForm.control} name="confirmPassword" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('profile.security.confirm_password')}</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input type="password" {...field} className="text-right" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="flex justify-start pt-2">
                                        <Button type="submit" disabled={isSubmitting === 'security' || !currentUser}>
                                            {isSubmitting === 'security' ? <Loader2 className="me-2 animate-spin" /> : <Save className="me-2" />}
                                            {t('profile.security.save_button')}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appearance" className="mt-6">
                    <Card>
                        <CardHeader className="text-right">
                            <CardTitle>{t('profile.appearance.title')}</CardTitle>
                            <CardDescription>{t('profile.appearance.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4 text-right">
                                <h3 className="font-semibold text-lg flex items-center gap-2 justify-end"><Palette />{t('profile.appearance.theme')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Button size="lg" variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}> <Sun className="me-2" /> {t('profile.appearance.light')} </Button>
                                    <Button size="lg" variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}> <Moon className="me-2" /> {t('profile.appearance.dark')} </Button>
                                    <Button size="lg" variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}> <Laptop className="me-2" /> {t('profile.appearance.system')} </Button>
                                </div>
                            </div>
                            <div className="space-y-4 text-right">
                                <h3 className="font-semibold text-lg flex items-center gap-2 justify-end"><Languages />{t('profile.appearance.language')}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button size="lg" variant={language === 'ar' ? 'default' : 'outline'} onClick={() => handleLangChange('ar')}> {t('profile.appearance.arabic')} </Button>
                                    <Button size="lg" variant={language === 'en' ? 'default' : 'outline'} onClick={() => handleLangChange('en')}> {t('profile.appearance.english')} </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">{t('profile.appearance.note')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="account" className="mt-6">
                    <Card className="border-destructive">
                        <CardHeader className="text-right">
                            <CardTitle className="text-destructive">{t('profile.account.title')}</CardTitle>
                            <CardDescription>{t('profile.account.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <div className="flex justify-start">
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={!currentUser || isSubmitting === 'delete'}>
                                            {isSubmitting === 'delete' ? <Loader2 className="me-2 animate-spin" /> : <Trash2 className="me-2" />}
                                            {t('profile.account.delete_button')}
                                        </Button>
                                    </AlertDialogTrigger>
                                </div>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t('profile.account.dialog_title')}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t('profile.account.dialog_description')}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t('profile.account.dialog_cancel')}</AlertDialogCancel>
                                        <AlertDialogAction onClick={onDeleteAccount} className="bg-destructive hover:bg-destructive/90">{t('profile.account.dialog_confirm')}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default function ProfilePage() {
    return (
        <ProfilePageContent />
    )
}

