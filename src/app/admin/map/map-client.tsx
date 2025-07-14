
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    MapIcon,
    Home,
    Package,
    Calendar,
    Edit,
    Trash2,
    Building,
    Hospital,
    ParkingSquare,
    School,
    Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/theme-provider"
import { type User as House, updateUser, deleteUser } from "@/lib/actions/users.actions"
import { type BinLocation } from "@/lib/actions/locations.actions"
import dynamic from "next/dynamic"
import { LandmarksManager } from "./landmarks-manager"
import { type Landmark } from "@/lib/actions/landmarks.actions"

const LocationDisplayMap = dynamic(() => import('@/app/admin/locations/location-display-map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted flex items-center justify-center rounded-lg"><p>Loading Map...</p></div>
})


const houseFormSchema = z.object({
    resident: z.string().min(1, "اسم الساكن مطلوب."),
    // Simplified form for just editing the name
});

type HouseFormValues = z.infer<typeof houseFormSchema>;
interface MapClientProps {
    initialHouses: House[];
    initialBins: BinLocation[];
    initialLandmarks: Landmark[];
}


export function MapClient({ initialHouses, initialBins, initialLandmarks }: MapClientProps) {
    const [houses, setHouses] = React.useState(initialHouses);
    const [selectedHouse, setSelectedHouse] = React.useState<House | null>(null);
    const [isLandmarksOpen, setIsLandmarksOpen] = React.useState(false);

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingHouse, setEditingHouse] = React.useState<House | null>(null);
    const [houseToDelete, setHouseToDelete] = React.useState<House | null>(null);
    const mapInstanceRef = React.useRef<L.Map | null>(null);
    const { toast } = useToast();
    const { t } = useLanguage()

    const form = useForm<HouseFormValues>({
        resolver: zodResolver(houseFormSchema),
    });

    React.useEffect(() => {
        if (isFormOpen && editingHouse) {
            form.reset({
                resident: editingHouse.FullName,
            });
        }
    }, [isFormOpen, editingHouse, form]);

    // Add the polygon when the map is available
    React.useEffect(() => {
        async function loadLeafletAndAddPolygon() {
            const L = await import('leaflet'); // dynamic import
            if (mapInstanceRef.current) {
                const polygon = L.polygon([
                    [15.924783, 48.793832],
                    [15.929130, 48.792288],
                    [15.928094, 48.786311],
                    [15.924196, 48.789957]
                ], {
                    color: 'hsl(var(--primary))',
                    fillColor: 'hsl(var(--primary))',
                    fillOpacity: 0.1,
                    weight: 2,
                }).addTo(mapInstanceRef.current);
                polygon.bindPopup("<b>المنطقة التي يغطيها المشروع</b>");
            }
        }

        loadLeafletAndAddPolygon();
    }, [mapInstanceRef]);


    const handleFormSubmit = async (data: HouseFormValues) => {
        if (!editingHouse) return;

        const result = await updateUser(editingHouse.UserID, {
            name: data.resident,
            email: editingHouse.Email,
            role: editingHouse.Role,
        });

        if (result.success) {
            toast({ title: t('admin.map.toast.updated') });
            const updatedHouses = houses.map(h => h.UserID === editingHouse.UserID ? { ...h, FullName: data.resident } : h)
            setHouses(updatedHouses);
            if (selectedHouse && editingHouse.UserID === selectedHouse.UserID) {
                setSelectedHouse(updatedHouses.find(h => h.UserID === editingHouse.UserID) || null)
            }
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setIsFormOpen(false);
        setEditingHouse(null);
    };

    const handleDeleteHouse = async () => {
        if (!houseToDelete) return;
        const result = await deleteUser(houseToDelete.UserID);

        if (result.success) {
            setHouses(houses.filter(h => h.UserID !== houseToDelete.UserID));
            toast({ title: t('admin.map.toast.deleted'), variant: "destructive" });
        } else {
            toast({ title: t('common.error'), description: result.message, variant: 'destructive' });
        }
        setHouseToDelete(null);
        setSelectedHouse(null);
    }

    const getStatusDetails = (house: House) => {
        const houseId = house.UserID;
        if (houseId % 15 === 0) return { variant: 'secondary' as const, text: t('collection.status.scheduled'), status: 'scheduled' as const };
        if (houseId % 33 === 0) return { variant: 'destructive' as const, text: t('collection.status.missed'), status: 'missed' as const };
        return { variant: 'default' as const, text: t('collection.status.collected'), status: 'collected' as const };
    };

    const legendItems = [
        { id: 'collected', label: t('admin.map.legend.collected'), icon: Home, color: "bg-primary" },
        { id: 'scheduled', label: t('admin.map.legend.scheduled'), icon: Home, color: "bg-chart-2" },
        { id: 'missed', label: t('admin.map.legend.missed'), icon: Home, color: "bg-destructive" },
        { id: 'bin', label: "حاوية عامة", icon: Trash2, color: "bg-primary" },
        { id: 'Building2', label: t('admin.landmarks.type.mosque'), icon: Button, color: "bg-teal-500" },
        { id: 'hospital', label: t('admin.landmarks.type.hospital'), icon: Hospital, color: "bg-rose-500" },
        { id: 'school', label: t('admin.landmarks.type.school'), icon: School, color: "bg-amber-500" },
        { id: 'ParkingSquare', label: t('admin.landmarks.type.park'), icon: Building, color: "bg-indigo-500" },
 
    ] as const;

    const mapLocations = [
        ...houses.filter(h => h.Latitude && h.Longitude).map(h => {
            const { status } = getStatusDetails(h);
            return {
                id: h.UserID,
                name: `${t('admin.map.house_tooltip')} ${h.UserID} - ${h.FullName}`,
                lat: h.Latitude!,
                lng: h.Longitude!,
                status: status,
                type: 'house' as const
            };
        }),
        ...initialBins.map(b => ({
            id: b.LocationID,
            name: b.Name,
            lat: b.Latitude,
            lng: b.Longitude,
            type: 'bin' as const,
            status: undefined
        })),
        ...initialLandmarks.map(l => ({
            id: l.LandmarkID,
            name: l.Name,
            lat: l.Latitude,
            lng: l.Longitude,
            type: l.Type as 'mosque' | 'hospital' | 'school' | 'park',
            status: undefined
        }))
    ];

    const mapCenter: [number, number] = mapLocations.length > 0
        ? [mapLocations[0].lat, mapLocations[0].lng]
        : [15.9398, 48.3396]; // Default center

    const handleMarkerClick = (houseId: number) => {
        const house = houses.find(h => h.UserID === houseId);
        if (house) {
            setSelectedHouse(house);
        }
    };


    return (
        <>
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="font-headline flex items-center gap-2"><MapIcon /> {t('admin.map.title')}</CardTitle>
                                <CardDescription>
                                    {t('admin.map.description')}
                                </CardDescription>
                            </div>
                            <Button onClick={() => setIsLandmarksOpen(true)}>
                                <Building className="me-2" />
                                {t('admin.landmarks.manage_title')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted/50 p-1 rounded-lg border h-[500px]">
                            <LocationDisplayMap
                                locations={mapLocations}
                                mapCenter={mapCenter}
                                onMarkerClick={handleMarkerClick}
                                zoomLevel={15}
                                setMapInstance={mapInstanceRef}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">{t('admin.map.legend_title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {legendItems.map(item => {
                            const Icon = item.icon
                            return (
                                <div key={item.id} className="flex items-center gap-3">
                                    <div className={cn("h-8 w-8 rounded-md flex items-center justify-center text-white", item.color)}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-medium">{item.label}</span>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isLandmarksOpen} onOpenChange={setIsLandmarksOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('admin.landmarks.manage_title')}</DialogTitle>
                        <DialogDescription>{t('admin.landmarks.manage_desc')}</DialogDescription>
                    </DialogHeader>
                    <LandmarksManager initialLandmarks={initialLandmarks} />
                </DialogContent>
            </Dialog>

            <Sheet open={!!selectedHouse} onOpenChange={(isOpen) => !isOpen && setSelectedHouse(null)}>
                <SheetContent side="right" className="w-[350px] sm:w-[400px] flex flex-col">
                    {selectedHouse && (
                        <>
                            <SheetHeader className="text-start">
                                <SheetTitle>{t('admin.map.sheet.title', { number: selectedHouse.UserID })}</SheetTitle>
                                <SheetDescription>
                                    {t('admin.map.sheet.description')}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-4 space-y-6 flex-grow overflow-y-auto">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <Avatar className="h-20 w-20 border-2 border-primary">
                                        <AvatarImage src={"https://placehold.co/80x80.png"} data-ai-hint="user avatar" />
                                        <AvatarFallback>{selectedHouse.FullName.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-lg font-bold font-headline">{selectedHouse.FullName}</h3>
                                        <p className="text-sm text-muted-foreground">{t('admin.map.sheet.current_resident')}</p>
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center gap-2"><Home className="h-4 w-4" /> {t('admin.map.sheet.status')}</span>
                                        <Badge variant={getStatusDetails(selectedHouse).variant as any}>
                                            {getStatusDetails(selectedHouse).text}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4" /> {t('admin.map.sheet.last_collected_type')}</span>
                                        <span className="font-medium">{t('collection.type.general')}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> {t('admin.map.sheet.last_collection_date')}</span>
                                        <span className="font-medium">2024-05-18</span>
                                    </div>
                                </div>

                                {selectedHouse.Latitude && selectedHouse.Longitude && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">{t('admin.map.sheet.location')}</h4>
                                        <div className="h-48 w-full rounded-lg overflow-hidden border">
                                            <LocationDisplayMap
                                                locations={[{
                                                    id: selectedHouse.UserID,
                                                    name: selectedHouse.FullName,
                                                    lat: selectedHouse.Latitude,
                                                    lng: selectedHouse.Longitude,
                                                    status: getStatusDetails(selectedHouse).status,
                                                    type: 'house'
                                                }]}
                                                mapCenter={[selectedHouse.Latitude, selectedHouse.Longitude]}
                                            />
                                        </div>
                                    </div>
                                )}

                            </div>
                            <SheetFooter className="grid grid-cols-2 gap-2 mt-auto">
                                <Button variant="outline" onClick={() => { setEditingHouse(selectedHouse); setIsFormOpen(true); }}>
                                    <Edit className="me-2 h-4 w-4" />
                                    {t('common.edit')}
                                </Button>
                                <Button variant="destructive" onClick={() => setHouseToDelete(selectedHouse)}>
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {t('common.delete')}
                                </Button>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.map.dialog.edit_title')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.map.dialog.edit_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="resident"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.map.form.resident_name')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('admin.map.form.resident_name')} {...field} />
                                        </FormControl>
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

            <AlertDialog open={!!houseToDelete} onOpenChange={(isOpen) => !isOpen && setHouseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('admin.map.confirm_delete', { number: houseToDelete?.UserID })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setHouseToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteHouse}>{t('common.confirm_delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
