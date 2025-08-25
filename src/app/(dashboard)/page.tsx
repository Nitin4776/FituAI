
'use client';

import { useState } from 'react';
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
  Dumbbell,
  GlassWater
} from 'lucide-react';
import Link from 'next/link';
import { TodaySummary } from '@/components/today-summary';
import { DashboardHeader } from '@/components/dashboard-header';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AiDailySuggestion } from '@/components/ai-daily-suggestion';

export default function DashboardPage() {
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      <DashboardHeader />

      <TodaySummary />

      <AiDailySuggestion />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <Link href="/goal">
          <Card className="hover:shadow-lg transition-shadow h-full hover:bg-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Goal
              </CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Set your goal to get personalized recommendations.
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
         <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
            <DialogTrigger asChild>
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
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>What would you like to log?</DialogTitle>
                    <DialogDescription>
                        Choose whether you want to log a meal, activity, or water intake.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 pt-4">
                     <Link href="/log-meal" onClick={() => setIsLogDialogOpen(false)}>
                        <Button variant="outline" className="w-full h-16 justify-start text-left">
                           <Soup className="mr-4 text-primary" />
                           <div>
                                <p className="font-semibold">Log Meal / Food</p>
                                <p className="text-xs text-muted-foreground">Calculate nutritional info for your meals.</p>
                           </div>
                        </Button>
                     </Link>
                     <Link href="/log-activity" onClick={() => setIsLogDialogOpen(false)}>
                        <Button variant="outline" className="w-full h-16 justify-start text-left">
                           <Dumbbell className="mr-4 text-primary" />
                            <div>
                                <p className="font-semibold">Log Activity / Workout</p>
                                <p className="text-xs text-muted-foreground">Estimate calories burned from your workouts.</p>
                           </div>
                        </Button>
                     </Link>
                     <Link href="/log-water" onClick={() => setIsLogDialogOpen(false)}>
                        <Button variant="outline" className="w-full h-16 justify-start text-left">
                           <GlassWater className="mr-4 text-primary" />
                           <div>
                                <p className="font-semibold">Log Water Intake</p>
                                <p className="text-xs text-muted-foreground">Track your daily water consumption.</p>
                           </div>
                        </Button>
                     </Link>
                </div>
            </DialogContent>
        </Dialog>
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
