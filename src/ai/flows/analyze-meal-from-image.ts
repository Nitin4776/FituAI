
/**
 * @fileOverview A flow that analyzes an image of a meal and returns its name and quantity.
 *
 * - analyzeMealFromImage - A function that identifies a meal from a photo.
 * - AnalyzeMealFromImageInput - The input type for the function.
 * - AnalyzeMealFromImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMealFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeMealFromImageInput = z.infer<typeof AnalyzeMealFromImageInputSchema>;


const AnalyzeMealFromImageOutputSchema = z.object({
  mealName: z.string().describe('The name of the meal identified in the image (e.g., "Chicken Salad", "Scrambled Eggs").'),
  quantity: z.string().describe('The estimated quantity or portion size of the meal (e.g., "1 bowl", "2 slices", "100g").'),
});
export type AnalyzeMealFromImageOutput = z.infer<typeof AnalyzeMealFromImageOutputSchema>;


export async function analyzeMealFromImage(input: AnalyzeMealFromImageInput): Promise<AnalyzeMealFromImageOutput> {
  return analyzeMealFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMealFromImagePrompt',
  input: { schema: AnalyzeMealFromImageInputSchema },
  output: { schema: AnalyzeMealFromImageOutputSchema },
  prompt: `You are a nutritional expert. Analyze the meal in the image provided by the user.

  Your task is to:
  1. Identify the food items in the image.
  2. Determine the most appropriate name for the meal (e.g., "Oatmeal with Berries", "Two fried eggs with toast").
  3. Estimate the quantity or serving size (e.g., "1 bowl", "2 slices", "150g").

  Provide only the meal name and its quantity based on the image.

  Image: {{media url=imageDataUri}}
  `,
});

const analyzeMealFromImageFlow = ai.defineFlow(
  {
    name: 'analyzeMealFromImageFlow',
    inputSchema: AnalyzeMealFromImageInputSchema,
    outputSchema: AnalyzeMealFromImageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
