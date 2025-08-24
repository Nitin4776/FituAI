'use client';

import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User } from 'lucide-react';

export function DashboardHeader() {
  const { user, loading } = useAuth();

  if (loading) {
    return <DashboardHeaderSkeleton />;
  }

  return (
    <header className="flex justify-between items-center">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">
          Welcome, {user?.displayName || 'fitUAI User'}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your personalized AI-powered health and fitness companion.
        </p>
      </div>
       <Link href="/profile">
        <Avatar className="h-12 w-12 cursor-pointer border-2 border-primary/50 hover:border-primary transition-colors">
          <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <header className="flex justify-between items-center">
        <div>
            <Skeleton className="h-9 w-48 md:w-72 rounded-md" />
            <Skeleton className="h-5 w-64 md:w-96 mt-3 rounded-md" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
    </header>
  )
}
