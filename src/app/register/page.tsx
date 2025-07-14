
"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { LeafRecycleIcon } from "@/components/icons"
import { AtSign, Lock, User, Phone, LocateFixed, Home, Building, MapPin, Send, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { registerUser } from "@/lib/actions/users.actions"

export const revalidate = 0;

const InteractiveMap = dynamic(() => import('./interactive-map'), {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-muted flex items-center justify-center">
        <p>جاري تحميل الخريطة...</p>
      </div>
    )
})

const registerFormSchema = z.object({
  fullName: z.string().min(2, { message: "الاسم الكامل مطلوب." }),
  phone: z.string().regex(/^(70|71|73|77|78)\d{7}$/, {
    message: "يجب أن يكون رقم هاتف يمني صحيح (9 أرقام يبدأ بـ 70, 71, 73, 77, أو 78).",
  }),
  password: z.string().min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." }),
  email: z.string().email({ message: "بريد إلكتروني غير صالح." }).optional().or(z.literal('')),
  coordinates: z.string().min(1, "الرجاء تحديد موقعك على الخريطة."),
  address: z.string().min(10, { message: "عنوان المنزل التفصيلي مطلوب." }),
  landmark: z.string().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "يجب الموافقة على شروط الاستخدام وسياسة الخصوصية." }),
  }),
})

type RegisterFormValues = z.infer<typeof registerFormSchema>

const termsContent = {
    title: "شروط الاستخدام",
    content: (
      <div className="space-y-4 text-foreground/90">
        <p className="leading-relaxed">
          مرحباً بك في "نظيف حيك". باستخدامك للتطبيق، فإنك توافق على هذه الشروط. يرجى قراءتها بعناية.
        </p>
        
        <h3 className="font-bold text-lg text-primary pt-2">1. استخدام الخدمة</h3>
        <p className="leading-relaxed">
          يجب عليك استخدام خدماتنا بشكل قانوني ومسؤول. لا يجوز لك إساءة استخدام خدماتنا، على سبيل المثال، عن طريق التدخل فيها أو محاولة الوصول إليها باستخدام طريقة أخرى غير الواجهة والتعليمات التي نقدمها.
        </p>
        
        <h3 className="font-bold text-lg text-primary pt-2">2. حسابك</h3>
        <p className="leading-relaxed">
          قد تحتاج إلى حساب "نظيف حيك" لاستخدام بعض خدماتنا. أنت مسؤول عن النشاط الذي يحدث على حسابك أو من خلاله، وعليك الحفاظ على أمان كلمة المرور الخاصة بك.
        </p>
        
        <h3 className="font-bold text-lg text-primary pt-2">3. المحتوى الخاص بك في خدماتنا</h3>
        <p className="leading-relaxed">
          تحتفظ بملكية أي حقوق ملكية فكرية تمتلكها في ذلك المحتوى. عندما تقوم بتحميل محتوى أو إرساله بطريقة أخرى إلى خدماتنا، فإنك تمنح "نظيف حيك" ترخيصًا عالميًا لاستخدام هذا المحتوى واستضافته وتخزينه وإعادة إنتاجه وتعديله.
        </p>
        
        <h3 className="font-bold text-lg text-primary pt-2">4. تعديل وإنهاء خدماتنا</h3>
        <p className="leading-relaxed">
          نحن نعمل باستمرار على تغيير خدماتنا وتحسينها. قد نضيف وظائف أو ميزات أو نزيلها، وقد نعلق خدمة أو نوقفها تمامًا.
        </p>
      </div>
    )
};

const privacyContent = {
    title: "سياسة الخصوصية",
    content: (
        <div className="space-y-4 text-foreground/90">
            <p className="leading-relaxed">
            تشرح سياسة الخصوصية هذه كيف نجمع معلوماتك الشخصية ونستخدمها ونكشف عنها عند استخدامك لتطبيق "نظيف حيك".
            </p>
            
            <h3 className="font-bold text-lg text-primary pt-2">1. المعلومات التي نجمعها</h3>
            <p className="leading-relaxed">
            نجمع المعلومات التي تقدمها مباشرة إلينا، مثل عندما تنشئ حسابًا، وتطلب جدولة رفع، أو تتواصل معنا. قد تشمل هذه المعلومات اسمك ورقم هاتفك وعنوانك وموقعك الجغرافي.
            </p>
            
            <h3 className="font-bold text-lg text-primary pt-2">2. كيف نستخدم معلوماتك</h3>
            <p className="leading-relaxed">نستخدم المعلومات التي نجمعها من أجل:</p>
            <ul className="list-disc pr-6 mt-2 space-y-2">
                <li>توفير خدماتنا وصيانتها وتحسينها.</li>
                <li>إرسال الإشعارات والتحديثات والرسائل الإدارية إليك.</li>
                <li>الرد على تعليقاتك وأسئلتك وطلباتك وتقديم خدمة العملاء.</li>
                <li>مراقبة وتحليل الاتجاهات والاستخدام والأنشطة المتعلقة بخدماتنا.</li>
            </ul>
            
            <h3 className="font-bold text-lg text-primary pt-2">3. مشاركة معلوماتك</h3>
            <p className="leading-relaxed">
            قد نشارك معلوماتك مع الأطراف الثالثة التي تقدم خدمات نيابة عنا، مثل السائقين المسؤولين عن جمع النفايات. نحن لا نشارك معلوماتك الشخصية مع أطراف ثالثة لأغراض التسويق الخاصة بهم.
            </p>
        </div>
    )
};


export default function RegisterPage() {
    const { toast } = useToast()
    const router = useRouter()
    const [location, setLocation] = React.useState<{lat: number, lng: number} | null>(null)
    const [isGpsLoading, setIsGpsLoading] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [policyContent, setPolicyContent] = React.useState<{title: string; content: React.ReactNode} | null>(null);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerFormSchema),
        defaultValues: {
            fullName: "",
            phone: "",
            password: "",
            email: "",
            coordinates: "",
            address: "",
            landmark: "",
            acceptTerms: false,
        },
    })
    
     React.useEffect(() => {
        if (!location) {
          setLocation({ lat: 15.939800, lng: 48.339600 });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    async function onSubmit(data: RegisterFormValues) {
        setIsSubmitting(true);

        // تأكد من أن البريد ليس null (لمنع خطأ قاعدة البيانات)
        const safeData = {
            ...data,
            email: data.email?.trim() || '',
        };

        const result = await registerUser(safeData);

        if (result.success && result.user) {
            toast({
                title: "نجاح التسجيل!",
                description: "تم إنشاء حسابك بنجاح. مرحباً بك في مجتمعنا!"
            });

            if (typeof window !== "undefined") {
                localStorage.setItem('currentUser', JSON.stringify({ name: result.user.name, id: result.user.id }));
            }

            router.push('/dashboard');
            router.refresh();
        } else {
            toast({
                title: "فشل التسجيل",
                description: result.message || "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
                variant: "destructive",
            });
        }

        setIsSubmitting(false);
    }

    const handleLocationChange = React.useCallback((newLocation: { lat: number, lng: number }) => {
        setLocation(newLocation);
        form.setValue('coordinates', `${newLocation.lat.toFixed(6)}, ${newLocation.lng.toFixed(6)}`, { shouldValidate: true });
    }, [form])

    const handleGetCurrentLocation = () => {
        setIsGpsLoading(true)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              handleLocationChange({ lat: latitude, lng: longitude })
              toast({ title: "تم تحديد الموقع", description: `تم تحديث الخريطة بموقعك الحالي.` });
              setIsGpsLoading(false)
            },
            (error) => {
              toast({ title: "خطأ في تحديد الموقع", description: "لا يمكن الوصول إلى موقعك. يرجى التحقق من أذونات المتصفح.", variant: "destructive" });
              setIsGpsLoading(false)
            }
          );
        } else {
            toast({ title: "غير مدعوم", description: "تحديد الموقع الجغرافي غير مدعوم في هذا المتصفح.", variant: "destructive" });
            setIsGpsLoading(false)
        }
    }

  return (
    <>
    <div className="flex min-h-screen w-full items-center justify-center bg-muted p-4 auth-bg">
      <Card className="mx-auto my-8 max-w-5xl w-full shadow-xl rounded-2xl overflow-hidden">
        <div className="grid md:grid-cols-2">
            <div className="p-6 sm:p-8 flex flex-col">
                <CardHeader className="p-0 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                         <Link href="/login" className="text-muted-foreground hover:text-primary">
                            <LeafRecycleIcon className="h-10 w-10 text-primary" />
                        </Link>
                        <div>
                            <CardTitle className="text-2xl sm:text-3xl font-bold font-headline text-primary">إنشاء حساب جديد</CardTitle>
                            <CardDescription className="text-base mt-1">
                                انضم إلينا للمساهمة في بيئة أنظف
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2">المعلومات الشخصية</h3>
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-primary font-semibold">الاسم الكامل</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input placeholder="مثال: خالد محمد" required className="pr-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-primary font-semibold">رقم الهاتف</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input type="tel" placeholder="77xxxxxxxx" required className="pr-10 text-left" dir="ltr" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-primary font-semibold">كلمة المرور</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input type="password" required className="pr-10" placeholder="••••••••" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-primary font-semibold">البريد الإلكتروني (اختياري)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <AtSign className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input type="email" placeholder="m@example.com" className="pr-10" {...field}/>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        <h3 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2 pt-4">العنوان والموقع</h3>
                         <FormField
                           control={form.control}
                           name="address"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel className="text-primary font-semibold">عنوان المنزل التفصيلي</FormLabel>
                               <FormControl>
                                 <div className="relative">
                                   <Home className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                   <Textarea placeholder="مثال: حي الياسمين، شارع الأمير محمد، عمارة رقم 15، الطابق الثاني" required className="pr-10" {...field} />
                                 </div>
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                         <FormField
                           control={form.control}
                           name="landmark"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel className="text-primary font-semibold">أقرب معلم (اختياري)</FormLabel>
                               <FormControl>
                                 <div className="relative">
                                   <Building className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                   <Textarea placeholder="مثال: بجوار مسجد الرحمن، مقابل سوبر ماركت المدينة" className="pr-10" {...field} />
                                 </div>
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                         <FormField
                           control={form.control}
                           name="coordinates"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel className="text-primary font-semibold">الإحداثيات</FormLabel>
                               <FormControl>
                                 <div className="relative">
                                   <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                   <Input readOnly placeholder="سيتم تحديدها من الخريطة" className="pr-10 bg-muted/70" {...field} />
                                 </div>
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                        <FormField
                            control={form.control}
                            name="acceptTerms"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 space-x-reverse !mt-6">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            أوافق على{" "}
                                            <span onClick={() => setPolicyContent(termsContent)} className="text-primary hover:underline cursor-pointer font-bold">
                                                شروط الاستخدام
                                            </span>{" "}
                                            و{" "}
                                            <span onClick={() => setPolicyContent(privacyContent)} className="text-primary hover:underline cursor-pointer font-bold">
                                                سياسة الخصوصية
                                            </span>
                                            .
                                        </FormLabel>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" size="lg" className="w-full !mt-8 text-lg font-bold bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Send className="ml-2 h-5 w-5" />}
                            إنشاء الحساب
                        </Button>
                    </form>
                  </Form>
                </CardContent>
                 <div className="mt-6 text-center text-sm">
                    هل لديك حساب بالفعل؟{" "}
                    <Link href="/login" className="font-bold text-primary hover:underline">
                    تسجيل الدخول
                    </Link>
                </div>
            </div>
            <div className="relative min-h-[400px] md:min-h-full">
                 <div className="h-full w-full bg-muted overflow-hidden">
                    <InteractiveMap location={location} onLocationChange={handleLocationChange} />
                </div>
                 <div className="absolute top-4 right-4 z-10 space-y-2">
                    <Button type="button" size="lg" variant="secondary" onClick={handleGetCurrentLocation} disabled={isGpsLoading}>
                        <LocateFixed className="ml-2 h-5 w-5" />
                        {isGpsLoading ? 'جاري التحديد...' : 'استخدم موقعي الحالي'}
                    </Button>
                </div>
                 <div className="absolute bottom-4 left-4 right-4 z-10 p-4 bg-background/80 backdrop-blur-sm rounded-lg shadow-lg">
                    <h4 className="font-bold text-lg font-headline text-primary">حدد موقع منزلك بدقة</h4>
                    <p className="text-muted-foreground text-sm">حرك الدبوس مباشرة فوق موقع منزلك على الخريطة لتسهيل عملية جمع النفايات.</p>
                </div>
            </div>
        </div>
      </Card>
    </div>
    <Dialog open={!!policyContent} onOpenChange={(isOpen) => !isOpen && setPolicyContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col text-right">
            <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-2xl font-headline text-primary">{policyContent?.title}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto py-4 pr-2 -mr-2 text-base text-right leading-relaxed">
                {policyContent?.content}
            </div>
            <DialogFooter className="mt-auto pt-4 border-t">
                <DialogClose asChild>
                <Button type="button">إغلاق</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  </>
  )
}
