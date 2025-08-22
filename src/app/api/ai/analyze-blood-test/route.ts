
import { NextResponse } from 'next/server';
import {
  analyzeBloodTestResults,
  type AnalyzeBloodTestResultsInput,
  type AnalyzeBloodTestResultsOutput,
} from '@/ai/flows/blood-test-results-analysis';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const input: AnalyzeBloodTestResultsInput = await request.json();
    const result: AnalyzeBloodTestResultsOutput = await analyzeBloodTestResults(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to analyze blood test report.' }, { status: 500 });
  }
}
