
import { analyzeUserVitalsFromImage, type AnalyzeUserVitalsInput } from '@/ai/flows/analyze-user-vitals-from-image';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body: AnalyzeUserVitalsInput = await request.json();
    const result = await analyzeUserVitalsFromImage(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
