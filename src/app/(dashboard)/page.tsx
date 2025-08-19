import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, User, HeartPulse } from "lucide-react";
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Welcome to FitLife AI</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your personalized AI-powered health and fitness companion.
          Track your progress, get insights, and build a healthier lifestyle.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/profile">
          <Card className="hover:shadow-lg transition-shadow h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
              <User className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">Get Started</div>
              <p className="text-xs text-muted-foreground">
                Set up your profile to calculate your fitness metrics.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/healthy-swaps">
          <Card className="hover:shadow-lg transition-shadow h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Features</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">Supercharge Your Health</div>
              <p className="text-xs text-muted-foreground">
                Use AI for food swaps and blood test analysis.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/activity">
          <Card className="hover:shadow-lg transition-shadow h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Track Everything</CardTitle>
              <HeartPulse className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">Log Your Day</div>
              <p className="text-xs text-muted-foreground">
                Keep track of your activities and meals.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
