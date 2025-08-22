

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Target,
  Clock,
  TestTube2,
  Replace,
} from 'lucide-react';
import Link from 'next/link';
import { TodaySummary } from '@/components/today-summary';
import { DailyAiSuggestion, DailyAiSuggestionSkeleton } from '@/components/daily-ai-suggestion';
import { Suspense } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardHeader />

      <TodaySummary />

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
