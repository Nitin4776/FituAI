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
