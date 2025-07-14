"use client"

import Link from "next/link"
import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { LeafRecycleIcon } from "@/components/icons"
import { Phone, Lock, LogIn, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { loginUser } from "@/lib/actions/users.actions"

 
const loginFormSchema = z.object({
    phone: z.string().min(9, { message: "رقم الهاتف يجب أن يكون 9 أرقام." }).max(9, { message: "رقم الهاتف يجب أن يكون 9 أرقام." }),
    password: z.string().min(1, { message: "كلمة المرور مطلوبة." }),
    rememberMe: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

export default function LoginPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = React.useState(false)

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            phone: "",
            password: "",
            rememberMe: false,
        },
    })

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true)
        const result = await loginUser(data)
        setIsLoading(false)

        if (result.success && result.user) {
            if (typeof window !== "undefined") {
                localStorage.setItem('currentUser', JSON.stringify({ name: result.user.FullName, id: result.user.UserID, role: result.user.Role }))
            }

            toast({
                title: "تم تسجيل الدخول بنجاح!",
                description: `أهلاً بعودتك، ${result.user.FullName.split(' ')[0]}.`,
            })

            router.push('/dashboard')
            router.refresh()
        } else {
            toast({
                title: "فشل تسجيل الدخول",
                description: result.message,
                variant: "destructive",
            })
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted p-4 auth-bg">
            <Card className="mx-auto max-w-sm w-full shadow-xl rounded-2xl">
                <CardHeader className="text-center space-y-4 pt-8">
                    <Link href="/dashboard" className="mx-auto">
                        <LeafRecycleIcon className="h-16 w-16 text-primary" />
                    </Link>
                    <CardTitle className="text-3xl font-bold font-headline">أهلاً بعودتك!</CardTitle>
                    <CardDescription className="text-base px-4">
                        سجل دخولك للمساهمة في بيئة أنظف
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-primary font-semibold">رقم الهاتف</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    type="tel"
                                                    placeholder="77xxxxxxxx"
                                                    className="pr-10 text-left"
                                                    dir="ltr"
                                                    {...field}
                                                />
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
                                                <Input type="password" placeholder="••••••••" className="pr-10" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex items-center justify-between">
                                <FormField
                                    control={form.control}
                                    name="rememberMe"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    id="remember-me"
                                                    dir="ltr"
                                                />
                                            </FormControl>
                                            <FormLabel htmlFor="remember-me" className="font-normal cursor-pointer">
                                                تذكرني
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                                    نسيت كلمة المرور؟
                                </Link>
                            </div>
                            <Button type="submit" size="lg" className="w-full text-lg font-bold bg-primary hover:bg-primary/90" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <LogIn className="me-2 h-5 w-5" />}
                                {isLoading ? "جارٍ التحقق..." : "تسجيل الدخول"}
                            </Button>
                        </form>
                    </Form>
                    <div className="mt-6 text-center text-sm">
                        ليس لديك حساب؟{" "}
                        <Link href="/register" className="underline font-bold text-primary">
                            سجل الآن
                        </Link>
                    </div>
                </CardContent>
                <CardFooter className="pb-6 flex flex-col items-center gap-1 print:justify-center print:items-center border-t border-muted mt-4 pt-4">
                    <hr className="w-32 border-t border-gray-300 print:border-black my-1" />
                    <p className="text-xs text-muted-foreground print:text-gray-800">
                        تم تطويره بواسطة عبدالله بلفقية
                    </p>
                    <p className="text-sm text-gray-600 print:text-black">
                        abdullahbalfaqih0@gmail.com
                    </p>
                   
                
                </CardFooter>

            </Card>
        </div>
    )
}
