
import { analyzeMealFromImage, type AnalyzeMealFromImageInput } from '@/ai/flows/analyze-meal-from-image';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // 1 minute

export async function POST(request: Request) {
  try {
    const body: AnalyzeMealFromImageInput = await request.json();
    const result = await analyzeMealFromImage(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
