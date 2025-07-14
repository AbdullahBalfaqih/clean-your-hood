"use client"

 
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LifeBuoy, HelpCircle, Users, Phone } from "lucide-react"
import { useLanguage } from "@/components/theme-provider"

export default function HelpPage() {
  const { t } = useLanguage()

  const faqData = [
    {
      question: t('help.faq1.question'),
      answer: t('help.faq1.answer'),
      icon: HelpCircle,
    },
    {
      question: t('help.faq2.question'),
      answer: t('help.faq2.answer'),
      icon: HelpCircle,
    },
    {
      question: t('help.faq3.question'),
      answer: t('help.faq3.answer'),
      icon: HelpCircle,
    },
    {
      question: t('help.faq4.question'),
      answer: t('help.faq4.answer'),
      icon: HelpCircle,
    },
    {
      question: t('help.faq5.question'),
      answer: t('help.faq5.answer'),
      icon: HelpCircle,
    },
    {
      question: t('help.faq6.question'),
      answer: t('help.faq6.answer'),
      icon: Users,
    },
    {
      question: t('help.faq7.question'),
      answer: t('help.faq7.answer'),
      icon: Phone,
    },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <LifeBuoy />
            {t('help.title')}
          </CardTitle>
          <CardDescription>
            {t('help.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => {
                const Icon = faq.icon
                return (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg text-start hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <span>{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground ps-9 leading-relaxed">
                      {faq.answer.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )
            })}
          </Accordion>
        </CardContent>
      </Card>
    </>
  )
}
