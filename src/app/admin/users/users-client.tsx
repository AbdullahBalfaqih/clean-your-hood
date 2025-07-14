"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Edit, Trash2, Search, PlusCircle, Phone } from "lucide-react"
import {
    AlertDialogTrigger, 
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
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
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { type User, addUser, updateUser, deleteUser } from "@/lib/actions/users.actions"

const userFormSchema = z.object({
    name: z.string().min(1, { message: "الاسم مطلوب." }),
    email: z.string().email({ message: "بريد إلكتروني غير صالح." }),
    phone: z.string().min(7, { message: "رقم الهاتف مطلوب." }),
    role: z.enum(["مستخدم", "مدير"]),
    password: z.string().optional(),
})

const editUserFormSchema = userFormSchema.omit({ password: true });

type UserFormValues = z.infer<typeof userFormSchema>
type EditUserFormValues = z.infer<typeof editUserFormSchema>

export function UsersClient({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = React.useState(initialUsers)
    const [userToDelete, setUserToDelete] = React.useState<User | null>(null)
    const [editingUser, setEditingUser] = React.useState<User | null>(null)
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const { toast } = useToast()
    const { t } = useLanguage()

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: { name: "", email: "", phone: "", role: "مستخدم", password: "" },
    })

    React.useEffect(() => {
        if (isFormOpen) {
            if (editingUser) {
                form.reset({
                    name: editingUser.FullName ?? "",
                    email: editingUser.Email ?? "",
                    phone: editingUser.PhoneNumber ?? "",
                    role: editingUser.Role ?? "مستخدم",
                    password: "",
                })

            } else {
                form.reset({ name: "", email: "", phone: "", role: "مستخدم", password: "" })
            }
        }
    }, [isFormOpen, editingUser, form])

    const handleDeleteUser = async () => {
        if (userToDelete) {
            const result = await deleteUser(userToDelete.UserID)
            if (result.success) {
                toast({ title: t('admin.users.toast.deleted') })
                // Optimistic update
                setUsers(users.filter((user) => user.UserID !== userToDelete.UserID))
            } else {
                toast({ title: t('common.error'), description: result.message, variant: 'destructive' })
            }
            setUserToDelete(null)
        }
    }

    const handleFormSubmit = async (data: UserFormValues) => {
        if (!editingUser && (!data.password || data.password.length < 8)) {
            form.setError("password", { message: "كلمة المرور مطلوبة ويجب أن تكون 8 أحرف على الأقل." });
            return;
        }

        let result;
        if (editingUser) {
            const editData: EditUserFormValues = { name: data.name, email: data.email, phone: data.phone, role: data.role };
            result = await updateUser(editingUser.UserID, editData);
        } else {
            result = await addUser(data);
        }

        if (result.success) {
            toast({ title: editingUser ? t('admin.users.toast.updated') : t('admin.users.toast.added') })
            setIsFormOpen(false)
            window.location.reload();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' })
        }
    }

    const filteredUsers = users.filter(user =>
        user.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.PhoneNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const roleTranslations: { [key: string]: string } = {
        'مستخدم': t('admin.users.role.user'),
        'مدير': t('admin.users.role.admin'),
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="font-headline">{t('admin.users.title')}</CardTitle>
                            <CardDescription>
                                {t('admin.users.description')}
                            </CardDescription>
                        </div>
                      
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('admin.users.search_placeholder')}
                                className="ps-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-primary hover:bg-primary">
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.users.table.id')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.users.table.user')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold text-center">رقم الهاتف</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.users.table.role')}</TableHead>
                                    <TableHead className="text-center text-primary-foreground font-bold">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.UserID}>
                                        <TableCell className="font-mono">{user.UserID}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.FullName.substring(0, 1).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.FullName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {user.Email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-center" dir="ltr">
                                            {user.PhoneNumber}
                                        </TableCell>

                                        <TableCell>
                                            <Badge variant={user.Role === "مدير" ? "default" : "secondary"}>
                                                {roleTranslations[user.Role] || user.Role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2 justify-center">
                                                <Button variant="outline" size="icon" onClick={() => { setEditingUser(user); setIsFormOpen(true); }}>
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">{t('common.edit')}</span>
                                                </Button>
                                              <AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="icon" onClick={() => setUserToDelete(user)}>
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">{t('common.delete')}</span>
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
      <AlertDialogDescription>
        {t('admin.users.confirm_delete', { name: user.FullName })}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setUserToDelete(null)}>
        {t('common.cancel')}
      </AlertDialogCancel>
      <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
        {t('common.confirm_delete')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? t('admin.users.dialog.edit_title') : t('admin.users.dialog.add_title')}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? t('admin.users.dialog.edit_desc') : t('admin.users.dialog.add_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.users.form.name')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('admin.users.form.name')} {...field} />
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
                                        <FormLabel>رقم الهاتف</FormLabel>
                                        <FormControl>
                                            <Input placeholder="7XXXXXXXX" {...field} />
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
                                        <FormLabel>{t('admin.users.form.email')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="m@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {!editingUser && (
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('profile.security.new_password')}</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.users.form.role')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('admin.users.form.role_placeholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="مستخدم">{t('admin.users.role.user')}</SelectItem>
                                                <SelectItem value="مدير">{t('admin.users.role.admin')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit">{t('common.save')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}
