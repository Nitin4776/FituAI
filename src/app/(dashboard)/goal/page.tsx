
'use client';

import { GoalForm } from '@/components/goal-form';

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
    </div>
  );
}
