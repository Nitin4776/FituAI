
import { AiMealPlan } from '@/components/ai-meal-plan';

export default function AiMealPlanPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">AI Meal Plan Generator</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Let our AI create a personalized meal plan for your day based on your preferences.
        </p>
      </div>
      <AiMealPlan />
    </div>
  );
}
