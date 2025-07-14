import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { ThemeProvider, LanguageProvider } from '@/components/theme-provider';
import { AppLayout } from "@/components/app-layout";

export const metadata: Metadata = {
    title: 'نظف حيك: إدارة ذكية للنفايات',
    description: 'تطبيق ذكي لإدارة النفايات.',
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="ar" dir="rtl" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&family=Open+Sans:wght@400;600;700&family=Source+Code+Pro:wght@400;600&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="font-body antialiased">
                <LanguageProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <AppLayout>
                            {children}
                        </AppLayout>
                        <Toaster />
                    </ThemeProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
