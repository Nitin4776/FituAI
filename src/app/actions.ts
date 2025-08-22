
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
    analyzeMeal,
    type AnalyzeMealInput,
    type AnalyzeMealOutput,
} from '@/ai/flows/analyze-meal';
import { saveSleepLog, addMeal as addMealToDb, deleteMeal as deleteMealFromDb, updateMeal as updateMealInDb, updateDailySummaryOnMealChange } from '@/services/firestore';
import { auth } from '@/lib/firebase.server';
import { cookies } from 'next/headers';
import type { MealLog } from '@/lib/types';
import { deleteMeal, updateMeal } from '@/services/firestore.server';

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

export async function analyzeAndAddMeal(mealData: { mealName: string, quantity: string, description?: string, mealType: MealLog['mealType'] }): Promise<string> {
    const userId = await getCurrentUserIdFromSession();
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    try {
        const nutritionalInfo = await analyzeMeal(mealData);
        const fullMealData: Omit<MealLog, 'id' | 'createdAt'> = {
            ...mealData,
            ...nutritionalInfo
        };
        const mealId = await addMealToDb(fullMealData);
        await updateDailySummaryOnMealChange(nutritionalInfo);

        return mealId;
    } catch (error) {
        console.error('Failed to analyze and add meal:', error);
        throw new Error('Could not add your meal. Please try again.');
    }
}

export async function updateMealAction(mealId: string, oldMacros: AnalyzeMealOutput, updatedData: { mealName: string, quantity: string, description?: string, mealType: MealLog['mealType'] }) {
    const userId = await getCurrentUserIdFromSession();
    if (!userId) {
        throw new Error("User not authenticated.");
    }
    
    try {
        const newMacros = await analyzeMeal(updatedData);
        const fullUpdatedData = { ...updatedData, ...newMacros };

        await updateMealInDb(mealId, fullUpdatedData);

        // Reverse old macros and add new ones
        const macroDiff = {
            calories: newMacros.calories - oldMacros.calories,
            protein: newMacros.protein - oldMacros.protein,
            carbs: newMacros.carbs - oldMacros.carbs,
            fats: newMacros.fats - oldMacros.fats,
            fiber: newMacros.fiber - oldMacros.fiber,
        };
        await updateDailySummaryOnMealChange(macroDiff);

    } catch (error) {
        console.error('Failed to update meal:', error);
        throw new Error('Could not update your meal. Please try again.');
    }
}

export async function deleteMealAction(meal: MealLog) {
    const userId = await getCurrentUserIdFromSession();
    if (!userId) {
        throw new Error("User not authenticated.");
    }

    try {
        await deleteMeal(userId, meal.id);
        const { calories, protein, carbs, fats, fiber } = meal;
        // Subtract the deleted meal's macros from the daily summary
        await updateDailySummaryOnMealChange({
            calories: -calories,
            protein: -protein,
            carbs: -carbs,
            fats: -fats,
            fiber: -fiber
        });
    } catch (error) {
        console.error('Failed to delete meal:', error);
        throw new Error('Could not delete the meal. Please try again.');
    }
}
