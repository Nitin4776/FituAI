
import { NextResponse } from 'next/server';
import {
    analyzeMeal as analyzeMealFlow,
    type AnalyzeMealInput,
    type AnalyzeMealOutput,
} from '@/ai/flows/analyze-meal';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const input: AnalyzeMealInput = await request.json();
        const result: AnalyzeMealOutput = await analyzeMealFlow(input);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to analyze meal:', error);
        return NextResponse.json({ error: 'Could not analyze your meal. Please try again.' }, { status: 500 });
    }
}
