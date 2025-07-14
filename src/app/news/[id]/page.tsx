import { AppLayout } from "@/components/app-layout"
import { getNewsArticleById } from "@/lib/actions/news.actions"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Calendar, User, ChevronLeft } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function NewsArticlePage({ params }: { params: { id: string } }) {
  const articleId = Number(params.id)
  if (isNaN(articleId)) {
    notFound()
  }

  const article = await getNewsArticleById(articleId)

  if (!article) {
    notFound()
  }
  
  const DirChevron = ChevronLeft;

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
            <Button asChild variant="outline">
                <Link href="/news" className="inline-flex items-center gap-2">
                    <DirChevron className="h-4 w-4" />
                    العودة إلى الأخبار
                </Link>
            </Button>
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="p-0">
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
            <div className="p-6">
                <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">
                    {article.Title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <Badge variant="secondary">{article.Author}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(article.PublishDate), "dd MMMM yyyy")}</span>
                    </div>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-lg text-foreground/90 leading-relaxed space-y-4 text-start">
              {article.Content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
