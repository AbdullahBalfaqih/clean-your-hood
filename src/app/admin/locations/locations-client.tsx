"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import dynamic from "next/dynamic"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Edit, Trash2, MapPin, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/theme-provider"
import { type BinLocation, addBinLocation, updateBinLocation, deleteBinLocation } from "@/lib/actions/locations.actions"

const LocationDisplayMap = dynamic(() => import('./location-display-map'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted flex items-center justify-center rounded-lg"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
})

const locationFormSchema = z.object({
  name: z.string().min(3, { message: "اسم الموقع مطلوب." }),
  lat: z.coerce.number({ invalid_type_error: "خط العرض مطلوب."}),
  lng: z.coerce.number({ invalid_type_error: "خط الطول مطلوب." }),
  link: z.string().url("رابط خرائط جوجل غير صالح.").optional().or(z.literal('')),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

export function LocationsClient({ initialLocations }: { initialLocations: BinLocation[] }) {
    const [locations, setLocations] = React.useState(initialLocations)
    const [isFormOpen, setIsFormOpen] = React.useState(false)
    const [editingLocation, setEditingLocation] = React.useState<BinLocation | null>(null)
    const [locationToDelete, setLocationToDelete] = React.useState<BinLocation | null>(null)
    const { toast } = useToast()
    const { t } = useLanguage()

    const mapLocations = locations.map(l => ({ id: l.LocationID, name: l.Name, lat: l.Latitude, lng: l.Longitude, type: 'bin' as const, status: undefined }));
    const mapCenter: [number, number] = mapLocations.length > 0 ? [mapLocations[0].lat, mapLocations[0].lng] : [15.9398, 48.3396];

    const form = useForm<LocationFormValues>({
        resolver: zodResolver(locationFormSchema),
        defaultValues: {
            name: "",
            lat: "" as any,
            lng: "" as any,
            link: ""
        }
    });

    React.useEffect(() => {
        if (isFormOpen) {
            if (editingLocation) {
                form.reset({
                    name: editingLocation.Name,
                    lat: editingLocation.Latitude,
                    lng: editingLocation.Longitude,
                    link: editingLocation.GoogleMapsURL ?? ""
                });
            } else {
                form.reset({ name: "", lat: "" as any, lng: "" as any, link: "" });
            }
        }
    }, [isFormOpen, editingLocation, form]);

    const handleFormSubmit = async (data: LocationFormValues) => {
        const result = editingLocation
            ? await updateBinLocation(editingLocation.LocationID, data)
            : await addBinLocation(data);

        if (result.success) {
            toast({ title: editingLocation ? t('admin.locations.toast.updated') : t('admin.locations.toast.added') });
            // For a real app, you would re-fetch the data or optimistically update
            window.location.reload(); 
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsFormOpen(false);
        setEditingLocation(null);
    };

    const handleDeleteLocation = async () => {
        if (!locationToDelete) return;
        const result = await deleteBinLocation(locationToDelete.LocationID);

        if(result.success) {
            toast({ title: t('admin.locations.toast.deleted'), variant: 'destructive' });
            setLocations(locations.filter(l => l.LocationID !== locationToDelete.LocationID));
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setLocationToDelete(null);
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2 font-headline"><MapPin /> {t('admin.locations.title')}</CardTitle>
                                    <CardDescription>{t('admin.locations.description')}</CardDescription>
                                </div>
                                <Button onClick={() => { setEditingLocation(null); setIsFormOpen(true); }}>
                                    <PlusCircle className="me-2 h-4 w-4" />
                                    {t('admin.locations.add_new')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-primary hover:bg-primary">
                                            <TableHead className="text-primary-foreground font-bold">{t('admin.locations.table.name')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold">{t('admin.locations.table.lat')}</TableHead>
                                            <TableHead className="text-primary-foreground font-bold">{t('admin.locations.table.lng')}</TableHead>
                                            <TableHead className="text-center text-primary-foreground font-bold">{t('common.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {locations.map((loc) => (
                                            <TableRow key={loc.LocationID}>
                                                <TableCell className="font-medium">{loc.Name}</TableCell>
                                                <TableCell className="font-mono text-xs">{loc.Latitude}</TableCell>
                                                <TableCell className="font-mono text-xs">{loc.Longitude}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <Button variant="outline" size="icon" onClick={() => { setEditingLocation(loc); setIsFormOpen(true); }}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="destructive" size="icon" onClick={() => setLocationToDelete(loc)}>
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
                </div>
                <div className="lg:col-span-1">
                     <Card className="h-[400px] lg:h-auto lg:aspect-square">
                        <LocationDisplayMap locations={mapLocations} mapCenter={mapCenter} />
                    </Card>
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLocation ? t('admin.locations.dialog.edit_title') : t('admin.locations.dialog.add_title')}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.locations.form.name_label')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="lat" render={({ field }) => (
                                    <FormItem><FormLabel>{t('admin.locations.form.lat_label')}</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="lng" render={({ field }) => (
                                    <FormItem><FormLabel>{t('admin.locations.form.lng_label')}</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="link" render={({ field }) => (
                                <FormItem><FormLabel>{t('admin.locations.form.link_label')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>
                                <Button type="submit">{t('common.save')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!locationToDelete} onOpenChange={(isOpen) => !isOpen && setLocationToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                           {t('admin.locations.confirm_delete', { name: locationToDelete?.Name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLocation}>{t('common.confirm_delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
