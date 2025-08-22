
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
import {
    generateMealPlan as generateMealPlanFlow,
    type GenerateMealPlanInput,
    type GenerateMealPlanOutput
} from '@/ai/flows/generate-meal-plan';
import {
    getDailySuggestion as getDailySuggestionFlow,
    type DailySuggestionInput
} from '@/ai/flows/daily-suggestion';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getProfile, getBloodTestAnalyses, getTodaysMeals, getTodaysActivities, getSleepLogForToday } from '@/services/firestore';


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

export async function generateMealPlan(
    input: GenerateMealPlanInput
): Promise<GenerateMealPlanOutput> {
    try {
        return await generateMealPlanFlow(input);
    } catch (error) {
        console.error('Failed to generate meal plan:', error);
        throw new Error('Could not generate a meal plan. Please try again.');
    }
}

export async function getAiDailySuggestion(): Promise<string> {
    try {
        const [profile, bloodTests, meals, activities, sleep] = await Promise.all([
            getProfile(),
            getBloodTestAnalyses(),
            getTodaysMeals(),
            getTodaysActivities(),
            getSleepLogForToday(),
        ]);
        
        // The AI is capable of handling a missing profile, so we pass it directly.
        if (!profile) {
            return "Set up your profile and goals to receive personalized daily suggestions.";
        }

        const flowInput: DailySuggestionInput = {
            profile: profile,
            latestBloodTest: bloodTests?.[0], // Get the most recent one
            todaysMeals: meals,
            todaysActivities: activities,
            todaysSleep: sleep,
        };
        
        const { suggestion } = await getDailySuggestionFlow(flowInput);
        return suggestion;

    } catch (error) {
        console.error('Failed to get AI daily suggestion:', error);
        return 'Could not generate a suggestion at this time. Please try again later.';
    }
}
