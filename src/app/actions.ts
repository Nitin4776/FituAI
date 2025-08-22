
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
import {
    analyzeMeal as analyzeMealFlow,
    type AnalyzeMealInput,
    type AnalyzeMealOutput,
} from '@/ai/flows/analyze-meal';
import {
    analyzeMealFromImage as analyzeMealFromImageFlow,
    type AnalyzeMealFromImageInput,
    type AnalyzeMealFromImageOutput,
} from '@/ai/flows/analyze-meal-from-image';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { saveSleepLog } from '@/services/firestore';


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

export async function analyzeMeal(
    input: AnalyzeMealInput
): Promise<AnalyzeMealOutput> {
    try {
        return await analyzeMealFlow(input);
    } catch (error) {
        console.error('Failed to analyze meal:', error);
        throw new Error('Could not analyze your meal. Please try again.');
    }
}

export async function analyzeMealFromImage(
    input: AnalyzeMealFromImageInput
): Promise<AnalyzeMealFromImageOutput> {
    try {
        return await analyzeMealFromImageFlow(input);
    } catch (error) {
        console.error('Failed to analyze meal from image:', error);
        throw new Error('Could not analyze your meal from the image. Please try again.');
    }
}

export async function saveSleepLogAction(quality: string) {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    try {
        await saveSleepLog({ quality, userId: user.uid });
    } catch (error) {
        console.error('Failed to save sleep log:', error);
        throw new Error('Could not save your sleep log. Please try again.');
    }
}
