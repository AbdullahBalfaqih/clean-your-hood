"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, Loader2, Wand2, Bot } from "lucide-react"
import { classifyTrashFromImage } from "@/ai/flows/classify-trash"
import type { ClassifyTrashOutput } from "@/ai/flows/classify-trash"
import { trashClassificationGuide } from "@/ai/flows/trash-classification-guide"
import type { TrashClassificationGuideOutput } from "@/ai/flows/trash-classification-guide"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/components/theme-provider"
import pic7 from '@/app/images/g2.png';
import pic11 from '@/app/images/11.png';
import pic9 from '@/app/images/m2.png';
import pic1 from '@/app/images/1.png';
import pic5 from '@/app/images/5.png';
import pic12 from '@/app/images/e1.png';
import pic17 from '@/app/images/t2.png';
import pic10 from '@/app/images/10.png';
const trashTypes = [
    { id: "glass", name: "زجاج", image: pic7, hint: "glass bottle" },
    { id: "paper", name: "ورق", image: pic5, hint: "newspaper" },
    { id: "plastic", name: "بلاستيك", image: pic1, hint: "plastic bottle" },
    { id: "ewaste", name: "نفايات إلكترونية", image: pic12, hint: "electronic waste" },
    { id: "organic", name: "عضوي", image: pic10, hint: "apple core" },
    { id: "metal", name: "معدن", image: pic9, hint: "tin can" },
    { id: "garden", name: "نفايات حدائق", image: pic11, hint: "garden waste" },
    { id: "construction", name: "مخلفات البناء", image: pic17, hint: "bricks" },
]

export function ClassificationClient() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const [classificationResult, setClassificationResult] = useState<ClassifyTrashOutput | null>(null)
  
  const [isFetchingGuide, setIsFetchingGuide] = useState(false)
  const [guideResult, setGuideResult] = useState<TrashClassificationGuideOutput | null>(null)
  const [activeGuide, setActiveGuide] = useState<string | null>(null)

  const { toast } = useToast()
  const { t } = useLanguage()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setClassificationResult(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleClassify = async () => {
    if (!file || !preview) {
      toast({
        title: t('classify.toast.no_file_title'),
        description: t('classify.toast.no_file_desc'),
        variant: "destructive",
      })
      return
    }

    setIsClassifying(true)
    setClassificationResult(null)
    try {
      const result = await classifyTrashFromImage({ photoDataUri: preview })
      setClassificationResult(result)
    } catch (error) {
      console.error("Classification failed:", error)
      toast({
        title: t('classify.toast.failed_title'),
        description: t('classify.toast.failed_desc'),
        variant: "destructive",
      })
    } finally {
      setIsClassifying(false)
    }
  }

  const handleFetchGuide = async (trashItem: string) => {
    setIsFetchingGuide(true)
    setGuideResult(null)
    setActiveGuide(trashItem)
    try {
        const result = await trashClassificationGuide({ trashItem })
        setGuideResult(result)
    } catch (error) {
        console.error("Failed to fetch guide:", error)
        toast({
            title: t('classify.toast.guide_failed_title'),
            description: t('classify.toast.guide_failed_desc'),
            variant: "destructive",
        })
    } finally {
        setIsFetchingGuide(false)
    }
  }

  const translatedTrashTypes = trashTypes.map(type => ({...type, name: t(`classify.types.${type.id}`)}))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('classify.image.title')}</CardTitle>
            <CardDescription>{t('classify.image.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Input
                id="picture"
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept="image/*"
              />
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt={t('classify.image.preview_alt')} className="mx-auto h-32 w-auto rounded-md" />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                  <Upload className="h-10 w-10" />
                  <span>{t('classify.image.upload_instruction')}</span>
                </div>
              )}
            </div>
            {file && <p className="text-sm text-center text-muted-foreground">{t('classify.image.selected_file')}: {file.name}</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={handleClassify} disabled={isClassifying || !file} className="w-full bg-primary hover:bg-primary/90">
              {isClassifying ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="me-2 h-4 w-4" />
              )}
              {isClassifying ? t('classify.image.classifying_button') : t('classify.image.classify_button')}
            </Button>
          </CardFooter>
        </Card>

        {classificationResult && (
          <Card className="bg-accent/20">
            <CardHeader>
              <CardTitle className="font-headline text-primary">{t('classify.result.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold">{t('classify.result.type')}</h3>
                    <p>{classificationResult.trashType}</p>
                </div>
                <div>
                    <h3 className="font-semibold">{t('classify.result.confidence')}</h3>
                    <div className="flex items-center gap-2">
                        <Progress value={classificationResult.confidence * 100} className="w-[80%]" />
                        <span>{(classificationResult.confidence * 100).toFixed(0)}%</span>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold">{t('classify.result.instructions')}</h3>
                    <p>{classificationResult.disposalInstructions}</p>
                </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="font-headline">{t('classify.guides.title')}</CardTitle>
                <CardDescription>{t('classify.guides.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {translatedTrashTypes.map(type => (
                        <Card 
                          key={type.name} 
                          onClick={() => handleFetchGuide(type.name)} 
                          className="cursor-pointer hover:shadow-lg hover:border-primary transition-all text-center p-4 flex flex-col items-center justify-center aspect-square"
                        >
                           <Image
                              src={type.image}
                              alt={type.name}
                              width={100}
                              height={100}
                              className="mb-2"
                              data-ai-hint={type.hint}
                           />
                           <p className="mt-2 font-semibold">{type.name}</p>
                        </Card>
                    ))}
                </div>

                {(isFetchingGuide || guideResult) && (
                    <Alert>
                        <Bot className="h-4 w-4" />
                              <AlertTitle className="font-headline">
                                  {isFetchingGuide
                                      ? t('classify.guides.generating_title')
                                      : t('classify.guides.guide_for', { item: activeGuide ?? undefined })}
                              </AlertTitle>
                        <AlertDescription>
                            {isFetchingGuide ? (
                                <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t('classify.guides.generating_desc')}</span>
                                </div>
                            ) : (
                                <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: guideResult?.classificationGuide.replace(/\n/g, '<br />') ?? ''}} />
                            )}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
