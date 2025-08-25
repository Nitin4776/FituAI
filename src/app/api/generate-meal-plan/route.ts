
import { generateMealPlan, type GenerateMealPlanInput } from '@/ai/flows/generate-meal-plan';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // 1 minute

export async function POST(request: Request) {
  try {
    const body: GenerateMealPlanInput = await request.json();
    const result = await generateMealPlan(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
