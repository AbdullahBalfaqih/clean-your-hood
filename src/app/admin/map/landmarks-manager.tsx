"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import { Dialog as FormDialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { type Landmark, addLandmark, updateLandmark, deleteLandmark } from "@/lib/actions/landmarks.actions"

// Define the schema here, as it cannot be exported from a 'use server' file.
const landmarkFormSchema = z.object({
    name: z.string().min(3, { message: "اسم المعلم مطلوب." }),
    type: z.enum(["mosque", "hospital", "school", "park"], { required_error: "نوع المعلم مطلوب." }),
    lat: z.coerce.number(),
    lng: z.coerce.number(),
});


type LandmarkFormValues = z.infer<typeof landmarkFormSchema>;

interface LandmarksManagerProps {
  initialLandmarks: Landmark[];
}

export function LandmarksManager({ initialLandmarks }: LandmarksManagerProps) {
    const [landmarks, setLandmarks] = React.useState(initialLandmarks);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingLandmark, setEditingLandmark] = React.useState<Landmark | null>(null);
    const [landmarkToDelete, setLandmarkToDelete] = React.useState<Landmark | null>(null);
    const { toast } = useToast();
    const { t } = useLanguage();

    const form = useForm<LandmarkFormValues>({
        resolver: zodResolver(landmarkFormSchema),
        defaultValues: {
            name: "",
            type: undefined,
            lat: "" as any, // Initialize with empty string to avoid uncontrolled to controlled error
            lng: "" as any,
        }
    });

    React.useEffect(() => {
        if (isFormOpen) {
            if (editingLandmark) {
                form.reset({
                    name: editingLandmark.Name,
                    type: editingLandmark.Type as "mosque" | "hospital" | "school" | "park",
                    lat: editingLandmark.Latitude,
                    lng: editingLandmark.Longitude,
                });
            } else {
                form.reset({ name: "", type: undefined, lat: "" as any, lng: "" as any });
            }
        }
    }, [isFormOpen, editingLandmark, form]);

    const handleFormSubmit = async (data: LandmarkFormValues) => {
        const result = editingLandmark
            ? await updateLandmark(editingLandmark.LandmarkID, data)
            : await addLandmark(data);

        if (result.success) {
            toast({ title: editingLandmark ? t('admin.landmarks.toast.updated') : t('admin.landmarks.toast.added') });
            window.location.reload(); 
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsFormOpen(false);
        setEditingLandmark(null);
    };

    const handleDelete = async () => {
        if (!landmarkToDelete) return;
        const result = await deleteLandmark(landmarkToDelete.LandmarkID);

        if(result.success) {
            toast({ title: t('admin.landmarks.toast.deleted'), variant: 'destructive' });
            setLandmarks(landmarks.filter(d => d.LandmarkID !== landmarkToDelete.LandmarkID));
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setLandmarkToDelete(null);
    };

    const landmarkTypes = [
        { value: 'mosque', label: t('admin.landmarks.type.mosque') },
        { value: 'hospital', label: t('admin.landmarks.type.hospital') },
        { value: 'school', label: t('admin.landmarks.type.school') },
        { value: 'park', label: t('admin.landmarks.type.park') },
    ];
    
    const getTypeLabel = (typeValue: string) => {
        return landmarkTypes.find(t => t.value === typeValue)?.label || typeValue;
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => { setEditingLandmark(null); setIsFormOpen(true); }}>
                    <PlusCircle className="me-2 h-4 w-4" />
                    {t('admin.landmarks.add_new')}
                </Button>
            </div>
            <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('admin.landmarks.table.name')}</TableHead>
                            <TableHead>{t('admin.landmarks.table.type')}</TableHead>
                            <TableHead className="text-center">{t('common.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {landmarks.map((landmark) => (
                            <TableRow key={landmark.LandmarkID}>
                                <TableCell className="font-medium">{landmark.Name}</TableCell>
                                <TableCell>{getTypeLabel(landmark.Type)}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="outline" size="icon" onClick={() => { setEditingLandmark(landmark); setIsFormOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => setLandmarkToDelete(landmark)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <FormDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLandmark ? t('admin.landmarks.dialog.edit_title') : t('admin.landmarks.dialog.add_title')}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.landmarks.form.name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('admin.landmarks.form.type')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder={t('admin.landmarks.form.type_placeholder')} /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {landmarkTypes.map(lt => (
                                                <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="lat" render={({ field }) => (
                                    <FormItem><FormLabel>{t('admin.locations.form.lat_label')}</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="lng" render={({ field }) => (
                                    <FormItem><FormLabel>{t('admin.locations.form.lng_label')}</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit">{t('common.save')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </FormDialog>

            <AlertDialog open={!!landmarkToDelete} onOpenChange={(isOpen) => !isOpen && setLandmarkToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                           {t('admin.landmarks.confirm_delete', { name: landmarkToDelete?.Name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>{t('common.confirm_delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
