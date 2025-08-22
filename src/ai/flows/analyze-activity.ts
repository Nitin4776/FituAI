
/**
 * @fileOverview A flow that analyzes a workout/activity and estimates calories burned.
 *
 * - analyzeActivity - A function that calculates calories burned for a given activity.
 * - AnalyzeActivityInput - The input type for the analyzeActivity function.
 * - AnalyzeActivityOutput - The return type for the analyzeActivity function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeActivityInputSchema = z.object({
  activityName: z.string().describe('The name of the activity or workout (e.g., "Running", "Weightlifting", "Yoga").'),
  duration: z.string().describe('The duration of the activity (e.g., "30 minutes", "1 hour").'),
  description: z.string().optional().describe('An optional, more detailed description of the activity.'),
  userProfile: z.any().optional().describe("The user's profile information (age, gender, weight).")
});
export type AnalyzeActivityInput = z.infer<typeof AnalyzeActivityInputSchema>;

const AnalyzeActivityOutputSchema = z.object({
  caloriesBurned: z.number().describe('The estimated number of calories burned during the activity.'),
});
export type AnalyzeActivityOutput = z.infer<typeof AnalyzeActivityOutputSchema>;


export async function analyzeActivity(input: AnalyzeActivityInput): Promise<AnalyzeActivityOutput> {
  return analyzeActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeActivityPrompt',
  input: { schema: AnalyzeActivityInputSchema },
  output: { schema: AnalyzeActivityOutputSchema },
  prompt: `You are a fitness expert. Analyze the activity details provided by the user and estimate the number of calories burned.

  Consider the user's profile for a more accurate calculation if it is provided. If not, use standard metabolic equivalent (MET) values for a person of average weight.

  Activity Details:
  - Name: {{{activityName}}}
  - Duration: {{{duration}}}
  {{#if description}}
  - Description: {{{description}}}
  {{/if}}

  {{#if userProfile}}
  User Profile:
  - Weight: {{userProfile.weight}} kg
  - Age: {{userProfile.age}} years
  - Gender: {{userProfile.gender}}
  {{/if}}

  Your response should only include the estimated number of calories burned.
  `,
});

const analyzeActivityFlow = ai.defineFlow(
  {
    name: 'analyzeActivityFlow',
    inputSchema: AnalyzeActivityInputSchema,
    outputSchema: AnalyzeActivityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
