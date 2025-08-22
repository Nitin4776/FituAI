
'use server';

/**
 * @fileOverview A flow that generates a personalized daily suggestion for the user.
 *
 * - getDailySuggestion - A function that creates a suggestion based on user's full-day data.
 * - DailySuggestionInput - The input type for the function.
 * - DailySuggestionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Use 'any' for complex nested objects from Firestore to simplify the schema
const ProfileSchema = z.any().describe("User's profile data, including height, weight, age, gender, activity level, and goals.");
const BloodTestSchema = z.any().optional().describe('The most recent blood test analysis.');
const MealLogSchema = z.array(z.any()).describe("A list of all meals the user has logged today.");
const ActivityLogSchema = z.array(z.any()).describe("A list of all activities/workouts the user has logged today.");
const SleepLogSchema = z.any().optional().describe("The user's sleep quality log for the previous night.");


const DailySuggestionInputSchema = z.object({
  profile: ProfileSchema,
  latestBloodTest: BloodTestSchema,
  todaysMeals: MealLogSchema,
  todaysActivities: ActivityLogSchema,
  todaysSleep: SleepLogSchema,
});
export type DailySuggestionInput = z.infer<typeof DailySuggestionInputSchema>;


const DailySuggestionOutputSchema = z.object({
  suggestion: z.string().describe('A single, concise, and actionable suggestion for the user for the rest of their day. It should be friendly and encouraging.'),
});
export type DailySuggestionOutput = z.infer<typeof DailySuggestionOutputSchema>;


export async function getDailySuggestion(input: DailySuggestionInput): Promise<DailySuggestionOutput> {
  return dailySuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailySuggestionPrompt',
  input: { schema: DailySuggestionInputSchema },
  output: { schema: DailySuggestionOutputSchema },
  prompt: `You are a friendly and encouraging AI health coach. Your goal is to provide a single, actionable tip to help the user stay on track with their health goals for the rest of the day.

Analyze all the information provided: the user's profile, their goals, their most recent blood test (if available), and what they've eaten, how they've exercised, and how they've slept today.

Based on this complete picture, generate one specific, positive, and easy-to-follow suggestion.

Here is the user's data:
- Profile & Goals: {{{json profile}}}
- Today's Meals: {{{json todaysMeals}}}
- Today's Activities: {{{json todaysActivities}}}
{{#if todaysSleep}}
- Last Night's Sleep: {{todaysSleep.quality}}
{{/if}}
{{#if latestBloodTest}}
- Latest Blood Test Summary: {{latestBloodTest.summary}}
{{/if}}

Your suggestion should be a single sentence or two. Be encouraging and focus on a small, achievable action for the remainder of the day. For example, if their calorie intake is high and they haven't been active, you might suggest a short walk. If their protein is low, suggest a high-protein snack. If they had poor sleep, suggest a relaxing activity in the evening.
`,
});

const dailySuggestionFlow = ai.defineFlow(
  {
    name: 'dailySuggestionFlow',
    inputSchema: DailySuggestionInputSchema,
    outputSchema: DailySuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
