
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { getDailySuggestion, type DailySuggestionInput } from '@/ai/flows/daily-suggestion';
import { getProfile, getBloodTestAnalyses, getTodaysMeals, getTodaysActivities, getSleepLogForToday } from '@/services/firestore';

export function AiDailySuggestion() {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuggestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profile, bloodTests, meals, activities, sleep] = await Promise.all([
          getProfile(),
          getBloodTestAnalyses(),
          getTodaysMeals(),
          getTodaysActivities(),
          getSleepLogForToday(),
      ]);
      
      if (!profile || !profile.goal) {
          setSuggestion("Set up your profile and goals to receive personalized daily suggestions.");
          setIsLoading(false);
          return;
      }

      // Convert complex Firestore objects to plain JSON-serializable objects
      const flowInput: DailySuggestionInput = JSON.parse(JSON.stringify({
          profile: profile,
          latestBloodTest: bloodTests?.[0], // Get the most recent one
          todaysMeals: meals,
          todaysActivities: activities,
          todaysSleep: sleep,
      }));
      
      const { suggestion } = await getDailySuggestion(flowInput);
      setSuggestion(suggestion);

    } catch (error) {
      console.error("Error fetching daily suggestion:", error);
      setSuggestion("Sorry, I couldn't fetch a suggestion right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestion();
  }, [fetchSuggestion]);

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="font-headline flex items-center gap-2">
            <Lightbulb className="text-primary" />
            AI Daily Suggestion
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchSuggestion} disabled={isLoading}>
                <RefreshCw className={isLoading ? "animate-spin" : ""} />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: suggestion || '' }} />
        )}
      </CardContent>
    </Card>
  );
}
