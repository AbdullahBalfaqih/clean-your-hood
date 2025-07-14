import { AppLayout } from "@/components/app-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Newspaper, ChevronLeft, User, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getNews, type NewsArticle } from "@/lib/actions/news.actions"
import { format } from "date-fns"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
const NewsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
            </Card>
        ))}
    </div>
);


const DataFetcher = async () => {
    let newsArticles: NewsArticle[] = [];
    let error: string | null = null;
    
    try {
        newsArticles = await getNews();
    } catch (e: any) {
        console.error("Database connection error in /news:", e.message);
        error = e.message || "An unknown error occurred while connecting to the database.";
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خطأ في الاتصال بقاعدة البيانات</AlertTitle>
                <AlertDescription>
                    <p>فشل تحميل الأخبار. يرجى التأكد من أن خدمة قاعدة البيانات تعمل بشكل صحيح.</p>
                    <p className="mt-2 font-mono text-xs dir-ltr text-left">Error: {error}</p>
                </AlertDescription>
            </Alert>
        )
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-28">
            {newsArticles.map((article: NewsArticle) => (
                <Card key={article.NewsID} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg" dir="rtl">
                    <div className="relative aspect-[3/2] w-full">
                        <Image
                            src={article.ImageURL || "https://placehold.co/600x400.png"}
                            alt={article.Title}
                            fill
                            className="object-contain"
                            sizes="(max-width: 400px) 80vw, 30vw"
                            priority
                        />
                    </div>

                    <CardHeader>
                        <CardTitle className="text-primary">{article.Title}</CardTitle>
                    </CardHeader>

                    <CardContent className="flex-grow">
                        <p className="text-muted-foreground line-clamp-3 text-right">{article.Content}</p>
                    </CardContent>

                    <CardFooter className="flex flex-col items-end gap-4">
                        <div className="flex justify-between w-full text-sm text-muted-foreground flex-row-reverse">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <Badge variant="secondary">{article.Author}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(article.PublishDate), "yyyy-MM-dd")}</span>
                            </div>
                        </div>

                        <Button asChild variant="outline" className="w-full justify-center font-bold">
                            <Link href={`/news/${article.NewsID}`} className="flex items-center justify-center w-full">
                                اقرأ المزيد
                                <ChevronLeft className="h-4 w-4 me-2" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

export default async function NewsPage() {
  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Newspaper />
              أخبار وفعاليات
            </CardTitle>
            <CardDescription>
              ابق على اطلاع بآخر أخبارنا وحملاتنا ومبادراتنا المجتمعية.
            </CardDescription>
          </CardHeader>
        </Card>
        <Suspense fallback={<NewsSkeleton />}>
            <DataFetcher />
        </Suspense>
      </div>
    </>
  )
}
