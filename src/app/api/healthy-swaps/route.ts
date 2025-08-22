
import { healthySwapSuggestions, type HealthySwapSuggestionsInput } from '@/ai/flows/healthy-swap-suggestions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body: HealthySwapSuggestionsInput = await request.json();
    const result = await healthySwapSuggestions(body);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
