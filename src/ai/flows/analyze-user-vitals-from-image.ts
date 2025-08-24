
'use server';
/**
 * @fileOverview An AI flow that analyzes user images to estimate their physical vitals.
 *
 * - analyzeUserVitalsFromImage - A function that estimates height, weight, and age from photos.
 * - AnalyzeUserVitalsInput - The input type for the function.
 * - AnalyzeUserVitalsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeUserVitalsInputSchema = z.object({
  frontPhotoDataUri: z
    .string()
    .describe(
      "A front-facing photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
   backPhotoDataUri: z
    .string()
    .describe(
      "A back-facing photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeUserVitalsInput = z.infer<typeof AnalyzeUserVitalsInputSchema>;


const AnalyzeUserVitalsOutputSchema = z.object({
  heightCm: z.number().describe('The estimated height of the user in centimeters.'),
  weightKg: z.number().describe('The estimated weight of the user in kilograms.'),
  age: z.number().describe('The estimated age of the user in years.'),
});
export type AnalyzeUserVitalsOutput = z.infer<typeof AnalyzeUserVitalsOutputSchema>;


export async function analyzeUserVitalsFromImage(input: AnalyzeUserVitalsInput): Promise<AnalyzeUserVitalsOutput> {
  return analyzeUserVitalsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUserVitalsPrompt',
  input: { schema: AnalyzeUserVitalsInputSchema },
  output: { schema: AnalyzeUserVitalsOutputSchema },
  prompt: `You are an expert at analyzing human biometrics from images. Analyze the two photos provided by the user (front and back view).

  Your task is to:
  1. Estimate the user's height in centimeters.
  2. Estimate the user's weight in kilograms.
  3. Estimate the user's age.

  Provide only the estimated numerical values for height, weight, and age.

  Front Photo: {{media url=frontPhotoDataUri}}
  Back Photo: {{media url=backPhotoDataUri}}
  `,
});

const analyzeUserVitalsFlow = ai.defineFlow(
  {
    name: 'analyzeUserVitalsFlow',
    inputSchema: AnalyzeUserVitalsInputSchema,
    outputSchema: AnalyzeUserVitalsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
