
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Target,
  Clock,
  Bot,
  PlusCircle,
  Soup,
  Dumbbell
} from 'lucide-react';
import Link from 'next/link';
import { TodaySummary } from '@/components/today-summary';
import { DashboardHeader } from '@/components/dashboard-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AiDailySuggestion } from '@/components/ai-daily-suggestion';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardHeader />

      <TodaySummary />

      <AiDailySuggestion />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
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
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Card className="hover:shadow-lg transition-shadow h-full hover:bg-accent/10 cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Log Your Day
                    </CardTitle>
                    <PlusCircle className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                    <p className="text-xs text-muted-foreground">
                        Track your meals and activities to stay on top of your goals.
                    </p>
                    </CardContent>
                </Card>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center">
                <DropdownMenuLabel>What would you like to log?</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/log-meal" className="flex items-center gap-2 cursor-pointer">
                        <Soup className="size-4" />
                        <span>Log Meal/Food</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                        <Link href="/log-activity" className="flex items-center gap-2 cursor-pointer">
                        <Dumbbell className="size-4" />
                        <span>Log Activity/Workout</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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
