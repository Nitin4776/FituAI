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
  calculateMealMacros,
  type CalculateMealMacrosInput,
  type CalculateMealMacrosOutput,
} from '@/ai/flows/calculate-meal-macros';
import {
  calculateActivityCalories,
  type CalculateActivityCaloriesInput,
  type CalculateActivityCaloriesOutput,
} from '@/ai/flows/calculate-activity-calories';
import {
    generateMealPlan,
    type GenerateMealPlanInput,
    type GenerateMealPlanOutput,
} from '@/ai/flows/generate-meal-plan';
import {
    analyzeMealImage,
    type AnalyzeMealImageInput,
    type AnalyzeMealImageOutput,
} from '@/ai/flows/analyze-meal-image';
import {
    generateDailySuggestion,
    type GenerateDailySuggestionInput,
    type GenerateDailySuggestionOutput,
} from '@/ai/flows/generate-daily-suggestion';
import { saveSleepLog } from '@/services/firestore';
import { deleteActivity, deleteMeal, getProfile } from '@/services/firestore.server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { initFirebaseAdminApp } from '@/lib/firebase.server';

async function getCurrentUserIdFromSession() {
    initFirebaseAdminApp();
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        return null;
    }
    try {
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
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

export async function getMealMacros(
  input: CalculateMealMacrosInput
): Promise<CalculateMealMacrosOutput> {
  try {
    return await calculateMealMacros(input);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to calculate meal macros.');
  }
}

export async function getActivityCalories(
  input: CalculateActivityCaloriesInput
): Promise<CalculateActivityCaloriesOutput> {
  try {
    return await calculateActivityCalories(input);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to calculate activity calories.');
  }
}

export async function deleteMealAction(mealId: string): Promise<void> {
    try {
        const userId = await getCurrentUserIdFromSession();
        if (!userId) {
            throw new Error("User not authenticated");
        }
        await deleteMeal(userId, mealId);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to delete meal.');
    }
}

export async function deleteActivityAction(activityId: string): Promise<void> {
    try {
        const userId = await getCurrentUserIdFromSession();
        if (!userId) {
            throw new Error("User not authenticated");
        }
        await deleteActivity(userId, activityId);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to delete activity.');
    }
}

export async function generateMealPlanAction(
    input: GenerateMealPlanInput
): Promise<GenerateMealPlanOutput> {
    try {
        const userId = await getCurrentUserIdFromSession();
        if (!userId) {
            throw new Error('User not authenticated.');
        }

        const profile = await getProfile(userId);
        if (!profile || !profile.dailyCalories) {
            throw new Error('User profile with a calorie goal not found. Please set up your profile and goal first.');
        }

        return await generateMealPlan({
            ...input,
            calories: profile.dailyCalories,
            goal: profile.goal || 'maintain',
        });
    } catch (error) {
        console.error(error);
        throw new Error((error as Error).message || 'Failed to generate meal plan.');
    }
}

export async function analyzeMealImageAction(
    input: AnalyzeMealImageInput
): Promise<AnalyzeMealImageOutput> {
    try {
        return await analyzeMealImage(input);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to analyze meal image.');
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