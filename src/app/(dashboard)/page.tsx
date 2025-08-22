

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
  Bot,
} from 'lucide-react';
import Link from 'next/link';
import { TodaySummary } from '@/components/today-summary';
import { DashboardHeader } from '@/components/dashboard-header';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardHeader />

      <TodaySummary />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/profile">
          <Card className="hover:shadow-lg transition-shadow h-full hover:bg-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Profile
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
        <Link href="/ai">
          <Card className="hover:shadow-lg transition-shadow h-full hover:bg-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                AI Features
              </CardTitle>
              <Bot className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Explore AI-powered health insights.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
