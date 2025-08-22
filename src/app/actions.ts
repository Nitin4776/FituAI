
'use server';

import {
  analyzeBloodTestResults,
  type AnalyzeBloodTestResultsInput,
  type AnalyzeBloodTestResultsOutput,
} from '@/ai/flows/blood-test-results-analysis';
import {
  healthySwapSuggestions,
  type HealthySwapSuggestionsInput,
  type HealthySwapSuggestionsOutput,
} from '@/ai/flows/healthy-swap-suggestions';
import {
    generateDailySuggestion,
    type GenerateDailySuggestionInput,
    type GenerateDailySuggestionOutput,
} from '@/ai/flows/generate-daily-suggestion';
import { saveSleepLog } from '@/services/firestore';
import { auth } from '@/lib/firebase.server';
import { cookies } from 'next/headers';

async function getCurrentUserIdFromSession() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        return null;
    }
    try {
        const decodedClaims = await auth().verifySessionCookie(sessionCookie, true);
        return decodedClaims.uid;
    } catch (error) {
        console.error('Session cookie verification failed:', error);
        return null;
    }
}


export async function getHealthySwap(
  input: HealthySwapSuggestionsInput
): Promise<HealthySwapSuggestionsOutput> {
  try {
    return await healthySwapSuggestions(input);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to get healthy swap suggestions.');
  }
}

export async function analyzeReport(
  input: AnalyzeBloodTestResultsInput
): Promise<AnalyzeBloodTestResultsOutput> {
  try {
    return await analyzeBloodTestResults(input);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to analyze blood test report.');
  }
}

export async function getDailySuggestion(
  input: GenerateDailySuggestionInput
): Promise<GenerateDailySuggestionOutput> {
  try {
    return await generateDailySuggestion(input);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to generate daily suggestion.');
  }
}

export async function saveSleepLogAction(quality: string) {
    try {
        const userId = await getCurrentUserIdFromSession();
        if (!userId) {
            throw new Error('User not authenticated.');
        }
        await saveSleepLog({ quality, userId });
    } catch (error) {
        console.error('Failed to save sleep log:', error);
        throw new Error('Could not save your sleep quality. Please try again.');
    }
}
