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
import { deleteActivity, deleteMeal, getProfile } from '@/services/firestore';

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
        await deleteMeal(mealId);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to delete meal.');
    }
}

export async function deleteActivityAction(activityId: string): Promise<void> {
    try {
        await deleteActivity(activityId);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to delete activity.');
    }
}

export async function generateMealPlanAction(
    input: Omit<GenerateMealPlanInput, 'goal' | 'calories'>
): Promise<GenerateMealPlanOutput> {
    try {
        const profile = await getProfile();
        if (!profile) {
            throw new Error('User profile not found. Please set up your profile first.');
        }
        
        const heightInMeters = profile.height / 100;
        const bmr =
        profile.gender === 'male'
            ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
            : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;

        const activityMultipliers = {
            sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
        };
        const goalAdjustments = { lose: -500, maintain: 0, gain: 500 };
        const tdee = bmr * activityMultipliers[profile.activityLevel as keyof typeof activityMultipliers];
        const dailyGoal = Math.round(tdee + goalAdjustments[profile.goal as keyof typeof goalAdjustments]);

        const fullInput: GenerateMealPlanInput = {
            ...input,
            goal: profile.goal,
            calories: dailyGoal,
        }
        
        return await generateMealPlan(fullInput);

    } catch (error) {
        console.error(error);
        throw new Error('Failed to generate meal plan.');
    }
}
