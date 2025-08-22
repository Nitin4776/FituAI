
import { NextResponse } from 'next/server';
import {
    analyzeActivity as analyzeActivityFlow,
    type AnalyzeActivityInput,
    type AnalyzeActivityOutput
} from '@/ai/flows/analyze-activity';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const input: AnalyzeActivityInput = await request.json();
        const result: AnalyzeActivityOutput = await analyzeActivityFlow(input);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to analyze activity:', error);
        return NextResponse.json({ error: 'Could not analyze your activity. Please try again.' }, { status: 500 });
    }
}
