'use server';
/**
 * @fileOverview A flow that calculates the estimated calories burned during a physical activity.
 *
 * - calculateActivityCalories - A function that estimates calories burned.
 * - CalculateActivityCaloriesInput - The input type for the function.
 * - CalculateActivityCaloriesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateActivityCaloriesInputSchema = z.object({
  activity: z.string().describe('The name of the physical activity.'),
  duration: z.number().describe('The duration of the activity in minutes.'),
  description: z.string().optional().describe('An optional description with more details about the activity.'),
});
export type CalculateActivityCaloriesInput = z.infer<typeof CalculateActivityCaloriesInputSchema>;

const CalculateActivityCaloriesOutputSchema = z.object({
  caloriesBurned: z.number().describe('The estimated number of calories burned.'),
});
export type CalculateActivityCaloriesOutput = z.infer<typeof CalculateActivityCaloriesOutputSchema>;

export async function calculateActivityCalories(
  input: CalculateActivityCaloriesInput
): Promise<CalculateActivityCaloriesOutput> {
  return calculateActivityCaloriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateActivityCaloriesPrompt',
  input: {schema: CalculateActivityCaloriesInputSchema},
  output: {schema: CalculateActivityCaloriesOutputSchema},
  prompt: `You are a fitness expert. Based on the provided physical activity, its duration, and optional description, estimate the number of calories burned.

Activity: {{{activity}}}
Duration: {{{duration}}} minutes
{{#if description}}
Description: {{{description}}}
{{/if}}

Provide a single numerical value for the estimated calories burned.`,
});

const calculateActivityCaloriesFlow = ai.defineFlow(
  {
    name: 'calculateActivityCaloriesFlow',
    inputSchema: CalculateActivityCaloriesInputSchema,
    outputSchema: CalculateActivityCaloriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
