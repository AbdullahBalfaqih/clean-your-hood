"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, KeyRound, Copy, Phone, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { forgotPassword } from "@/lib/actions/users.actions"

 
export default function ForgotPasswordPage() {
    const [submitted, setSubmitted] = React.useState(false)
    const [password, setPassword] = React.useState("");

  const { toast } = useToast()
  const { t } = useLanguage()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = form.get('email')?.toString() || '';
        const result = await forgotPassword(email);

        if (result.success) {
            setPassword(result.newPassword || '');  // هنا نستخدم newPassword
            setSubmitted(true);
        } else {
            toast({
                title: "خطأ",
                description: result.message,
                variant: "destructive",
            });
        }
    };


  
    const handleCopyPassword = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(password);  // نسخ كلمة المرور الجديدة من المتغير state
            toast({
                title: t('forgot_password.toast.copied_title'),
                description: t('forgot_password.toast.copied_desc')
            });
        }
    }


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted p-4 auth-bg">
      <Card className="mx-auto max-w-sm w-full shadow-xl rounded-2xl">
        <CardHeader className="text-center space-y-4 pt-8">
            <KeyRound className="mx-auto h-16 w-16 text-primary" />
            <CardTitle className="text-3xl font-bold font-headline">{t('forgot_password.title')}</CardTitle>
            <CardDescription className="text-base px-4">
                {submitted
                ? t('forgot_password.submitted_desc')
                : t('forgot_password.initial_desc')}
            </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-full space-y-2">
                <Label htmlFor="password">{t('forgot_password.your_password')}</Label>
                 <div className="flex items-center gap-2">
                    <div className="relative w-full">
                                      <Input id="password" type="text" value={password} readOnly className="text-center text-lg font-mono tracking-widest bg-muted"/>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleCopyPassword}>
                        <Copy className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('forgot_password.demo_notice')}
              </p>
            </div>
          ) : (
                          <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                              <div className="grid gap-2">
                                  <Label htmlFor="email">{t('البريد الإلكتروني') || "forgot_password.email_label"}</Label>
                                  <div className="relative">
                                      <Input
                                          id="email"
                                          name="email"
                                          type="email"
                                          placeholder="example@email.com"
                                          required
                                          className="ps-4 text-start"
                                          dir="ltr"
                                      />
                                  </div>
                              </div>
                              <Button type="submit" size="lg" className="w-full text-lg font-bold bg-primary hover:bg-primary/90">
                                  <Send className="me-2 h-5 w-5" />
                                  {t('forgot_password.submit_button')}
                              </Button>
                          </form>
          )}
          <div className="mt-2 text-center text-sm">
            <Link href="/login" className="font-bold text-primary hover:underline inline-flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              {t('forgot_password.back_to_login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
