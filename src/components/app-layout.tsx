
"use client"
import Link from "next/link"
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarInset,
    SidebarSeparator,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    Home,
    Map,
    Recycle,
    Trophy,
    History,
    LogOut,
    UserPlus,
    Shirt,
    Shield,
    ChevronDown,
    Users,
    Gift,
    Calendar,
    BarChart,
    LayoutGrid,
    Newspaper,
    FilePenLine,
    LifeBuoy,
    Settings,
    Bell,
    LogIn,
    CalendarPlus,
    Award,
    Ticket,
    Megaphone,
    MapPin,
    DollarSign,
    HandCoins,
    Banknote,
    ChevronRight,
    ChevronLeft
} from "lucide-react"
import { LeafRecycleIcon } from "@/components/icons"
import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "./theme-provider"

// --- Session Context ---
type UserSession = {
    id: number;
    name: string;
    role: 'مستخدم' | 'مدير';
};

interface SessionContextType {
    currentUser: UserSession | null;
    setCurrentUser: (user: UserSession | null) => void;
    logout: () => void;
    isLoading: boolean;
}

const SessionContext = React.createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
    const context = React.useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider (AppLayout)");
    }
    return context;
};
// --- End Session Context ---


const BottomNavigation = () => {
    const pathname = usePathname()
    const { t } = useLanguage()

    const navItems = [
        { href: "/dashboard", label: t('bottomnav.dashboard'), icon: Home },
        { href: "/schedule", label: t('bottomnav.schedule'), icon: CalendarPlus },
        { href: "/classify", label: t('bottomnav.classify'), icon: Recycle },
        { href: "/news", label: t('bottomnav.news'), icon: Newspaper },
        { href: "/contact", label: t('bottomnav.contact'), icon: Megaphone },
    ]

    return (
        <div className="fixed bottom-0 left-0 z-40 w-full h-16 bg-card/95 backdrop-blur-sm border-t border-border md:hidden">
            <div className="grid h-full grid-cols-5 mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')
                    return (
                        <Link href={item.href} key={item.href} className={cn(
                            "inline-flex flex-col items-center justify-center text-center group rounded-t-md transition-colors duration-200",
                            isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                        )}>
                            <item.icon className="w-6 h-6 mb-1" />
                            <span className="text-[11px] font-bold whitespace-nowrap">{item.label}</span>
                        </Link>
                    )
                }
                )}
            </div>
        </div>
    )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { language, t } = useLanguage()
    const [isAdminOpen, setIsAdminOpen] = React.useState(pathname.startsWith('/admin'))
    const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null)
    const [isLoading, setIsLoading] = React.useState(true);
    const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)

    const DirChevron = language === 'ar' ? ChevronLeft : ChevronRight;


    React.useEffect(() => {
        setIsLoading(true);
        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
            try {
                setCurrentUser(JSON.parse(userJson));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
                localStorage.removeItem('currentUser');
                setCurrentUser(null);
            }
        } else {
            setCurrentUser(null);
        }
        setIsLoading(false);
    }, [pathname]);

    const handleSetCurrentUser = (user: UserSession | null) => {
        setCurrentUser(user);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    };

    const handleLogout = () => {
        handleSetCurrentUser(null);
        setShowLogoutDialog(false);
        router.push('/login');
        router.refresh();
    };


    const menuItems = [
        { href: "/dashboard", label: t('sidebar.main'), icon: Home },
        { href: "/schedule", label: t('sidebar.schedule'), icon: CalendarPlus },
        { href: "/classify", label: t('sidebar.classify'), icon: Recycle },
        { href: "/map", label: t('sidebar.locations'), icon: MapPin },
        { href: "/news", label: t('sidebar.news'), icon: Newspaper },
        { href: "/rewards", label: t('sidebar.rewards'), icon: Trophy },
        { href: "/history", label: t('sidebar.history'), icon: History },
        { href: "/donate", label: t('sidebar.donate'), icon: Shirt },
        { href: "/support", label: t('sidebar.support'), icon: DollarSign },
        { href: "/contact", label: t('sidebar.contact'), icon: Megaphone },
        { href: "/help", label: t('sidebar.help'), icon: LifeBuoy },
    ]

    const adminMenuItems = [
        { href: "/admin", label: t('sidebar.admin.dashboard'), icon: LayoutGrid },
        { href: "/admin/map", label: t('sidebar.admin.map'), icon: Map },
        { href: "/admin/locations", label: t('sidebar.admin.locations'), icon: MapPin },
        { href: "/admin/users", label: t('sidebar.admin.users'), icon: Users },
        { href: "/admin/points", label: t('sidebar.admin.points'), icon: Award },
        { href: "/admin/vouchers", label: t('sidebar.admin.vouchers'), icon: Ticket },
        { href: "/admin/donations", label: t('sidebar.admin.donations'), icon: Gift },
        { href: "/admin/financial-support", label: t('sidebar.admin.financial'), icon: HandCoins },
        { href: "/admin/redemptions", label: t('sidebar.admin.redemptions'), icon: Banknote },
        { href: "/admin/schedules", label: t('sidebar.admin.schedules'), icon: Calendar },
        { href: "/admin/notifications", label: t('sidebar.admin.notifications'), icon: Bell },
        { href: "/admin/feedback", label: t('sidebar.admin.feedback'), icon: Megaphone },
        { href: "/admin/news", label: t('sidebar.admin.news'), icon: FilePenLine },
        { href: "/admin/reports", label: t('sidebar.admin.reports'), icon: BarChart },
    ]

    const getPageTitle = () => {
        const allItems = [...menuItems, ...adminMenuItems, { href: "/profile", label: t('usermenu.settings'), icon: Settings }];
        const item = allItems
            .filter(i => pathname.startsWith(i.href) && (pathname === i.href || pathname.startsWith(i.href + '/')))
            .sort((a, b) => b.href.length - a.href.length)[0];

        return item?.label || t('header.welcome');
    }

    const userInitials = currentUser
        ? currentUser.name.substring(0, 1).toUpperCase()
        : 'V'

    const noLayoutPages = ['/login', '/register', '/forgot-password'];
    const showLayout = !noLayoutPages.includes(pathname);

    return (
        <SessionContext.Provider value={{ currentUser, setCurrentUser: handleSetCurrentUser, isLoading, logout: handleLogout }}>
            {showLayout ? (
                <SidebarProvider>
                    <Sidebar side={language === 'ar' ? 'right' : 'left'} variant="inset" collapsible="icon" className="border-0">
                        <SidebarHeader>
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <LeafRecycleIcon className="size-8 text-sidebar-primary" />
                                <span className="text-xl font-headline font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                                    <span>نظف</span>
                                    <span className="text-sidebar-primary"> حيك</span>
                                </span>
                            </Link>
                        </SidebarHeader>
                        <SidebarContent>
                            <SidebarMenu>
                                {menuItems.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={(pathname.startsWith(item.href) && item.href !== '/') || (pathname === '/' && item.href === '/dashboard')}
                                            tooltip={{ children: item.label, side: language === 'ar' ? 'left' : 'right' }}
                                        >
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                            <SidebarSeparator />
                            {currentUser?.role === 'مدير' && (
                                <SidebarMenu>
                                    <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen} className="w-full">
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton className="justify-between w-full" tooltip={{ children: t('sidebar.admin.title'), side: language === 'ar' ? 'left' : 'right' }}>
                                                    <div className="flex items-center gap-2 [&>svg]:size-4">
                                                        <Shield className="text-sidebar-primary" />
                                                        <span>{t('sidebar.admin.title')}</span>
                                                    </div>
                                                    <ChevronDown className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isAdminOpen ? 'rotate-180' : ''}`} />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {adminMenuItems.map((item) => (
                                                    <SidebarMenuSubItem key={item.href}>
                                                        <SidebarMenuSubButton asChild isActive={(pathname.startsWith(item.href) && item.href !== '/admin') || (pathname === '/admin' && item.href === '/admin')}>
                                                            <Link href={item.href}>
                                                                {item.icon && <item.icon />}
                                                                <span>{item.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </SidebarMenu>
                            )}
                        </SidebarContent>
                        <SidebarFooter>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        tooltip={{ children: currentUser?.name ?? t('usermenu.my_account'), side: language === 'ar' ? 'left' : 'right' }}
                                        className="h-auto w-full justify-start text-start"
                                    >
                                        <div className="flex w-full items-center gap-2">
                                            <Avatar className="size-8">
                                                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-bold">{userInitials}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex min-w-0 flex-col items-start group-data-[collapsible=icon]:hidden">
                                                <span className="truncate font-bold">{currentUser ? currentUser.name.split(" ")[0] : t('usermenu.visitor')}</span>
                                                <span className="truncate text-xs text-sidebar-foreground/70">
                                                    {currentUser ? t('usermenu.view_account') : t('usermenu.login')}
                                                </span>
                                            </div>
                                        </div>
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="start" className="w-56 mb-2">
                                    <DropdownMenuLabel>{t('usermenu.my_account')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {currentUser ? (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href="/profile">
                                                    <Settings className="me-2 h-4 w-4" />
                                                    <span>{t('usermenu.settings')}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => setShowLogoutDialog(true)}>
                                                <LogOut className="me-2 h-4 w-4" />
                                                <span>{t('usermenu.logout')}</span>
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href="/login">
                                                    <LogIn className="me-2 h-4 w-4" />
                                                    <span>{t('usermenu.login')}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/register">
                                                    <UserPlus className="me-2 h-4 w-4" />
                                                    <span>{t('usermenu.register')}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarFooter>
                    </Sidebar>
                    <SidebarInset className="border-0">
                        <header className="flex h-16 items-center justify-between gap-4 border-b border-header-foreground/20 bg-header px-4 text-header-foreground sm:px-6 sticky top-0 z-30">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger className="md:hidden" />
                                <h1 className="text-xl font-bold font-headline">
                                    {getPageTitle()}
                                </h1>
                            </div>
                        </header>
                        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6">
                            {children}
                        </main>
                        <BottomNavigation />
                        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('logout_dialog.title')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('logout_dialog.description')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('logout_dialog.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLogout}>{t('logout_dialog.confirm')}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </SidebarInset>
                </SidebarProvider>
            ) : (
                <>{children}</>
            )}
        </SessionContext.Provider>
    )
}
