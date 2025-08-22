
import { config } from 'dotenv';
config();

import '@/ai/flows/blood-test-results-analysis.ts';
import '@/ai/flows/healthy-swap-suggestions.ts';
import '@/ai/flows/generate-daily-suggestion.ts';
import '@/ai/flows/analyze-meal.ts';
import '@/ai/flows/analyze-meal-from-image.ts';
import '@/ai/flows/analyze-activity.ts';
