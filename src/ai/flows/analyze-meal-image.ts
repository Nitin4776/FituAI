'use server';
/**
 * @fileOverview A flow that analyzes an image of a meal and returns its details.
 *
 * - analyzeMealImage - A function that analyzes a meal image.
 * - AnalyzeMealImageInput - The input type for the function.
 * - AnalyzeMealImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeMealImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image of a meal as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeMealImageInput = z.infer<typeof AnalyzeMealImageInputSchema>;

const AnalyzeMealImageOutputSchema = z.object({
  isFood: z.boolean().describe('Whether or not the image contains food.'),
  mealName: z.string().describe('The name of the meal (e.g., "Chicken Salad").'),
  quantity: z.string().describe('The quantity or serving size of the meal (e.g., "1 bowl").'),
  calories: z.number().describe('Estimated calories in kcal.'),
  protein: z.number().describe('Estimated protein in grams.'),
  carbs: z.number().describe('Estimated carbohydrates in grams.'),
  fats: z.number().describe('Estimated fats in grams.'),
  fiber: z.number().describe('Estimated fiber in grams.'),
});
export type AnalyzeMealImageOutput = z.infer<typeof AnalyzeMealImageOutputSchema>;

export async function analyzeMealImage(
  input: AnalyzeMealImageInput
): Promise<AnalyzeMealImageOutput> {
  return analyzeMealImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMealImagePrompt',
  input: {schema: AnalyzeMealImageInputSchema},
  output: {schema: AnalyzeMealImageOutputSchema},
  prompt: `You are an expert nutritionist. Analyze the provided image of a meal.

First, determine if the image actually contains food. If it does not, set the isFood flag to false and return empty or zero values for all other fields.

If the image contains food, do the following:
1. Identify the meal and provide a descriptive name for it.
2. Estimate the quantity or serving size.
3. Estimate the macronutrient content: calories (kcal), protein (g), carbs (g), fats (g), and fiber (g).

Return the results in the specified format.

Image: {{media url=imageDataUri}}`,
});

const analyzeMealImageFlow = ai.defineFlow(
  {
    name: 'analyzeMealImageFlow',
    inputSchema: AnalyzeMealImageInputSchema,
    outputSchema: AnalyzeMealImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
