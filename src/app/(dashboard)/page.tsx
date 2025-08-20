import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Target,
  HeartPulse,
  Utensils,
  Clock,
  TestTube2,
  Replace,
} from 'lucide-react';
import Link from 'next/link';
import { TodaySummary, TodaySummarySkeleton } from '@/components/today-summary';
import { DailyAiSuggestion, DailyAiSuggestionSkeleton } from '@/components/daily-ai-suggestion';
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">
          Welcome to FitLife AI
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your personalized AI-powered health and fitness companion. Track your
          progress, get insights, and build a healthier lifestyle.
        </p>
      </header>

      <Suspense fallback={<TodaySummarySkeleton />}>
        <TodaySummary />
      </Suspense>

      <Suspense fallback={<DailyAiSuggestionSkeleton />}>
        <DailyAiSuggestion />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/profile">
          <Card className="hover:shadow-lg transition-shadow h-full hover:bg-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Profile & Goal
              </CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Set up your profile to calculate your fitness metrics.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/activity">
          <Card className="hover:shadow-lg transition-shadow h-full hover:bg-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Activity Tracker
              </CardTitle>
              <HeartPulse className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Keep track of your activities and workouts.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/meals">
          <Card className="hover:shadow-lg transition-shadow h-full hover:bg-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meal Planner</CardTitle>
              <Utensils className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Log your meals to track your nutrition.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/fasting">
          <Card className="hover:shadow-lg transition-shadow h-full hover:bg-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Intermittent Fasting
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Explore fasting schedules and their benefits.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/healthy-swaps">
          <Card className="hover:shadow-lg transition-shadow h-full hover:bg-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Healthy Swaps
              </CardTitle>
              <Replace className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Get AI-powered food swap suggestions.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/blood-test">
          <Card className="hover:shadow-lg transition-shadow h-full hover:bg-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Blood Test Analysis
              </CardTitle>
              <TestTube2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Upload your report for an AI analysis.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
