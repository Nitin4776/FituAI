
'use server';
/**
 * @fileOverview A flow that analyzes an image of a workout activity and returns its name and duration.
 *
 * - analyzeActivityFromImage - A function that identifies an activity from a photo.
 * - AnalyzeActivityFromImageInput - The input type for the function.
 * - AnalyzeActivityFromImageOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeActivityFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a workout, such as a treadmill dashboard, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeActivityFromImageInput = z.infer<typeof AnalyzeActivityFromImageInputSchema>;


const AnalyzeActivityFromImageOutputSchema = z.object({
  activityName: z.string().describe('The name of the activity identified in the image (e.g., "Running", "Cycling", "Elliptical").'),
  duration: z.string().describe('The estimated duration of the activity as seen on the equipment, if available (e.g., "30 minutes", "1 hour").'),
});
export type AnalyzeActivityFromImageOutput = z.infer<typeof AnalyzeActivityFromImageOutputSchema>;


export async function analyzeActivityFromImage(input: AnalyzeActivityFromImageInput): Promise<AnalyzeActivityFromImageOutput> {
  return analyzeActivityFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeActivityFromImagePrompt',
  input: { schema: AnalyzeActivityFromImageInputSchema },
  output: { schema: AnalyzeActivityFromImageOutputSchema },
  prompt: `You are a fitness expert. Analyze the activity in the image provided by the user (e.g. a photo of a treadmill dashboard).

  Your task is to:
  1. Identify the type of workout or activity (e.g., "Running", "Cycling", "Stair climbing").
  2. Read the screen or dashboard to determine the duration of the workout. Extract the time and format it as a string (e.g. "45 minutes"). If no duration is clearly visible, leave it blank.

  Provide only the activity name and its duration based on the image.

  Image: {{media url=imageDataUri}}
  `,
});

const analyzeActivityFromImageFlow = ai.defineFlow(
  {
    name: 'analyzeActivityFromImageFlow',
    inputSchema: AnalyzeActivityFromImageInputSchema,
    outputSchema: AnalyzeActivityFromImageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
