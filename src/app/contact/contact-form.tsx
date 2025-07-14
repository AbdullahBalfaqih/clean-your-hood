
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from "next/image"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Megaphone, MessageCircleWarning, Lightbulb, FileQuestion, Type, FileSignature, FileText, Upload, Paperclip, Send } from "lucide-react"
import { useLanguage } from "@/components/theme-provider"
import { addFeedback } from "@/lib/actions/feedback.actions"
import { Loader2 } from "lucide-react"
import { useSession } from "@/components/app-layout"

const contactFormSchema = z.object({
    type: z.string({
        required_error: "يرجى تحديد نوع الرسالة.",
    }),
    subject: z.string().min(5, { message: "العنوان يجب أن يكون 5 أحرف على الأقل." }),
    details: z.string().min(20, { message: "التفاصيل يجب أن تكون 20 حرفًا على الأقل." }),
    photo: z.string().optional(),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

export function ContactForm() {
    const { toast } = useToast()
    const { t } = useLanguage()
    const { currentUser } = useSession()
    const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            type: "بلاغ",
            subject: "",
            details: "",
        },
    })

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const dataUrl = reader.result as string
                setPhotoPreview(dataUrl)
                form.setValue("photo", dataUrl)
            }
            reader.readAsDataURL(file)
        }
    }

    async function onSubmit(data: ContactFormValues) {
        if (!currentUser) {
            toast({
                title: "الرجاء تسجيل الدخول",
                description: "يجب أن تكون مسجلاً للدخول لتقديم بلاغ.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true)
        const result = await addFeedback({ ...data, userId: currentUser.id })

        if (result.success) {
            toast({
                title: t('contact.toast.success_title'),
                description: t('contact.toast.success_desc'),
            })
            form.reset()
            setPhotoPreview(null)
        } else {
            toast({
                title: t('common.error'),
                description: result.message,
                variant: "destructive",
            })
        }
        setIsSubmitting(false)
    }

    return (
        <Card className="w-full">
            <CardHeader className="text-center">
                <Megaphone className="mx-auto h-12 w-12 text-primary" />
                <CardTitle className="text-3xl font-headline">{t('contact.title')}</CardTitle>
                <CardDescription className="text-lg">
                    {t('contact.description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Type className="w-4 h-4" /> {t('contact.form.type_label')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('contact.form.type_placeholder')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="بلاغ">
                                                <div className="flex items-center gap-2"><MessageCircleWarning className="w-4 h-4" /> {t('feedback.type.report')}</div>
                                            </SelectItem>
                                            <SelectItem value="شكوى">
                                                <div className="flex items-center gap-2"><FileQuestion className="w-4 h-4" /> {t('feedback.type.complaint')}</div>
                                            </SelectItem>
                                            <SelectItem value="اقتراح">
                                                <div className="flex items-center gap-2"><Lightbulb className="w-4 h-4" /> {t('feedback.type.suggestion')}</div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><FileSignature className="w-4 h-4" /> {t('contact.form.subject_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('contact.form.subject_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="details"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><FileText className="w-4 h-4" /> {t('contact.form.details_label')}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('contact.form.details_placeholder')}
                                            className="min-h-[150px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="photo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Paperclip className="w-4 h-4" /> {t('contact.form.photo_label')}</FormLabel>
                                    <FormControl>
                                        <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors h-40 flex items-center justify-center">
                                            <Input
                                                id="photo-upload"
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                            />
                                            {photoPreview ? (
                                                <Image src={photoPreview} alt={t('contact.form.photo_preview_alt')} layout="fill" className="rounded-md object-contain" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                                                    <Upload className="h-8 w-8" />
                                                    <span>{t('contact.form.upload_instruction')}</span>
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
                            {t('contact.form.send_button')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
