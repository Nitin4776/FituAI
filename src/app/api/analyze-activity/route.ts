
import { analyzeActivity, type AnalyzeActivityInput } from '@/ai/flows/analyze-activity';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body: AnalyzeActivityInput = await request.json();
    const result = await analyzeActivity(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
