
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getDailySummaryForToday } from '@/services/firestore';
import { Skeleton } from './ui/skeleton';
import { Flame, Drumstick, Wheat, Beef, BarChart, Camera } from 'lucide-react';
import { SleepTracker } from './sleep-tracker';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type SummaryData = {
    dailyTotals: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
    };
    dailyGoal: number;
    caloriesBurned: number;
    macroGoals: {
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
    };
    hasProfile: boolean;
};


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

function getCalorieStatusMessage(consumed: number, goal: number, hasProfile: boolean): string {
  if (!hasProfile) {
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


export function TodaySummary() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getSummaryData() {
        const summary = await getDailySummaryForToday();
        setSummaryData({
            dailyTotals: {
                calories: summary.consumedCalories,
                protein: summary.protein,
                carbs: summary.carbs,
                fats: summary.fats,
                fiber: summary.fiber,
            },
            dailyGoal: summary.dailyGoal,
            caloriesBurned: summary.caloriesBurned,
            macroGoals: summary.macroGoals,
            hasProfile: summary.dailyGoal > 0,
        });
        setIsLoading(false);
    }
    getSummaryData();
  }, []);

  if (isLoading || !summaryData) {
      return <TodaySummarySkeleton />;
  }

  const { dailyTotals, dailyGoal, caloriesBurned, macroGoals, hasProfile } = summaryData;
  const calorieProgress = dailyGoal > 0 ? (dailyTotals.calories / dailyGoal) * 100 : 0;
  const statusMessage = getCalorieStatusMessage(dailyTotals.calories, dailyGoal, hasProfile);

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
                  <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Calories Consumed</span>
                        <Link href="/log-meal" className={cn("flex items-center gap-1 text-xs text-primary hover:underline", dailyTotals.calories > 0 ? "" : "animate-pulse")}>
                           {dailyTotals.calories > 0 ? (
                                <>
                                    <BarChart className="h-3 w-3"/>
                                    <span>Insights</span>
                                </>
                           ) : (
                                <Camera className="h-4 w-4"/>
                           )}
                        </Link>
                  </div>
                  <Progress value={calorieProgress} className="h-2"/>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">{statusMessage}</p>
                    <span className="text-sm font-bold">{Math.round(dailyTotals.calories)} / {dailyGoal} kcal</span>
                  </div>
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
          <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline">Today's Summary</CardTitle>
                <CardDescription>Your nutritional intake for today against your goal.</CardDescription>
              </div>
              {/* Skeleton for sleep tracker */}
               <div className="text-center">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <div className='flex gap-1 items-center justify-center pt-1'>
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                </div>
          </div>
      </CardHeader>
      <CardContent>
          <div className="space-y-4">
              <div>
                  <div className="flex justify-between items-baseline mb-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/6" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <div className="flex justify-between items-center mt-1">
                     <Skeleton className="h-3 w-1/2" />
                     <Skeleton className="h-4 w-1/5" />
                  </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-1">
                          <Skeleton className="h-5 w-5 mx-auto" />
                          <Skeleton className="h-5 w-12 mx-auto" />
                          <Skeleton className="h-3 w-16 mx-auto" />
                      </div>
                  ))}
              </div>
          </div>
      </CardContent>
    </Card>
  )
}
