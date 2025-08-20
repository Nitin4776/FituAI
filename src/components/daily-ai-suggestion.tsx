
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getMeals, getActivities, getBloodTestAnalyses, getSleepLogForToday } from '@/services/firestore';
import { getDailySuggestion } from '@/app/actions';
import { isToday } from '@/lib/utils';
import { Bot, Lightbulb } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

async function getSuggestionData() {
    const [savedMeals, savedActivities, savedAnalyses, savedSleep] = await Promise.all([
        getMeals(),
        getActivities(),
        getBloodTestAnalyses(),
        getSleepLogForToday()
    ]);

    const todaysMeals = (savedMeals as any[]).filter(meal => isToday(meal.createdAt));
    const todaysActivities = (savedActivities as any[]).filter(activity => isToday(activity.createdAt));
    const latestBloodTest = savedAnalyses?.[0] || null;
    const todaysSleep = savedSleep || null;

    const suggestionInput = {
        todaysMeals,
        todaysActivities,
        latestBloodTest,
        todaysSleep,
    };
    
    try {
        const { suggestion } = await getDailySuggestion(suggestionInput);
        return suggestion;
    } catch (error) {
        console.error("Failed to get daily suggestion:", error);
        if (error instanceof Error && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'))) {
            return "The AI coach is very popular right now! Please try again in a moment.";
        }
        return "Could not load a suggestion at this time. Please check your connection.";
    }
}


export async function DailyAiSuggestion() {
  const suggestion = await getSuggestionData();

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="font-headline flex items-center gap-2">
            <Bot className="text-primary" />
            AI Daily Suggestion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
            <Lightbulb className="h-6 w-6 text-yellow-500 mt-1" />
            <p className="text-muted-foreground text-md">{suggestion}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyAiSuggestionSkeleton() {
  return (
     <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
             <Bot />
             AI Daily Suggestion
        </CardTitle>
      </CardHeader>
      <CardContent>
          <div className="flex items-start gap-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
           </div>
      </CardContent>
    </Card>
  )
}
