
'use server';

/**
 * @fileOverview A flow that analyzes a meal description and returns its nutritional information.
 *
 * - analyzeMeal - A function that calculates macros for a given meal.
 * - AnalyzeMealInput - The input type for the analyzeMeal function.
 * - AnalyzeMealOutput - The return type for the analyzeMeal function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMealInputSchema = z.object({
  mealName: z.string().describe('The name of the meal (e.g., "Chicken Salad", "Scrambled Eggs").'),
  quantity: z.string().describe('The quantity or portion size of the meal (e.g., "1 bowl", "2 slices", "100g").'),
  description: z.string().optional().describe('An optional, more detailed description of the meal and its ingredients.'),
});
export type AnalyzeMealInput = z.infer<typeof AnalyzeMealInputSchema>;

const AnalyzeMealOutputSchema = z.object({
  calories: z.number().describe('The estimated total calorie count of the meal.'),
  protein: z.number().describe('The estimated grams of protein in the meal.'),
  carbs: z.number().describe('The estimated grams of carbohydrates in the meal.'),
  fats: z.number().describe('The estimated grams of fat in the meal.'),
  fiber: z.number().describe('The estimated grams of fiber in the meal.'),
});
export type AnalyzeMealOutput = z.infer<typeof AnalyzeMealOutputSchema>;

export async function analyzeMeal(input: AnalyzeMealInput): Promise<AnalyzeMealOutput> {
  return analyzeMealFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMealPrompt',
  input: { schema: AnalyzeMealInputSchema },
  output: { schema: AnalyzeMealOutputSchema },
  prompt: `You are a nutritional expert. Analyze the meal details provided by the user and estimate its nutritional information.

  Provide the estimated values for calories, protein, carbohydrates, fats, and fiber.
  Base your calculations on standard portion sizes and ingredients.

  Meal Details:
  - Name: {{{mealName}}}
  - Quantity: {{{quantity}}}
  {{#if description}}
  - Description: {{{description}}}
  {{/if}}
  `,
});

const analyzeMealFlow = ai.defineFlow(
  {
    name: 'analyzeMealFlow',
    inputSchema: AnalyzeMealInputSchema,
    outputSchema: AnalyzeMealOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
