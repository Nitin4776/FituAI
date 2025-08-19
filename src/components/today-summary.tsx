'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { getMeals, getProfile } from '@/services/firestore';

type MealLog = {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealName: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  createdAt: { seconds: number, nanoseconds: number };
};

const isToday = (timestamp: { seconds: number; nanoseconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

export function TodaySummary() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [dailyGoal, setDailyGoal] = useState(2000); // Default goal
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [savedMeals, profile] = await Promise.all([getMeals(), getProfile()]);

      if (profile) {
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
        setDailyGoal(Math.round(tdee + goalAdjustments[profile.goal as keyof typeof goalAdjustments]));
      }

      setMeals(savedMeals as MealLog[]);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const dailyTotals = useMemo(() => {
    const todaysMeals = meals.filter(meal => isToday(meal.createdAt));
    return todaysMeals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [meals]);

  const calorieProgress = dailyGoal > 0 ? (dailyTotals.calories / dailyGoal) * 100 : 0;

  return (
    <Card>
      <CardHeader>
          <CardTitle className="font-headline">Today's Summary</CardTitle>
          <CardDescription>Your nutritional intake for today against your goal.</CardDescription>
      </CardHeader>
      <CardContent>
          {isLoading ? (
               <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
          ) : (
          <div className="space-y-4">
              <div>
                  <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Calories</span>
                      <span className="text-sm font-medium">{Math.round(dailyTotals.calories)} / {dailyGoal} kcal</span>
                  </div>
                  <Progress value={calorieProgress} className="h-2"/>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                      <p className="text-sm text-muted-foreground">Protein</p>
                      <p className="font-bold text-lg">{Math.round(dailyTotals.protein)}g</p>
                  </div>
                  <div>
                      <p className="text-sm text-muted-foreground">Carbs</p>
                      <p className="font-bold text-lg">{Math.round(dailyTotals.carbs)}g</p>
                  </div>
                  <div>
                      <p className="text-sm text-muted-foreground">Fats</p>
                      <p className="font-bold text-lg">{Math.round(dailyTotals.fats)}g</p>
                  </div>
              </div>
          </div>
          )}
      </CardContent>
    </Card>
  );
}
