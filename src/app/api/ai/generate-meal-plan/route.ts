
import { NextResponse } from 'next/server';
import {
    generateMealPlan as generateMealPlanFlow,
    type GenerateMealPlanInput,
    type GenerateMealPlanOutput
} from '@/ai/flows/generate-meal-plan';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const input: GenerateMealPlanInput = await request.json();
    const result: GenerateMealPlanOutput = await generateMealPlanFlow(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to generate meal plan:', error);
    return NextResponse.json({ error: 'Could not generate a meal plan. Please try again.' }, { status: 500 });
  }
}
