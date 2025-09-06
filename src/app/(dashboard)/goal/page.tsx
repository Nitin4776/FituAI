
'use client';

import { GoalForm } from '@/components/goal-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GoalPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Goal</h1>
        <p className="mt-2 text-lg text-muted-foreground">
            Set your goal to get personalized recommendations.
        </p>
      </div>
      <GoalForm />
       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            AI Workout Plan <Sparkles className="text-yellow-500" />
          </CardTitle>
          <CardDescription>
            Let our AI generate a personalized workout plan based on your goals and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>
            <Sparkles className="mr-2" />
            Generate Workout Plan (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
