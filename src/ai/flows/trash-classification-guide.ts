'use server';

/**
 * @fileOverview Trash classification guide AI agent.
 *
 * - trashClassificationGuide - A function that provides a guide with images/videos for trash classification.
 * - TrashClassificationGuideInput - The input type for the trashClassificationGuide function.
 * - TrashClassificationGuideOutput - The return type for the trashClassificationGuide function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TrashClassificationGuideInputSchema = z.object({
  trashItem: z.string().describe('The trash item to classify.'),
});
export type TrashClassificationGuideInput = z.infer<typeof TrashClassificationGuideInputSchema>;

const TrashClassificationGuideOutputSchema = z.object({
  classificationGuide: z
    .string()
    .describe(
      'A short guide with text, images, and video recommendations for classifying the trash item.'
    ),
});
export type TrashClassificationGuideOutput = z.infer<typeof TrashClassificationGuideOutputSchema>;

export async function trashClassificationGuide(
  input: TrashClassificationGuideInput
): Promise<TrashClassificationGuideOutput> {
  return trashClassificationGuideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'trashClassificationGuidePrompt',
  input: {schema: TrashClassificationGuideInputSchema},
  output: {schema: TrashClassificationGuideOutputSchema},
  prompt: `أنت مساعد ذكاء اصطناعي متخصص في إدارة النفايات.
  قدم دليلاً موجزًا مع نصوص وعناوين URL لصور وتوصيات فيديو لتصنيف المخلفات التالية:
  {{{trashItem}}}
  قم بتضمين تعليمات التخلص المحددة والأمثلة.
  يجب أن يكون دليل التصنيف أقل من 200 كلمة.
  نسق عناوين URL للصور والفيديو كروابط ماركداون.
  مثال على التنسيق:
  يجب أن يتضمن الدليل:
  - وصف قصير للمخلفات.
  - تعليمات حول كيفية تصنيف المخلفات (مثل، قابلة لإعادة التدوير، قابلة للتحلل، مكب نفايات).
  - عناوين URL لصور أمثلة (2 على الأقل).
  - عناوين URL لفيديوهات أمثلة (2 على الأقل).
`,
});

const trashClassificationGuideFlow = ai.defineFlow(
  {
    name: 'trashClassificationGuideFlow',
    inputSchema: TrashClassificationGuideInputSchema,
    outputSchema: TrashClassificationGuideOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
