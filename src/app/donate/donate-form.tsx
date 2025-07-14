"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from "next/image"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Shirt, Sparkles, Package, MapPin, NotebookText, HeartHandshake, Send, Loader2, Info } from "lucide-react"
import { useLanguage } from "@/components/theme-provider"
import { addDonation } from "@/lib/actions/donations.actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import pic1 from '@/app/images/24.jpg';
import { getUserProfile } from "@/lib/actions/users.actions"
import { useSession } from "@/components/app-layout"

const donateFormSchema = z.object({
    clothingType: z.string({
        required_error: "يرجى تحديد نوع الملابس.",
    }),
    condition: z.string({
        required_error: "يرجى تحديد حالة الملابس.",
    }),
    quantity: z.coerce.number().min(1, { message: "الرجاء إدخال الكمية." }),
    pickupAddress: z.string().min(10, { message: "يرجى إدخال عنوان واضح للرفع." }),
    notes: z.string().max(200, {
        message: "الملاحظات يجب ألا تزيد عن 200 حرف.",
    }).optional(),
})

type DonateFormValues = z.infer<typeof donateFormSchema>

export function DonateForm() {
    const { toast } = useToast()
    const { t } = useLanguage()
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // ✅ هذه هي التي كانت في المكان الغلط، وضعناها الآن داخل الكمبوننت
    const { currentUser } = useSession();

    const form = useForm<DonateFormValues>({
        resolver: zodResolver(donateFormSchema),
        defaultValues: { notes: "", quantity: 1, clothingType: "مختلط", condition: "مستخدمة (بحالة جيدة)" },
    })

    async function onSubmit(data: DonateFormValues) {
        setIsSubmitting(true)
        if (!currentUser) {
            toast({
                title: "الرجاء تسجيل الدخول",
                description: "يجب عليك تسجيل الدخول أولاً لتقديم طلب تبرع.",
                variant: "destructive",
            });
            return;
        }

        const profile = await getUserProfile(currentUser.id);
        if (!profile) {
            toast({ title: "خطأ", description: "لم نتمكن من العثور على بيانات ملفك الشخصي.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        const result = await addDonation({ ...data, userId: currentUser.id });

        if (result.success) {
            toast({
                title: t('donate.toast.success_title'),
                description: "شكراً لك! سيتم الآن فتح واتساب لإرسال تفاصيل طلبك.",
            })

            const targetPhoneNumber = "967776844885"; // رقم المنظمة
            const messageParts = [
                `*طلب تبرع ملابس جديد*`,
                `-----------------`,
                `*البيانات:*`,
                `- المتبرع: ${profile.FullName}`,
                `- رقم الهاتف للتواصل: ${profile.PhoneNumber}`,
                `- نوع الملابس: ${data.clothingType}`,
                `- الحالة: ${data.condition}`,
                `- الكمية: ${data.quantity} قطعة`,
                `- عنوان الاستلام: ${data.pickupAddress}`,
            ];

            if (data.notes) {
                messageParts.push(`- ملاحظات: ${data.notes}`);
            }

            if (profile.Latitude && profile.Longitude) {
                messageParts.push(`*الموقع على الخريطة:*`);
                messageParts.push(`https://www.google.com/maps?q=${profile.Latitude},${profile.Longitude}`);
            }

            const message = encodeURIComponent(messageParts.join('\n'));
            const whatsappUrl = `https://wa.me/${targetPhoneNumber}?text=${message}`;

            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
                form.reset();
                setIsSubmitting(false);
            }, 1500);
        } else {
            toast({
                title: t('common.error'),
                description: result.message,
                variant: "destructive",
            })
            setIsSubmitting(false)
        }
    }


  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 order-2 md:order-1 flex flex-col justify-center">
                 <div className="mb-8 text-center md:text-start">
                    <HeartHandshake className="h-12 w-12 text-primary mx-auto md:mx-0 mb-4" />
                    <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">{t('donate.title')}</h1>
                    <p className="mt-2 text-muted-foreground text-lg">{t('donate.description')}</p>
                  </div>

                  <Alert className="mb-6">
                      <Info className="h-4 w-4" />
                      <AlertTitle>ملاحظة هامة</AlertTitle>
                      <AlertDescription>
                          يمكنك أيضاً إيصال تبرعك مباشرة إلى فرع شركة دن بجانب مطعم كرسبي.
                      </AlertDescription>
                  </Alert>

                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="clothingType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><Shirt className="w-4 h-4"/> {t('donate.form.type_label')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('donate.form.type_placeholder')} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="رجالي">{t('donations.type.male')}</SelectItem>
                                    <SelectItem value="نسائي">{t('donations.type.female')}</SelectItem>
                                    <SelectItem value="أطفال">{t('donations.type.kids')}</SelectItem>
                                    <SelectItem value="مختلط">{t('donations.type.mixed')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="condition"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><Sparkles className="w-4 h-4"/> {t('donate.form.condition_label')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('donate.form.condition_placeholder')} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="جديدة">{t('donations.condition.new')}</SelectItem>
                                    <SelectItem value="مستخدمة (بحالة جيدة)">{t('donations.condition.used_good')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><Package className="w-4 h-4"/> {t('donate.form.quantity_label')}</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="10" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="pickupAddress"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4"/> {t('donate.form.address_label')}</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder={t('donate.form.address_placeholder')}
                                className="resize-y"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><NotebookText className="w-4 h-4"/> {t('donate.form.notes_label')}</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder={t('donate.form.notes_placeholder')}
                            className="resize-none"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                          <Button type="submit" size="lg" className="w-full text-lg font-bold bg-primary hover:bg-primary/90" disabled={isSubmitting || !currentUser}>
                        {isSubmitting ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Send className="me-2 h-5 w-5" />}
                        {t('donate.form.send_button')}
                    </Button>
                </form>
                </Form>
            </div>
              <div className="relative min-h-[300px] md:min-h-0 order-1 md:order-2 bg-white">
                  <Image
                      src={pic1}
                      alt="صورة تبرع بالملابس"
                      fill
                      className="object-contain md:rounded-l-xl"
                      sizes="(max-width: 400px) 80vw, 30vw"
                      priority
                  />
              </div>


        </div>
    </div>
  )
}
