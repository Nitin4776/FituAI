/**
 * @fileOverview Analyzes blood test results and provides a summary,
 * do's and don'ts, lifestyle recommendations, and highlights critical markers.
 *
 * - analyzeBloodTestResults - A function that processes blood test results and returns an analysis.
 * - AnalyzeBloodTestResultsInput - The input type for the analyzeBloodTestResults function.
 * - AnalyzeBloodTestResultsOutput - The return type for the analyzeBloodTestResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeBloodTestResultsInputSchema = z.object({
  reportDataUri: z
    .string()
    .describe(
      "A blood test report as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeBloodTestResultsInput = z.infer<typeof AnalyzeBloodTestResultsInputSchema>;

const CriticalMarkerSchema = z.object({
  marker: z.string().describe('The name of the critical marker.'),
  value: z.string().describe('The value of the marker from the report.'),
  level: z.string().describe('The level of the marker (e.g., "High", "Low", "Normal").'),
});

const DosAndDontsSchema = z.object({
    dos: z.string().describe('A list of "Do\'s" based on the analysis, formatted as markdown bullet points.'),
    donts: z.string().describe('A list of "Don\'ts" based on the analysis, formatted as markdown bullet points.'),
});

const AnalyzeBloodTestResultsOutputSchema = z.object({
  summary: z.string().describe('A summary of the blood test results in plain language, formatted as markdown bullet points.'),
  dosAndDonts: DosAndDontsSchema.describe('Personalized do\'s and don\'ts based on the results.'),
  lifestyleModifications: z
    .string()
    .describe('Lifestyle modification recommendations (diet, exercise, sleep), formatted as markdown bullet points.'),
  criticalMarkers: z.array(CriticalMarkerSchema).describe('A list of highlighted critical markers from the blood test results.'),
  nextTestDateSuggestion: z.string().describe('A suggested date or timeframe for the next blood test (e.g., "in 3 months", "in 6 months", "annually").'),
});
export type AnalyzeBloodTestResultsOutput = z.infer<typeof AnalyzeBloodTestResultsOutputSchema>;

export async function analyzeBloodTestResults(
  input: AnalyzeBloodTestResultsInput
): Promise<AnalyzeBloodTestResultsOutput> {
  return analyzeBloodTestResultsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeBloodTestResultsPrompt',
  input: {schema: AnalyzeBloodTestResultsInputSchema},
  output: {schema: AnalyzeBloodTestResultsOutputSchema},
  prompt: `You are a medical expert specializing in interpreting blood test results.

You will analyze the provided blood test report and generate the following:

1.  A summary of the results in plain language. Format this as a markdown bulleted list.
2.  Personalized do's and don'ts based on abnormalities. Provide separate lists for "Do's" and "Don'ts", with each formatted as a markdown bulleted list.
3.  Lifestyle modification recommendations (diet, exercise, sleep). Format this as a markdown bulleted list.
4.  A list of highlighted critical markers (e.g., cholesterol high, Vitamin D low). For each marker, provide the marker name, its value, and its level (High, Low, Normal, Borderline, etc.).
5.  A suggested date for the next blood test. If there are critical markers, suggest a shorter follow-up time (e.g., "in 3 months"). If results are mostly normal, suggest a longer interval (e.g., "in 6-12 months").

Use the following blood test report as the primary source of information:

Report: {{media url=reportDataUri}}`,
});

const analyzeBloodTestResultsFlow = ai.defineFlow(
  {
    name: 'analyzeBloodTestResultsFlow',
    inputSchema: AnalyzeBloodTestResultsInputSchema,
    outputSchema: AnalyzeBloodTestResultsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
