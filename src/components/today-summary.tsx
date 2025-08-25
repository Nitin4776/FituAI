
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getDailySummaryForToday } from '@/services/firestore';
import { Skeleton } from './ui/skeleton';
import { Flame, Drumstick, Wheat, Beef, BarChart, Camera, GlassWater, Plus } from 'lucide-react';
import { SleepTracker } from './sleep-tracker';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getAuth, type User } from 'firebase/auth';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

type SummaryData = {
    dailyTotals: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
        waterGlasses: number;
    };
    dailyGoal: number;
    caloriesBurned: number;
    macroGoals: {
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
    };
    waterGoal: number;
    hasProfile: boolean;
};

function MacroProgress({ label, consumed, goal, icon: Icon, iconClassName }: { label: string; consumed: number; goal: number; icon: React.ElementType; iconClassName?: string; }) {
    const percentage = goal > 0 ? Math.round((consumed / goal) * 100) : 0;
    const chartData = [{ name: label, value: percentage > 120 ? 120 : percentage }]; // Cap at 120 for visual
    
    const getProgressColor = (p: number) => {
        if (p > 105) return "hsl(var(--destructive))";
        if (p < 75) return "hsl(var(--chart-2))";
        return "hsl(var(--chart-1))";
    };

    const percentageColorClass = (p: number) => {
        if (p > 105) return "text-destructive";
        if (p < 75) return "text-yellow-500";
        return "text-green-500";
    }

    return (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 p-2 flex flex-col justify-between items-center h-36">
            <div className='flex items-center justify-center gap-1 text-sm text-muted-foreground'>
                <Icon className={cn("h-4 w-4", iconClassName)} />
                <span>{label}</span>
            </div>
            <div className="w-full h-20 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        innerRadius="70%"
                        outerRadius="100%"
                        data={chartData}
                        startAngle={90}
                        endAngle={-270}
                        barSize={8}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar
                            background
                            dataKey="value"
                            angleAxisId={0}
                            fill={getProgressColor(percentage)}
                            className="stroke-none"
                            cornerRadius={4}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-sm">{Math.round(consumed)}g</p>
                </div>
            </div>
            <p className={cn("text-xs font-semibold", percentageColorClass(percentage))}>
                {percentage}%
            </p>
        </Card>
    )
}

function WaterProgress({ consumed, goal }: { consumed: number, goal: number }) {
    const percentage = goal > 0 ? Math.round((consumed / goal) * 100) : 0;
    const chartData = [{ name: 'Water', value: percentage > 120 ? 120 : percentage }];

    const getProgressColor = (p: number) => {
        if (p > 105) return "hsl(var(--destructive))";
        if (p < 75) return "hsl(var(--chart-2))";
        return "hsl(var(--chart-1))";
    };

    const percentageColorClass = (p: number) => {
        if (p > 105) return "text-destructive";
        if (p < 75) return "text-yellow-500";
        return "text-green-500";
    }

    return (
         <Card className="relative bg-gradient-to-r from-primary/10 to-accent/10 p-2 flex flex-col justify-between items-center h-36">
            <div className='flex items-center justify-center gap-1 text-sm text-muted-foreground'>
                <GlassWater className="h-4 w-4 text-blue-500" />
                <span>Water</span>
            </div>
             <Link href="/log-water" className="absolute top-1 right-1 text-primary/50 hover:text-primary">
                <Plus className="h-4 w-4" />
            </Link>
            <div className="w-full h-20 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        innerRadius="70%"
                        outerRadius="100%"
                        data={chartData}
                        startAngle={90}
                        endAngle={-270}
                        barSize={8}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar
                            background
                            dataKey="value"
                            angleAxisId={0}
                            fill={getProgressColor(percentage)}
                            className="stroke-none"
                            cornerRadius={4}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-lg">{Math.round(consumed)}</p>
                </div>
            </div>
            <p className={cn("text-xs font-semibold", percentageColorClass(percentage))}>
                {Math.round(consumed)}/{goal}
            </p>
        </Card>
    )
}


function CaloriesBurned({ burned }: { burned: number }) {
     return (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 p-2 flex flex-col justify-between items-center h-36 text-center">
            <div className='flex items-center justify-center gap-1 text-sm text-muted-foreground'>
                <Flame className="h-4 w-4 text-orange-500" />
                <span>Burned</span>
            </div>
            <div className="w-full flex-grow flex items-center justify-center">
                <p className="font-bold text-3xl">{Math.round(burned)}</p>
            </div>
             <p className="text-xs font-semibold">kcal</p>
        </Card>
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

  const getSummaryData = useCallback(async () => {
    setIsLoading(true);
    const summary = await getDailySummaryForToday();
    setSummaryData({
      dailyTotals: {
        calories: summary.consumedCalories,
        protein: summary.protein,
        carbs: summary.carbs,
        fats: summary.fats,
        fiber: summary.fiber,
        waterGlasses: summary.waterGlasses,
      },
      dailyGoal: summary.dailyGoal,
      caloriesBurned: summary.caloriesBurned,
      macroGoals: summary.macroGoals,
      waterGoal: summary.waterGoal,
      hasProfile: summary.dailyGoal > 0,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        getSummaryData();
      }
    };

    const unsubscribeAuth = getAuth().onAuthStateChanged((user: User | null) => {
      if (user) {
        getSummaryData();
        // Add listener when user is logged in
        document.addEventListener('visibilitychange', handleVisibilityChange);
      } else {
        setIsLoading(false);
        setSummaryData(null);
        // Remove listener when user logs out
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    });

    return () => {
      unsubscribeAuth();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getSummaryData]);


  if (isLoading || !summaryData) {
      return <TodaySummarySkeleton />;
  }

  const { dailyTotals, dailyGoal, caloriesBurned, macroGoals, waterGoal, hasProfile } = summaryData;
  const calorieProgress = dailyGoal > 0 ? (dailyTotals.calories / dailyGoal) * 100 : 0;
  const statusMessage = getCalorieStatusMessage(dailyTotals.calories, dailyGoal, hasProfile);

  const getProgressVariant = (progress: number): "default" | "warning" | "danger" => {
    if (progress > 105) return "danger";
    if (progress >= 75) return "default";
    return "warning";
  }

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
                        <Link href="/log-meal" className={cn("flex items-center gap-1 text-xs text-accent hover:underline", dailyTotals.calories > 0 ? "" : "animate-pulse")}>
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
                  <Progress value={calorieProgress} variant={getProgressVariant(calorieProgress)} className="h-2"/>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">{statusMessage}</p>
                    <span className="text-sm font-bold">{Math.round(dailyTotals.calories)} / {dailyGoal} kcal</span>
                  </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                  <MacroProgress label="Protein" consumed={dailyTotals.protein} goal={macroGoals.protein} icon={Drumstick} iconClassName="text-red-500" />
                  <MacroProgress label="Carbs" consumed={dailyTotals.carbs} goal={macroGoals.carbs} icon={Wheat} iconClassName="text-yellow-500" />
                  <MacroProgress label="Fats" consumed={dailyTotals.fats} goal={macroGoals.fats} icon={Beef} iconClassName="text-purple-500" />
                  <MacroProgress label="Fiber" consumed={dailyTotals.fiber} goal={macroGoals.fiber} icon={Wheat} iconClassName="text-green-500" />
                  <WaterProgress consumed={dailyTotals.waterGlasses} goal={waterGoal} />
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
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                  {[...Array(6)].map((_, i) => (
                      <div key={i} className="space-y-1">
                          <Skeleton className="h-36 w-full rounded-lg" />
                      </div>
                  ))}
              </div>
          </div>
      </CardContent>
    </Card>
  )
}
