
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
import {
    analyzeActivity as analyzeActivityFlow,
    type AnalyzeActivityInput,
    type AnalyzeActivityOutput
} from '@/ai/flows/analyze-activity';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';


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

export async function analyzeActivity(
    input: AnalyzeActivityInput
): Promise<AnalyzeActivityOutput> {
    try {
        return await analyzeActivityFlow(input);
    } catch (error) {
        console.error('Failed to analyze activity:', error);
        throw new Error('Could not analyze your activity. Please try again.');
    }
}
