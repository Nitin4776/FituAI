'use server';
/**
 * @fileOverview A flow that generates a daily health suggestion based on recent user data.
 *
 * - generateDailySuggestion - A function that creates a daily suggestion.
 * - GenerateDailySuggestionInput - The input type for the function.
 * - GenerateDailySuggestionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { MealLog, ActivityLog, AnalysisRecord } from '@/lib/types';


const GenerateDailySuggestionInputSchema = z.object({
  latestBloodTest: z.any().optional().describe('The summary and critical markers from the user\'s most recent blood test analysis.'),
  todaysMeals: z.any().describe('A list of meals the user has logged today, including macronutrient information.'),
  todaysActivities: z.any().describe('A list of physical activities the user has logged today, including calories burned.'),
});
export type GenerateDailySuggestionInput = z.infer<typeof GenerateDailySuggestionInputSchema>;

const GenerateDailySuggestionOutputSchema = z.object({
  suggestion: z.string().describe('A single, concise, and actionable health or fitness suggestion for the user for today. Should be 1-2 sentences.'),
});
export type GenerateDailySuggestionOutput = z.infer<typeof GenerateDailySuggestionOutputSchema>;

export async function generateDailySuggestion(
  input: GenerateDailySuggestionInput
): Promise<GenerateDailySuggestionOutput> {
  return generateDailySuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailySuggestionPrompt',
  input: { schema: GenerateDailySuggestionInputSchema },
  output: { schema: GenerateDailySuggestionOutputSchema },
  prompt: `You are a holistic health and fitness coach. Your goal is to provide a single, actionable suggestion for the user based on their data for the day. Keep the suggestion concise and positive.

Analyze the following user data:

{{#if latestBloodTest}}
User's Latest Blood Test Summary:
- Summary: {{{latestBloodTest.summary}}}
- Critical Markers:
{{#each latestBloodTest.criticalMarkers}}
- {{{this.marker}}}: {{{this.level}}}
{{/each}}
{{else}}
User has no blood test data.
{{/if}}

Today's Meals:
{{#if todaysMeals.length}}
{{#each todaysMeals}}
- {{{this.mealName}}} ({{this.calories}} kcal)
{{/each}}
{{else}}
No meals logged yet today.
{{/if}}

Today's Activities:
{{#if todaysActivities.length}}
{{#each todaysActivities}}
- {{{this.activity}}} for {{{this.duration}}} minutes ({{this.caloriesBurned}} kcal burned)
{{/each}}
{{else}}
No activities logged yet today.
{{/if}}

Based on all of this information, provide one single, encouraging, and actionable health tip for today. For example, if meals are high in carbs and there's no activity, suggest a short walk. If a blood marker is low, suggest a food that could help. If they have logged a good workout, praise them. If no data is present, provide a general wellness tip.
`,
});

const generateDailySuggestionFlow = ai.defineFlow(
  {
    name: 'generateDailySuggestionFlow',
    inputSchema: GenerateDailySuggestionInputSchema,
    outputSchema: GenerateDailySuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
