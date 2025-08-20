'use server';
/**
 * @fileOverview A flow that generates a personalized one-day meal plan based on user preferences and fitness goals.
 *
 * - generateMealPlan - A function that creates a meal plan.
 * - GenerateMealPlanInput - The input type for the function.
 * - GenerateMealPlanOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MealDetailSchema = z.object({
  mealName: z.string().describe('The name of the meal.'),
  quantity: z.string().describe('The quantity or serving size of the meal.'),
  calories: z.number().describe('Estimated calories in kcal.'),
  protein: z.number().describe('Estimated protein in grams.'),
  carbs: z.number().describe('Estimated carbohydrates in grams.'),
  fats: z.number().describe('Estimated fats in grams.'),
  fiber: z.number().describe('Estimated fiber in grams.'),
  recipe: z.string().describe('A simple recipe for the meal, formatted as markdown.'),
});

const GenerateMealPlanInputSchema = z.object({
  cuisine: z.string().describe('The desired cuisine (e.g., Indian, Italian, Mexican).'),
  diet: z.enum(['vegetarian', 'non-vegetarian', 'eggetarian', 'vegan']).describe('The dietary preference.'),
  goal: z.string().describe('The user\'s primary fitness goal (e.g., "lose weight", "maintain weight", "gain muscle").'),
  calories: z.number().describe('The target daily calorie intake for the user.'),
});
export type GenerateMealPlanInput = z.infer<typeof GenerateMealPlanInputSchema>;

const GenerateMealPlanOutputSchema = z.object({
  breakfast: MealDetailSchema,
  lunch: MealDetailSchema,
  dinner: MealDetailSchema,
  snack: MealDetailSchema,
});
export type GenerateMealPlanOutput = z.infer<typeof GenerateMealPlanOutputSchema>;

export async function generateMealPlan(
  input: GenerateMealPlanInput
): Promise<GenerateMealPlanOutput> {
  return generateMealPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMealPlanPrompt',
  input: { schema: GenerateMealPlanInputSchema },
  output: { schema: GenerateMealPlanOutputSchema },
  prompt: `You are an expert nutritionist and chef. Create a one-day meal plan for a user with the following preferences and goals.

User Preferences:
- Cuisine: {{{cuisine}}}
- Diet: {{{diet}}}
- Goal: {{{goal}}}
- Target Daily Calories: {{{calories}}} kcal

Generate a realistic and balanced meal plan for breakfast, lunch, dinner, and a snack.
For each meal, provide the meal name, a reasonable quantity/serving size, the estimated macronutrient breakdown (calories, protein, carbs, fats, fiber), and a simple recipe formatted using markdown.
The total calories for the day should be approximately equal to the user's target. Ensure the meals are appropriate for the selected cuisine and diet.`,
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
