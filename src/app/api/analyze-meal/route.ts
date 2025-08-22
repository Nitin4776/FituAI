
import { analyzeMeal, type AnalyzeMealInput } from '@/ai/flows/analyze-meal';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body: AnalyzeMealInput = await request.json();
    const result = await analyzeMeal(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
