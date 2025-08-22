
import { NextResponse } from 'next/server';
import {
    analyzeMealFromImage as analyzeMealFromImageFlow,
    type AnalyzeMealFromImageInput,
    type AnalyzeMealFromImageOutput,
} from '@/ai/flows/analyze-meal-from-image';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const input: AnalyzeMealFromImageInput = await request.json();
        const result: AnalyzeMealFromImageOutput = await analyzeMealFromImageFlow(input);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to analyze meal from image:', error);
        return NextResponse.json({ error: 'Could not analyze your meal from the image. Please try again.' }, { status: 500 });
    }
}
