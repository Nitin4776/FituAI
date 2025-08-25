
import { analyzeBloodTestResults, type AnalyzeBloodTestResultsInput } from '@/ai/flows/blood-test-results-analysis';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // 1 minute

export async function POST(request: Request) {
  try {
    const body: AnalyzeBloodTestResultsInput = await request.json();
    const result = await analyzeBloodTestResults(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
