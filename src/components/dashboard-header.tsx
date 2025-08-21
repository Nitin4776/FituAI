'use client';

import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';

export function DashboardHeader() {
  const { user } = useAuth();

  return (
    <header>
      <h1 className="font-headline text-3xl md:text-4xl text-primary">
        Welcome, {user?.displayName || 'fitUAI User'}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Your personalized AI-powered health and fitness companion.
      </p>
    </header>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <header>
      <Skeleton className="h-9 w-1/2 rounded-md" />
      <Skeleton className="h-5 w-3/4 mt-3 rounded-md" />
    </header>
  )
}
