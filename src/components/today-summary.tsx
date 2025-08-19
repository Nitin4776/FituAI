import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getMeals, getProfile, getActivities } from '@/services/firestore';
import { Skeleton } from './ui/skeleton';
import { Flame } from 'lucide-react';

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

type ActivityLog = {
  id: string;
  activity: string;
  duration: number;
  caloriesBurned: number;
  createdAt: { seconds: number, nanoseconds: number };
}

const isToday = (timestamp: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return false;
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

async function getSummaryData() {
    const [savedMeals, profile, savedActivities] = await Promise.all([getMeals(), getProfile(), getActivities()]);

    let dailyGoal = 2000; // Default goal
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
        dailyGoal = Math.round(tdee + goalAdjustments[profile.goal as keyof typeof goalAdjustments]);
    }

    const todaysMeals = (savedMeals as MealLog[]).filter(meal => isToday(meal.createdAt));
    const dailyTotals = todaysMeals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    
    const todaysActivities = (savedActivities as ActivityLog[]).filter(activity => isToday(activity.createdAt));
    const caloriesBurned = todaysActivities.reduce((acc, activity) => acc + activity.caloriesBurned, 0);

    return { dailyTotals, dailyGoal, caloriesBurned };
}


export async function TodaySummary() {
  const { dailyTotals, dailyGoal, caloriesBurned } = await getSummaryData();
  const calorieProgress = dailyGoal > 0 ? (dailyTotals.calories / dailyGoal) * 100 : 0;

  return (
    <Card>
      <CardHeader>
          <CardTitle className="font-headline">Today's Summary</CardTitle>
          <CardDescription>Your nutritional intake for today against your goal.</CardDescription>
      </CardHeader>
      <CardContent>
          <div className="space-y-4">
              <div>
                  <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Calories Consumed</span>
                      <span className="text-sm font-medium">{Math.round(dailyTotals.calories)} / {dailyGoal} kcal</span>
                  </div>
                  <Progress value={calorieProgress} className="h-2"/>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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
                  <div>
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Flame className="h-4 w-4 text-orange-500" /> Burned</p>
                      <p className="font-bold text-lg">{Math.round(caloriesBurned)} kcal</p>
                  </div>
              </div>
          </div>
      </CardContent>
    </Card>
  );
}

export function TodaySummarySkeleton() {
  return (
     <Card>
      <CardHeader>
          <CardTitle className="font-headline">Today's Summary</CardTitle>
          <CardDescription>Your nutritional intake for today against your goal.</CardDescription>
      </CardHeader>
      <CardContent>
          <div className="flex items-center justify-center h-24">
             <Skeleton className="h-24 w-full" />
           </div>
      </CardContent>
    </Card>
  )
}
