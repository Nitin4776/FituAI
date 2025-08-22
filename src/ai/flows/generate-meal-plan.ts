
'use server';

/**
 * @fileOverview A flow that generates a daily meal plan based on user preferences.
 *
 * - generateMealPlan - A function that creates a meal plan with recipes.
 * - GenerateMealPlanInput - The input type for the function.
 * - GenerateMealPlanOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMealPlanInputSchema = z.object({
  cuisine: z.string().describe('The desired cuisine for the meal plan (e.g., "Italian", "Indian", "Any").'),
  diet: z.enum(['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'jain']).describe('The dietary preference (e.g., "vegetarian", "vegan").'),
});
export type GenerateMealPlanInput = z.infer<typeof GenerateMealPlanInputSchema>;

const MealSchema = z.object({
    mealName: z.string().describe('The name of the suggested meal.'),
    recipe: z.string().describe('A simple recipe for the meal, formatted as markdown bullet points.'),
});

const GenerateMealPlanOutputSchema = z.object({
  breakfast: MealSchema,
  morningSnack: MealSchema,
  lunch: MealSchema,
  eveningSnack: MealSchema,
  dinner: MealSchema,
});
export type GenerateMealPlanOutput = z.infer<typeof GenerateMealPlanOutputSchema>;

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<GenerateMealPlanOutput> {
  return generateMealPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMealPlanPrompt',
  input: { schema: GenerateMealPlanInputSchema },
  output: { schema: GenerateMealPlanOutputSchema },
  prompt: `You are an expert nutritionist and chef. Create a healthy and balanced one-day meal plan based on the user's preferences.

  User Preferences:
  - Cuisine: {{{cuisine}}}
  - Diet: {{{diet}}}

  Generate a plan for the following meals:
  1.  Breakfast
  2.  Morning Snack
  3.  Lunch
  4.  Evening Snack
  5.  Dinner

  For each meal, provide a "mealName" and a simple "recipe" formatted as markdown bullet points. Ensure the meal plan is appropriate for the specified diet.
  `,
});

const generateMealPlanFlow = ai.defineFlow(
  {
    name: 'generateMealPlanFlow',
    inputSchema: GenerateMealPlanInputSchema,
    outputSchema: GenerateMealPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
