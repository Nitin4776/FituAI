
'use server';
/**
 * @fileOverview A flow that generates a personalized 7-day workout plan.
 *
 * - generateWorkoutPlan - A function that creates a workout plan.
 * - GenerateWorkoutPlanInput - The input type for the function.
 * - GenerateWorkoutPlanOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateWorkoutPlanInputSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe("The user's current fitness level."),
  goal: z.enum(['lose', 'maintain', 'gain']).describe("The user's primary fitness goal."),
  bodyTypeGoal: z.enum(['lean', 'toned', 'muscular']).describe("The user's desired body type."),
  buildMuscle: z.boolean().optional().describe('Whether the user has a secondary goal of building muscle.'),
});
export type GenerateWorkoutPlanInput = z.infer<typeof GenerateWorkoutPlanInputSchema>;


const ExerciseSchema = z.object({
  name: z.string().describe('The name of the exercise.'),
  sets: z.string().describe('The number of sets to perform (e.g., "3", "4").'),
  reps: z.string().describe('The number of repetitions per set (e.g., "8-12", "15").'),
  rest: z.string().describe('The rest period between sets in seconds or minutes (e.g., "60s", "2min").'),
  notes: z.string().optional().describe('Additional notes or tips for the exercise (e.g., "Focus on form", "Go to failure on last set").'),
});

const DailyWorkoutSchema = z.object({
  day: z.string().describe('The day of the week (e.g., "Monday").'),
  focus: z.string().describe('The main focus for the day (e.g., "Upper Body Strength", "Cardio & Core", "Rest Day").'),
  exercises: z.array(ExerciseSchema).optional().describe('A list of exercises for the day. This is empty for rest days.'),
});

const GenerateWorkoutPlanOutputSchema = z.object({
  planName: z.string().describe('A catchy and motivating name for the generated workout plan.'),
  planSummary: z.string().describe('A brief, encouraging summary of the plan and what the user can expect.'),
  weeklySchedule: z.array(DailyWorkoutSchema).length(7).describe('A 7-day workout schedule.'),
});
export type GenerateWorkoutPlanOutput = z.infer<typeof GenerateWorkoutPlanOutputSchema>;


export async function generateWorkoutPlan(input: GenerateWorkoutPlanInput): Promise<GenerateWorkoutPlanOutput> {
  return generateWorkoutPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWorkoutPlanPrompt',
  input: { schema: GenerateWorkoutPlanInputSchema },
  output: { schema: GenerateWorkoutPlanOutputSchema },
  prompt: `You are an expert fitness coach. Create a progressive, personalized 7-day workout plan based on the user's preferences.

The plan should be well-structured, with a clear focus for each day, and include at least one to two rest days.
The exercise selection should be appropriate for the user's fitness level and goals.

User Preferences:
- Fitness Level: {{{fitnessLevel}}}
- Primary Goal: {{{goal}}}
- Desired Body Type: {{{bodyTypeGoal}}}
- Build Muscle: {{#if buildMuscle}}Yes{{else}}No{{/if}}

Your task is to generate:
1.  A "planName": A creative and motivating title for the workout plan.
2.  A "planSummary": A short paragraph explaining the plan's structure and what it helps to achieve.
3.  A "weeklySchedule": A 7-day array, starting with Monday. For each day, provide the "day", "focus", and a list of "exercises".
    - For each exercise, detail the "name", "sets", "reps", and "rest" period. Include optional "notes" for technique or intensity.
    - If a day is a rest day, the "exercises" array should be empty.

Ensure the plan is progressive and logical. For example, don't schedule two intense leg days back-to-back.
`,
});

const generateWorkoutPlanFlow = ai.defineFlow(
  {
    name: 'generateWorkoutPlanFlow',
    inputSchema: GenerateWorkoutPlanInputSchema,
    outputSchema: GenerateWorkoutPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
