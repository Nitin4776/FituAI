
'use server';
/**
 * @fileOverview An AI flow that analyzes user images to estimate their physical vitals,
 * body composition, and posture, and provides recommendations.
 *
 * - analyzeUserVitalsFromImage - A function that estimates physical characteristics from photos.
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
    sidePhotoDataUri: z
    .string()
    .describe(
      "A side-facing photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeUserVitalsInput = z.infer<typeof AnalyzeUserVitalsInputSchema>;


const AnalyzeUserVitalsOutputSchema = z.object({
  isFullBodyVisible: z.boolean().describe('Whether or not a full body is clearly visible in all three photos.'),
  heightCm: z.number().optional().describe('The estimated height of the user in centimeters.'),
  weightKg: z.number().optional().describe('The estimated weight of the user in kilograms.'),
  age: z.number().optional().describe('The estimated age of the user as a single number.'),
  ageRange: z.string().optional().describe('The estimated age range of the user (e.g., "Early 20s", "Mid 30s", "Late 40s").'),
  bodyType: z.string().optional().describe('The estimated body type of the user (e.g., "Ectomorph", "Mesomorph", "Endomorph").'),
  bodyFatPercentage: z.number().optional().describe('The estimated body fat percentage.'),
  postureAnalysis: z.string().optional().describe("A brief analysis of the user's posture. If a full body is not visible, this field should contain a message asking the user to re-upload photos."),
  recommendations: z.string().optional().describe('Actionable recommendations to improve fitness and body shape, formatted as markdown bullet points.'),
});
export type AnalyzeUserVitalsOutput = z.infer<typeof AnalyzeUserVitalsOutputSchema>;


export async function analyzeUserVitalsFromImage(input: AnalyzeUserVitalsInput): Promise<AnalyzeUserVitalsOutput> {
  return analyzeUserVitalsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUserVitalsPrompt',
  input: { schema: AnalyzeUserVitalsInputSchema },
  output: { schema: AnalyzeUserVitalsOutputSchema },
  prompt: `You are an expert at analyzing human biometrics from images. Analyze the three photos provided by the user (front, back, and side view).

  Your first task is to validate the images. Check if a full body (from head to toe) is clearly visible and unobscured in all three photos.
  - If a full body is NOT visible in any of the photos, set "isFullBodyVisible" to false. In the "postureAnalysis" field, return the message: "Full body not visible. Please re-upload photos showing your entire body from head to toe for an accurate analysis." Do not fill out any other fields.
  - If a full body is visible in all photos, set "isFullBodyVisible" to true and proceed with the full analysis.

  When performing the full analysis, your task is to:
  1.  Estimate the user's height in centimeters ("heightCm").
  2.  Estimate the user's weight in kilograms ("weightKg").
  3.  Estimate the user's age as a single integer ("age").
  4.  Provide a descriptive age range ("ageRange"), e.g., "Mid 30s".
  5.  Determine the user's body type ("bodyType"), e.g., Ectomorph, Mesomorph, Endomorph.
  6.  Estimate the user's body fat percentage ("bodyFatPercentage").
  7.  Provide a brief "postureAnalysis" based on the side view.
  8.  Give actionable "recommendations" to get in good shape, formatted as markdown bullet points.

  Front Photo: {{media url=frontPhotoDataUri}}
  Back Photo: {{media url=backPhotoDataUri}}
  Side Photo: {{media url=sidePhotoDataUri}}
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
