
import { AiMealPlan } from '@/components/ai-meal-plan';
import { Sparkles } from 'lucide-react';

export default function AiMealPlanPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary flex items-center gap-2">
            AI Meal Plan Generator <Sparkles className="text-yellow-500" />
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Let our AI create a personalized meal plan for your day based on your preferences.
        </p>
      </div>
      <AiMealPlan />
    </div>
  );
}
