'use server';
/**
 * @fileOverview A flow that calculates the macronutrient breakdown of a given meal.
 *
 * - calculateMealMacros - A function that calculates meal macros.
 * - CalculateMealMacrosInput - The input type for the function.
 * - CalculateMealMacrosOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateMealMacrosInputSchema = z.object({
  mealName: z.string().describe('The name of the meal (e.g., "Chicken Salad").'),
  quantity: z.string().describe('The quantity or serving size of the meal (e.g., "1 bowl").'),
});
export type CalculateMealMacrosInput = z.infer<typeof CalculateMealMacrosInputSchema>;

const CalculateMealMacrosOutputSchema = z.object({
  calories: z.number().describe('Estimated calories in kcal.'),
  protein: z.number().describe('Estimated protein in grams.'),
  carbs: z.number().describe('Estimated carbohydrates in grams.'),
  fats: z.number().describe('Estimated fats in grams.'),
});
export type CalculateMealMacrosOutput = z.infer<typeof CalculateMealMacrosOutputSchema>;

export async function calculateMealMacros(
  input: CalculateMealMacrosInput
): Promise<CalculateMealMacrosOutput> {
  return calculateMealMacrosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateMealMacrosPrompt',
  input: {schema: CalculateMealMacrosInputSchema},
  output: {schema: CalculateMealMacrosOutputSchema},
  prompt: `You are a nutritionist. Analyze the provided meal and quantity to estimate its macronutrient content.

Meal: {{{mealName}}}
Quantity: {{{quantity}}}

Return the estimated calories, protein, carbohydrates, and fats as numerical values.`,
});

const calculateMealMacrosFlow = ai.defineFlow(
  {
    name: 'calculateMealMacrosFlow',
    inputSchema: CalculateMealMacrosInputSchema,
    outputSchema: CalculateMealMacrosOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
