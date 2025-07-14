"use client"

import * as React from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Edit, Trash2, FilePenLine, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { type NewsArticle, addNews, updateNews, deleteNews } from "@/lib/actions/news.actions"

const newsFormSchema = z.object({
    title: z.string().min(5, { message: "العنوان مطلوب." }),
    author: z.string().min(2, { message: "اسم الكاتب مطلوب." }),
    content: z.string().min(20, { message: "المحتوى مطلوب." }),
    imageURL: z.string().optional(),
});

type NewsFormValues = z.infer<typeof newsFormSchema>;

export function NewsClient({ initialNews }: { initialNews: NewsArticle[] }) {
    const [news, setNews] = React.useState(initialNews)
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [editingNews, setEditingNews] = React.useState<NewsArticle | null>(null)
    const [newsToDelete, setNewsToDelete] = React.useState<NewsArticle | null>(null)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const { toast } = useToast()
    const { t } = useLanguage()

    const form = useForm<NewsFormValues>({
        resolver: zodResolver(newsFormSchema)
    });

    React.useEffect(() => {
        if (isFormOpen) {
            if (editingNews) {
                form.reset({
                    title: editingNews.Title,
                    author: editingNews.Author,
                    content: editingNews.Content,
                    imageURL: editingNews.ImageURL ?? undefined,
                });
                setImagePreview(editingNews.ImageURL);
            } else {
                form.reset({ title: "", author: "", content: "" });
                setImagePreview(null);
            }
        }
    }, [isFormOpen, editingNews, form]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setImagePreview(dataUrl);
                form.setValue("imageURL", dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = async (data: NewsFormValues) => {
        const result = editingNews
            ? await updateNews(editingNews.NewsID, data)
            : await addNews(data);

        if (result.success) {
            toast({ title: editingNews ? t('admin.news.toast.updated') : t('admin.news.toast.added') });
            window.location.reload();
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsFormOpen(false);
        setEditingNews(null);
    };

    const handleDeleteNews = async () => {
        if (!newsToDelete) return;
        const result = await deleteNews(newsToDelete.NewsID);

        if (result.success) {
            toast({ title: t('admin.news.toast.deleted'), variant: 'destructive' });
            setNews(news.filter(n => n.NewsID !== newsToDelete.NewsID));
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setNewsToDelete(null);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2 font-headline"><FilePenLine /> {t('admin.news.title')}</CardTitle>
                            <CardDescription>{t('admin.news.description')}</CardDescription>
                        </div>
                        <Button onClick={() => { setEditingNews(null); setIsFormOpen(true); }}>
                            <PlusCircle className="me-2 h-4 w-4" />
                            {t('admin.news.add_new')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-primary hover:bg-primary">
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.news.table.title')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.news.table.author')}</TableHead>
                                    <TableHead className="text-primary-foreground font-bold">{t('admin.news.table.date')}</TableHead>
                                    <TableHead className="text-center text-primary-foreground font-bold">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {news.map((item) => (
                                    <TableRow key={item.NewsID}>
                                        <TableCell className="font-medium max-w-sm truncate" title={item.Title}>{item.Title}</TableCell>
                                        <TableCell>{item.Author}</TableCell>
                                        <TableCell>{format(new Date(item.PublishDate), 'yyyy-MM-dd')}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Button variant="outline" size="icon" onClick={() => { setEditingNews(item); setIsFormOpen(true); }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="destructive" size="icon" onClick={() => setNewsToDelete(item)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
                        <DialogTitle>{editingNews ? t('admin.news.dialog.edit_title') : t('admin.news.dialog.add_title')}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.news.form.title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="author" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.news.form.author')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="imageURL" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('ارفق صورة للخبر')}</FormLabel>
                                    <FormControl>
                                        <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors h-48 flex items-center justify-center">
                                            <Input
                                                id="image-upload"
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                            />
                                            {imagePreview ? (
                                                <Image src={imagePreview} alt={t('admin.news.form.image_preview_alt')} layout="fill" className="rounded-md object-contain p-1" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                                                    <Upload className="h-8 w-8" />
                                                    <span>{t('معاينة الصورة')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="content" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.news.form.content')}</FormLabel><FormControl><Textarea placeholder={t('admin.news.form.content_placeholder')} className="min-h-32" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>

                                <Button type="submit">{t('common.save')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!newsToDelete} onOpenChange={(isOpen) => !isOpen && setNewsToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('admin.news.confirm_delete', { title: newsToDelete?.Title })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteNews}>{t('common.confirm_delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
