import { MealPlanner } from '@/components/meal-planner';

export default function MealsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Meal Planner</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Log your daily meals to keep track of your nutrition.
        </p>
      </div>
      <MealPlanner />
    </div>
  );
}
