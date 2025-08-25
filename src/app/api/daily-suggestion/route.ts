
import { getDailySuggestion, type DailySuggestionInput } from '@/ai/flows/daily-suggestion';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // 1 minute

export async function POST(request: Request) {
  try {
    const body: DailySuggestionInput = await request.json();
    const result = await getDailySuggestion(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
