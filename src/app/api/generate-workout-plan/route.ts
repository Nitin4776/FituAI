
import { generateWorkoutPlan, type GenerateWorkoutPlanInput } from '@/ai/flows/generate-workout-plan';
import { NextResponse } from 'next/server';

export const maxDuration = 120; // 2 minutes

export async function POST(request: Request) {
  try {
    const body: GenerateWorkoutPlanInput = await request.json();
    const result = await generateWorkoutPlan(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
