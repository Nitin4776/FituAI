'use server';

/**
 * @fileOverview A flow that suggests healthy food swaps based on user's dietary choices.
 *
 * - healthySwapSuggestions - A function that generates healthy food swap suggestions.
 * - HealthySwapSuggestionsInput - The input type for the healthySwapSuggestions function.
 * - HealthySwapSuggestionsOutput - The return type for the healthySwapSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HealthySwapSuggestionsInputSchema = z.object({
  foodItem: z.string().describe('The food item for which a healthy swap is desired.'),
});
export type HealthySwapSuggestionsInput = z.infer<typeof HealthySwapSuggestionsInputSchema>;

const HealthySwapSuggestionsOutputSchema = z.object({
  healthySwap: z.string().describe('A healthier alternative to the input food item.'),
  reason: z.string().describe('The reason why the suggested swap is healthier.'),
});
export type HealthySwapSuggestionsOutput = z.infer<typeof HealthySwapSuggestionsOutputSchema>;

export async function healthySwapSuggestions(input: HealthySwapSuggestionsInput): Promise<HealthySwapSuggestionsOutput> {
  return healthySwapSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'healthySwapSuggestionsPrompt',
  input: {schema: HealthySwapSuggestionsInputSchema},
  output: {schema: HealthySwapSuggestionsOutputSchema},
  prompt: `You are a nutritionist providing healthy food swap suggestions.

  The user is looking for a healthier alternative to the food item they typically eat.
  Provide a specific and practical swap, and explain why it is a healthier choice.

  Food item: {{{foodItem}}}
  `,
});

const healthySwapSuggestionsFlow = ai.defineFlow(
  {
    name: 'healthySwapSuggestionsFlow',
    inputSchema: HealthySwapSuggestionsInputSchema,
    outputSchema: HealthySwapSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
