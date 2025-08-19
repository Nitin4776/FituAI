import { config } from 'dotenv';
config();

import '@/ai/flows/blood-test-results-analysis.ts';
import '@/ai/flows/healthy-swap-suggestions.ts';
import '@/ai/flows/calculate-meal-macros.ts';
import '@/ai/flows/calculate-activity-calories.ts';
import '@/ai/flows/generate-meal-plan.ts';
