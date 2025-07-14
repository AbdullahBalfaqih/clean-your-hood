
"use client"

import * as React from "react"
import Image from "next/image"
import { format } from "date-fns"
import { arSA } from "date-fns/locale"
import {
    Package,
    FileText,
    GlassWater,
    Container,
    Apple,
    Sprout,
    HardDrive,
    Construction,
    Archive,
    Plus,
    Minus,
    Trash2,
    Calendar as CalendarIcon,
    PackageOpen,
    Send,
    Info,
    NotebookText,
    Loader2,
    Recycle,
    Trash,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createPickupRequest } from "@/lib/actions/schedules.actions"
import pic1 from '@/app/images/1.png';
import pic3 from '@/app/images/3.png';
import pic4 from '@/app/images/4.png';
import pic5 from '@/app/images/5.png';
import pic6 from '@/app/images/g1.png';
import pic7 from '@/app/images/g2.png';
import pic8 from '@/app/images/m1.png';
import pic9 from '@/app/images/m2.png';
import pic10 from '@/app/images/10.png';
import pic11 from '@/app/images/11.png';
import pic12 from '@/app/images/e1.png';
import pic13 from '@/app/images/e2.png';
import pic14 from '@/app/images/e3.png';
import pic15 from '@/app/images/e4.png';
import pic16 from '@/app/images/t1.png';
import pic17 from '@/app/images/t2.png';
import pic18 from '@/app/images/t3.png';
import pic19 from '@/app/images/t4.png';
import { useSession } from "@/components/app-layout"
const wasteCategories = [
    { id: "plastic", name: "بلاستيك", icon: Package, description: "القوارير والأكياس البلاستيكية." },
    { id: "paper", name: "ورق", icon: FileText, description: "الورق والكرتون والجرائد." },
    { id: "glass", name: "زجاج", icon: GlassWater, description: "القوارير والأوعية الزجاجية." },
    { id: "metal", name: "معدن", icon: Container, description: "علب الألمنيوم والمعادن الأخرى." },
    { id: "organic", name: "عضوي", icon: Apple, description: "بقايا الطعام." },
    { id: "garden", name: "نفايات حدائق", icon: Sprout, description: "أوراق الشجر والأغصان." },
    { id: "ewaste", name: "نفايات إلكترونية", icon: HardDrive, description: "الأجهزة الإلكترونية والبطاريات." },
    { id: "construction", name: "مخلفات بناء", icon: Construction, description: "الأخشاب والطوب والمخلفات." },
    { id: "other", name: "أخرى", icon: Archive, description: "عناصر غير مصنفة." },
]

const wasteItems = {
    plastic: [
        {
            id: "plastic_bottles_sm_1",
            name: "قوارير بلاستيك (صغير)",
            image: pic1,
            hint: "small plastic bottles"
        },
        {
            id: "plastic_bottles_sm_2",
            name: "قوارير بلاستيك (كبير)",
            image: pic1,
            hint: "large plastic bottles",
            width: 20,
            height: 20
        },
        { id: "plastic_bags", name: "أكياس بلاستيك", image: pic3, hint: "plastic bags" },
    ],

    paper: [
        { id: "cardboard_box", name: "صناديق كرتون", image: pic5, hint: "cardboard box" },
        { id: "newspapers", name: "كتب ودفاتر", image: pic4, hint: "newspapers magazines" },
    ],
    glass: [
        { id: "glass_bottles", name: "قوارير زجاجية", image: pic7 , hint: "glass bottles" },
        { id: "glass_jars", name: "برطمانات زجاج", image: pic6, hint: "glass jars" },
    ],
    metal: [
        { id: "aluminum_cans", name: "علب ألومنيوم", image: pic9, hint: "aluminum cans" },
        { id: "tins", name: "علب صفيح", image: pic8, hint: "tin cans" },
    ],
    organic: [
        { id: "food_scraps", name: "بقايا طعام", image: pic10, hint: "food scraps" },
    ],
    garden: [
        { id: "garden_waste", name: "مخلفات حدائق", image: pic11, hint: "garden waste" },
    ],
    ewaste: [
        { id: "batteries", name: "بطاريات", image: pic14, hint: "batteries" },
        { id: "old_phones", name: "هواتف قديمة", image: pic15, hint: "old smartphones" },
        { id: "cables_chargers", name: "كابلات وشواحن", image: pic12, hint: "cables chargers" },
        { id: "laptops", name: "أجهزة لابتوب", image: pic13, hint: "laptops" },
    ],
    construction: [
        { id: "wood_scraps", name: "بقايا خشب", image: pic16, hint: "wood scraps" },
        { id: "bricks", name: "طوب وحجارة", image: pic17, hint: "bricks stones" },
    ],
    other: [
        { id: "mixed_waste", name: "مخلفات متنوعة", image: pic18, hint: "mixed waste" },
        { id: "mixed_waste2", name: "قمامة", image: pic19 , hint: "mixed waste" },
        { id: "mixed_waste3", name: "روث اغنام", image: pic11, hint: "mixed waste" },

    ]
}


type Bag = { [itemId: string]: { name: string; quantity: number } }

export function ScheduleForm() {
    const { toast } = useToast()
    const [selectedCategory, setSelectedCategory] = React.useState("plastic")
    const [bag, setBag] = React.useState<Bag>({})
    const [pickupDate, setPickupDate] = React.useState<Date | undefined>()
    const [pickupType, setPickupType] = React.useState<string | undefined>()

    const [instructions, setInstructions] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const { currentUser } = useSession()

    const handleBagChange = (itemId: string, itemName: string, change: number) => {
        setBag((prevBag) => {
            const newBag = { ...prevBag }
            const currentQuantity = newBag[itemId]?.quantity || 0
            const newQuantity = currentQuantity + change

            if (newQuantity > 0) {
                newBag[itemId] = { name: itemName, quantity: newQuantity }
            } else {
                delete newBag[itemId]
            }
            return newBag
        })
    }

    const handleClearBag = () => {
        setBag({});
    }

    const handleSubmit = async () => {
        if (!currentUser) {
            toast({ title: "الرجاء تسجيل الدخول", description: "يجب عليك تسجيل الدخول لطلب رفع.", variant: "destructive" });
            return;
        }
        if (Object.keys(bag).length === 0) {
            toast({ title: "كيسك فارغ!", description: "الرجاء إضافة عنصر واحد على الأقل.", variant: "destructive" });
            return;
        }
        if (!pickupType) {
            toast({ title: "نوع الرفع مطلوب!", description: "الرجاء تحديد نوع الرفع (تدوير أو عام).", variant: "destructive" });
            return;
        }
        if (!pickupDate) {
            toast({ title: "التاريخ مطلوب!", description: "الرجاء تحديد تاريخ للرفع.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        const submissionData = {
            userId: currentUser.id,
            items: bag,
            pickupDate: pickupDate,
            pickupType: pickupType,
            notes: instructions,
        };

        const result = await createPickupRequest(submissionData);

        if (result.success) {
            toast({
                title: "تم استلام طلبك بنجاح!",
                description: "سيتم التواصل معك لتأكيد موعد الرفع. شكراً لك!",
            });
            setBag({});
            setPickupDate(undefined);
            setPickupType(undefined);

            setInstructions("");
        } else {
            toast({
                title: "حدث خطأ",
                description: result.message,
                variant: "destructive",
            });
        }

        setIsSubmitting(false);
    }

    const totalItems = React.useMemo(() => {
        return Object.values(bag).reduce((sum, item) => sum + item.quantity, 0)
    }, [bag])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* --- Main Area: Item Selection --- */}
            <div className="lg:col-span-2 space-y-8">
                <Card className="overflow-hidden shadow-lg border-primary/20">
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="font-headline text-3xl text-primary flex items-center gap-3"><PackageOpen /> اطلب رفع مخصص</CardTitle>
                        <CardDescription>
                            ابدأ بملء كيس النفايات الافتراضي الخاص بك، ثم حدد موعدًا مناسبًا لرفعه.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">1. اختر فئة المخلفات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                            {wasteCategories.map((category) => (
                                <Card
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={cn(
                                        "cursor-pointer hover:shadow-lg hover:border-primary transition-all text-center p-3 flex flex-col items-center justify-center aspect-square",
                                        selectedCategory === category.id && "border-primary ring-2 ring-primary"
                                    )}
                                >
                                    <category.icon className={cn("w-8 h-8 mb-2 transition-colors", selectedCategory === category.id ? 'text-primary' : 'text-muted-foreground')} />
                                    <p className="mt-1 font-semibold text-sm">{category.name}</p>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">2. أضف العناصر إلى كيسك</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[450px] w-full p-1 -m-1">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {(wasteItems[selectedCategory as keyof typeof wasteItems] || []).map((item) => (
                                    <Card key={item.id} className="flex flex-col text-center shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
                                        <div className="relative aspect-square">
                                            <Image
                                                src={item.image.src || "https://placehold.co/150x150.png"}
                                                alt={item.name}
                                                layout="fill"
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                data-ai-hint={item.hint}
                                            />
                                        </div>
                                        <div className="p-3 flex-grow flex flex-col justify-center items-center">
                                            <p className="text-sm font-semibold h-10">{item.name}</p>
                                        </div>
                                        <CardFooter className="p-2 bg-muted/50">
                                            <div className="flex items-center justify-center w-full gap-2">
                                                <Button variant="default" size="icon" className="h-8 w-8 rounded-full shadow-md" onClick={() => handleBagChange(item.id, item.name, 1)}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                                <span className="font-bold text-lg w-8 text-center text-primary">{bag[item.id]?.quantity || 0}</span>
                                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleBagChange(item.id, item.name, -1)} disabled={!bag[item.id]}>
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* --- Sidebar: Summary and Scheduling --- */}
            <div dir="rtl" className="lg:col-span-1 space-y-8 sticky top-24 w-full pb-28">
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex flex-row-reverse justify-between items-center">
                            <CardTitle className="flex flex-row-reverse items-center gap-2 font-headline">
                                <PackageOpen className="text-primary" />
                                كيس النفايات
                            </CardTitle>
                            {totalItems > 0 && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleClearBag}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                        <CardDescription className="text-right">
                            محتويات كيسك الحالي.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <ScrollArea className="h-48 pl-3">
                            {totalItems > 0 ? (
                                <div className="space-y-3">
                                    {Object.entries(bag).map(([id, item]) => (
                                        <div key={id} className="flex flex-row-reverse justify-between items-center animate-in fade-in-20">
                                            <span className="font-medium">{item.name}</span>
                                            <Badge variant="secondary" className="font-mono text-base">{item.quantity}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                                    <Package className="h-12 w-12 mb-2" />
                                    <p className="font-semibold">كيسك فارغ!</p>
                                    <p className="text-sm">أضف عناصر من القائمة لبدء الطلب.</p>
                                </div>
                            )}
                        </ScrollArea>

                        <Separator className="my-4" />

                        <div className="flex flex-row-reverse justify-between text-lg font-bold">
                           
                            <span>{totalItems} عنصر</span>
                            <span>الإجمالي</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline">3. جدولة الرفع</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label className="text-sm font-medium mb-3 block">حدد نوع الرفع</Label>
                            <RadioGroup onValueChange={setPickupType} value={pickupType} className="grid grid-cols-2 gap-4">
                                <Label htmlFor="type-recycling" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer transition-colors", pickupType === "إعادة تدوير" ? "border-primary bg-primary/10 text-primary" : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground")}>
                                    <RadioGroupItem value="إعادة تدوير" id="type-recycling" className="sr-only" />
                                    <Recycle className="mb-3 h-6 w-6" />
                                    إعادة تدوير
                                </Label>
                                <Label htmlFor="type-general" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer transition-colors", pickupType === "نفايات عامة" ? "border-primary bg-primary/10 text-primary" : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground")}>
                                    <RadioGroupItem value="نفايات عامة" id="type-general" className="sr-only" />
                                    <Trash className="mb-3 h-6 w-6" />
                                    نفايات عامة
                                </Label>
                            </RadioGroup>
                        </div>

                        <div>
                            <Label className="text-sm font-medium mb-2 block">حدد تاريخ الرفع</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-start font-normal",
                                            !pickupDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="ms-2 h-4 w-4" />
                                        {pickupDate ? format(pickupDate, "PPP", { locale: arSA }) : <span>اختر تاريخًا</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={pickupDate}
                                        onSelect={setPickupDate}
                                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                        initialFocus
                                        locale={arSA}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label className="text-sm font-medium mb-2 block flex items-center gap-2"><NotebookText className="h-4 w-4" /> تعليمات خاصة (اختياري)</Label>
                            <Textarea
                                placeholder="مثال: اتركها بجانب البوابة الجانبية..."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="w-full px-4 sm:px-6">
                        <Button
                            size="lg"
                            className="w-full font-bold text-lg"
                            onClick={handleSubmit}
                            disabled={totalItems === 0 || !pickupDate || !pickupType || isSubmitting || !currentUser}
                        >
                            {isSubmitting ? (
                                <Loader2 className="ms-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="ms-2 h-5 w-5" />
                            )}
                            {isSubmitting ? 'جارٍ الإرسال...' : 'تأكيد طلب الرفع'}
                        </Button>
                    </CardFooter>

                </Card>
            </div>
        </div>
    )
}


