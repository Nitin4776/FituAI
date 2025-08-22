
import { MealLogger } from '@/components/meal-logger';

export default function LogMealPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Log Meal / Food</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Log what you've eaten today. Use the `+` icon to add an entry and our AI will calculate the nutrition.
        </p>
      </div>
      <MealLogger />
    </div>
  );
}
