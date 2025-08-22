
import { NextResponse } from 'next/server';
import {
  healthySwapSuggestions,
  type HealthySwapSuggestionsInput,
  type HealthySwapSuggestionsOutput,
} from '@/ai/flows/healthy-swap-suggestions';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const input: HealthySwapSuggestionsInput = await request.json();
    const result: HealthySwapSuggestionsOutput = await healthySwapSuggestions(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get healthy swap suggestions.' }, { status: 500 });
  }
}
