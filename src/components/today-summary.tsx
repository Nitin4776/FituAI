
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getMeals, getProfile, getActivities } from '@/services/firestore';
import { Skeleton } from './ui/skeleton';
import { Flame, Drumstick, Wheat, Beef } from 'lucide-react';
import { isToday } from '@/lib/utils';
import type { MealLog, ActivityLog } from '@/lib/types';
import { SleepTracker } from './sleep-tracker';


async function getSummaryData() {
    const [savedMeals, profile, savedActivities] = await Promise.all([getMeals(), getProfile(), getActivities()]);

    let dailyGoal = 2000; // Default goal
    let macroGoals = { protein: 150, carbs: 250, fats: 67, fiber: 30 }; // Default macro goals

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

        macroGoals = {
            protein: Math.round((dailyGoal * 0.3) / 4),
            carbs: Math.round((dailyGoal * 0.4) / 4),
            fats: Math.round((dailyGoal * 0.3) / 9),
            fiber: Math.round((dailyGoal / 1000) * 14),
        }
    }

    const todaysMeals = (savedMeals as MealLog[]).filter(meal => isToday(meal.createdAt));
    const dailyTotals = todaysMeals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
        acc.fiber += meal.fiber || 0; // handle meals logged before fiber was added
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
    
    const todaysActivities = (savedActivities as ActivityLog[]).filter(activity => isToday(activity.createdAt));
    const caloriesBurned = todaysActivities.reduce((acc, activity) => acc + activity.caloriesBurned, 0);

    return { dailyTotals, dailyGoal, caloriesBurned, macroGoals };
}

function MacroProgress({ label, consumed, goal, icon: Icon }: { label: string; consumed: number; goal: number; icon: React.ElementType; }) {
    const percentage = goal > 0 ? Math.round((consumed / goal) * 100) : 0;
    return (
        <div>
            <div className='flex items-center justify-center gap-1 text-sm text-muted-foreground'>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
            </div>
            <p className="font-bold text-lg">{Math.round(consumed)}g</p>
            <p className="text-xs text-muted-foreground">{percentage}% of goal</p>
        </div>
    )
}

function CaloriesBurned({ burned }: { burned: number }) {
     return (
        <div>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Flame className="h-4 w-4 text-orange-500" /> Burned</p>
            <p className="font-bold text-lg">{Math.round(burned)} kcal</p>
            <p className="text-xs text-muted-foreground">&nbsp;</p>
        </div>
    )
}

function getCalorieStatusMessage(consumed: number, goal: number): string {
  if (goal <= 0) {
    return "Set up your profile to get calorie tracking.";
  }
  if (consumed === 0) {
    return "No calories logged yet. Let's get tracking!";
  }
  const percentage = (consumed / goal) * 100;
  if (percentage < 50) {
    return "You're off to a great start today!";
  }
  if (percentage <= 100) {
    return "You're right on track with your goal.";
  }
  if (percentage <= 110) {
    return "You've hit your goal! Keep it up.";
  }
  return "You've exceeded your daily calorie goal.";
}


export async function TodaySummary() {
  const { dailyTotals, dailyGoal, caloriesBurned, macroGoals } = await getSummaryData();
  const calorieProgress = dailyGoal > 0 ? (dailyTotals.calories / dailyGoal) * 100 : 0;
  const statusMessage = getCalorieStatusMessage(dailyTotals.calories, dailyGoal);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline">Today's Summary</CardTitle>
                <CardDescription>Your nutritional intake for today against your goal.</CardDescription>
            </div>
            <SleepTracker />
        </div>
      </CardHeader>
      <CardContent>
          <div className="space-y-4">
              <div>
                  <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Calories Consumed</span>
                      <span className="text-sm font-medium">{Math.round(dailyTotals.calories)} / {dailyGoal} kcal</span>
                  </div>
                  <Progress value={calorieProgress} className="h-2"/>
                  <p className="text-xs text-center text-muted-foreground mt-2">{statusMessage}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <MacroProgress label="Protein" consumed={dailyTotals.protein} goal={macroGoals.protein} icon={Drumstick} />
                  <MacroProgress label="Carbs" consumed={dailyTotals.carbs} goal={macroGoals.carbs} icon={Wheat} />
                  <MacroProgress label="Fats" consumed={dailyTotals.fats} goal={macroGoals.fats} icon={Beef} />
                  <MacroProgress label="Fiber" consumed={dailyTotals.fiber} goal={macroGoals.fiber} icon={Wheat} />
                  <CaloriesBurned burned={caloriesBurned} />
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
