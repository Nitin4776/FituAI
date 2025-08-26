
import { analyzeActivityFromImage, type AnalyzeActivityFromImageInput } from '@/ai/flows/analyze-activity-from-image';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // 1 minute

export async function POST(request: Request) {
  try {
    const body: AnalyzeActivityFromImageInput = await request.json();
    const result = await analyzeActivityFromImage(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
