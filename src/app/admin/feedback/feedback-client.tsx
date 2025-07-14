"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
    TableRow,

} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
    SheetFooter,

} from "@/components/ui/sheet"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MoreHorizontal, Megaphone, Eye, MessageCircleWarning, FileQuestion, Lightbulb, CheckCircle, Clock, Reply, Printer, Trash2 } from "lucide-react"
import { useLanguage } from "@/components/theme-provider"
import { type Feedback, updateFeedbackStatus, deleteFeedback, replyToFeedback } from "@/lib/actions/feedback.actions"
import { format } from "date-fns"

export function FeedbackClient({ initialFeedback }: { initialFeedback: Feedback[] }) {
  const [feedbackList, setFeedbackList] = React.useState(initialFeedback)
  const [selectedFeedback, setSelectedFeedback] = React.useState<Feedback | null>(null)
  const [feedbackToDelete, setFeedbackToDelete] = React.useState<Feedback | null>(null)
  const [isReplyOpen, setIsReplyOpen] = React.useState(false)
    const [replyContent, setReplyContent] = React.useState("")
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleUpdateStatus = async (id: number, status: string) => {
    const result = await updateFeedbackStatus(id, status);
    if(result.success) {
        setFeedbackList(feedbackList.map(f => f.FeedbackID === id ? { ...f, Status: status } : f));
        toast({ title: "تم تحديث الحالة" });
    } else {
        toast({ title: t('common.error'), description: result.message, variant: 'destructive'});
    }
  }

  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    const result = await deleteFeedback(feedbackToDelete.FeedbackID);
    if(result.success){
        setFeedbackList(feedbackList.filter(f => f.FeedbackID !== feedbackToDelete.FeedbackID));
        toast({ title: t('feedback.toast.deleted'), variant: "destructive" });
    } else {
        toast({ title: t('common.error'), description: result.message, variant: 'destructive'});
    }
    setFeedbackToDelete(null);
    setSelectedFeedback(null);
  }

  const handleReply = async () => {
    if (!selectedFeedback || !replyContent) return;
    await replyToFeedback(selectedFeedback.FeedbackID, replyContent);
    toast({ title: t('feedback.toast.reply_sent') })
    setIsReplyOpen(false)
      setReplyContent("")
  }

  const handlePrint = () => {
    toast({ title: t('feedback.toast.dev_title'), description: t('feedback.toast.dev_desc')})
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "تم الحل": return "default";
      case "قيد المراجعة": return "secondary";
      case "جديد": return "destructive";
      default: return "outline";
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
        case "بلاغ": return <MessageCircleWarning className="h-4 w-4 text-orange-500" />;
        case "شكوى": return <FileQuestion className="h-4 w-4 text-red-500" />;
        case "اقتراح": return <Lightbulb className="h-4 w-4 text-blue-500" />;
        default: return null;
    }
  }
  
  const typeTranslations: { [key: string]: string } = {
    "بلاغ": t('feedback.type.report'),
    "شكوى": t('feedback.type.complaint'),
    "اقتراح": t('feedback.type.suggestion'),
  };

  const statusTranslations: { [key: string]: string } = {
    "جديد": t('feedback.status.new'),
    "قيد المراجعة": t('feedback.status.in_review'),
    "تم الحل": t('feedback.status.resolved'),
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline"><Megaphone /> {t('admin.feedback.title')}</CardTitle>
          <CardDescription>
            {t('admin.feedback.description')}
          </CardDescription>
        </CardHeader>
              <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                      <Table>
                          <TableHeader>
                              <TableRow className="bg-primary hover:bg-primary">
                                  <TableHead className="text-primary-foreground font-bold">{t('admin.feedback.table.id')}</TableHead>
                                  <TableHead className="text-primary-foreground font-bold">{t('admin.feedback.table.type')}</TableHead>
                                  <TableHead className="text-primary-foreground font-bold">{t('admin.feedback.table.subject')}</TableHead>
                                  <TableHead className="text-primary-foreground font-bold">{t('admin.feedback.table.date')}</TableHead>
                                  <TableHead className="text-primary-foreground font-bold">{t('admin.feedback.table.status')}</TableHead>
                                  <TableHead className="text-center text-primary-foreground font-bold">{t('common.actions')}</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                {feedbackList.map((feedback) => (
                  <TableRow key={feedback.FeedbackID}>
                    <TableCell className="font-mono">{feedback.FeedbackID}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                            {getTypeIcon(feedback.FeedbackType)}
                            {typeTranslations[feedback.FeedbackType] || feedback.FeedbackType}
                        </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate" title={feedback.Subject}>{feedback.Subject}</TableCell>
                    <TableCell>{format(new Date(feedback.SubmittedAt), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(feedback.Status) as any}>
                        {statusTranslations[feedback.Status] || feedback.Status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('feedback.actions_label')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedFeedback(feedback)}>
                            <Eye className="me-2 h-4 w-4" />
                            {t('feedback.view_details')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUpdateStatus(feedback.FeedbackID, "قيد المراجعة")}>
                             <Clock className="me-2 h-4 w-4" />
                            {t('feedback.change_to_in_review')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(feedback.FeedbackID, "تم الحل")}>
                            <CheckCircle className="me-2 h-4 w-4" />
                            {t('feedback.change_to_resolved')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setFeedbackToDelete(feedback)}>
                                        <Trash2 className="me-2 h-4 w-4" />
                                        {t('common.delete')}
                                    </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedFeedback} onOpenChange={(isOpen) => !isOpen && setSelectedFeedback(null)}>
        <SheetContent side="right" className="w-[400px] sm:w-[500px] flex flex-col">
          {selectedFeedback && (
            <>
              <SheetHeader className="text-start">
                <SheetTitle className="flex items-center gap-2">
                    {getTypeIcon(selectedFeedback.FeedbackType)}
                    {selectedFeedback.Subject}
                </SheetTitle>
                <SheetDescription>
                  {t('feedback.sheet.sent_by', {user: selectedFeedback.FullName, date: format(new Date(selectedFeedback.SubmittedAt), 'yyyy-MM-dd')})}
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4 flex-grow overflow-y-auto">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-2">
                    <h4 className="font-semibold">{t('feedback.sheet.message_details')}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedFeedback.Details}</p>
                </div>
                {selectedFeedback.PhotoURL && (
                    <div className="space-y-2">
                         <h4 className="font-semibold">{t('feedback.sheet.attachment')}</h4>
                         <div className="relative aspect-video w-full">
                            { /* eslint-disable-next-line @next/next/no-img-element */ }
                            <img src={selectedFeedback.PhotoURL} alt="مرفق البلاغ" className="rounded-md object-cover w-full h-full" data-ai-hint="trash report" />
                         </div>
                    </div>
                )}
              </div>
              <SheetFooter className="grid grid-cols-3 gap-2 mt-auto">
                 <Button variant="outline" onClick={() => setIsReplyOpen(true)}>
                    <Reply className="me-2 h-4 w-4" />
                    {t('common.reply')}
                </Button>
                 <Button variant="outline" onClick={handlePrint}>
                    <Printer className="me-2 h-4 w-4" />
                    {t('common.print')}
                </Button>
                <Button variant="destructive" onClick={() => setFeedbackToDelete(selectedFeedback)}>
                    <Trash2 className="me-2 h-4 w-4" />
                    {t('common.delete')}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!feedbackToDelete} onOpenChange={(isOpen) => !isOpen && setFeedbackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('feedback.confirm_delete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFeedback}>{t('common.confirm_delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('feedback.reply_to', {user: selectedFeedback?.FullName})}</DialogTitle>
                <DialogDescription>
                    {t('feedback.reply_desc')}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Textarea placeholder={t('feedback.reply_placeholder')} className="min-h-[120px]" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsReplyOpen(false)}>{t('common.cancel')}</Button>
                <Button onClick={handleReply}>{t('common.send_reply')}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
