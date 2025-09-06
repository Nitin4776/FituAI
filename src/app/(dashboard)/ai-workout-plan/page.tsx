
'use client';

import { AiWorkoutPlan } from '@/components/ai-workout-plan';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import { useSubscription } from '@/hooks/use-subscription';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, HeartPulse } from 'lucide-react';

export default function AiWorkoutPlanPage() {
  const { isSubscribed, loading } = useSubscription();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary flex items-center gap-2">
            AI Workout Plan Generator <Sparkles className="text-yellow-500" />
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Let our AI craft a personalized, progressive 7-day workout plan based on your goals.
        </p>
      </div>
       {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : isSubscribed ? (
        <AiWorkoutPlan />
      ) : (
        <UpgradePrompt featureName="AI Workout Plan Generator" />
      )}
    </div>
  );
}
