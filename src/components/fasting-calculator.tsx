'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause, RefreshCw, Sunrise, Sunset, Zap, Loader2 } from 'lucide-react';
import { getFastingState, saveFastingState } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';

type FastingPlan = '16:8' | '18:6' | '20:4';

const fastingPlans = {
  '16:8': {
    name: '16:8 Method (Leangains)',
    fastingHours: 16,
    eatingHours: 8,
    description: 'A popular choice for beginners. It involves fasting for 16 hours and restricting your eating window to 8 hours. Many find it easy to adapt to their daily schedule.',
  },
  '18:6': {
    name: '18:6 Method',
    fastingHours: 18,
    eatingHours: 6,
    description: 'A slightly more advanced approach with a longer fasting period. This can potentially lead to greater benefits in terms of fat loss and autophagy.',
  },
  '20:4': {
    name: '20:4 Method (The Warrior Diet)',
    fastingHours: 20,
    eatingHours: 4,
    description: 'This is an advanced form of intermittent fasting, involving a 20-hour fast and a 4-hour eating window. It typically involves one large meal per day.',
  },
};

const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 90; // 2 * pi * radius

export function FastingCalculator() {
  const [selectedPlan, setSelectedPlan] = useState<FastingPlan>('16:8');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const planDetails = fastingPlans[selectedPlan];
  const totalDuration = planDetails.fastingHours * 3600;

  useEffect(() => {
    async function loadState() {
      setIsLoading(true);
      const state = await getFastingState();
      if (state) {
        setSelectedPlan(state.plan);
        if (state.endTime && state.isRunning) {
            const now = Date.now();
            const remaining = Math.max(0, Math.round((state.endTime - now) / 1000));
            if (remaining > 0) {
                setTimeRemaining(remaining);
                setEndTime(state.endTime);
                setIsRunning(true);
            } else {
                handleReset();
            }
        } else {
             setTimeRemaining(fastingPlans[state.plan as FastingPlan].fastingHours * 3600);
        }
      } else {
         setTimeRemaining(planDetails.fastingHours * 3600);
      }
      setIsLoading(false);
    }
    loadState();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isRunning && timeRemaining <= 0) {
      setIsRunning(false);
      setEndTime(null);
      toast({
        title: "Fast Complete!",
        description: "You've successfully completed your fast. Time to eat!",
      });
      saveFastingState({ plan: selectedPlan, isRunning: false, endTime: null });
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, toast, selectedPlan]);

  const handlePlanChange = (plan: FastingPlan) => {
    if (isRunning) {
        toast({ variant: 'destructive', title: "Cannot change plan while timer is running."});
        return;
    }
    setSelectedPlan(plan);
    setTimeRemaining(fastingPlans[plan].fastingHours * 3600);
    saveFastingState({ plan: plan, isRunning: false, endTime: null });
  }

  const handleStartStop = () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);

    let newEndTime: number | null;
    if (newIsRunning) {
        newEndTime = Date.now() + timeRemaining * 1000;
        setEndTime(newEndTime);
    } else {
        newEndTime = endTime; // Keep endTime when pausing
    }
    
    saveFastingState({ plan: selectedPlan, isRunning: newIsRunning, endTime: newEndTime });
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(totalDuration);
    setEndTime(null);
    saveFastingState({ plan: selectedPlan, isRunning: false, endTime: null });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const progress = useMemo(() => {
    return (timeRemaining / totalDuration) * 100;
  }, [timeRemaining, totalDuration]);

  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Select Your Plan</CardTitle>
            <CardDescription>Choose an intermittent fasting protocol.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedPlan}
              onValueChange={handlePlanChange}
              disabled={isRunning}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a fasting plan" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(fastingPlans).map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {fastingPlans[plan as FastingPlan].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{planDetails.name}</CardTitle>
            <CardDescription>Your recommended schedule and plan benefits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center"><Clock className="mr-2 h-4 w-4 text-primary"/> Schedule</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 bg-secondary rounded-lg">
                      <div className="font-medium flex items-center"><Sunrise className="mr-2 h-4 w-4 text-green-600"/> Eating Window</div>
                      <p className="text-muted-foreground">{planDetails.eatingHours} hours</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                      <div className="font-medium flex items-center"><Sunset className="mr-2 h-4 w-4 text-blue-600"/> Fasting Window</div>
                      <p className="text-muted-foreground">{planDetails.fastingHours} hours</p>
                  </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center"><Zap className="mr-2 h-4 w-4 text-primary"/> Benefits & Info</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {planDetails.description} Common benefits of intermittent fasting include weight loss, improved metabolic health, and cellular repair. Always consult with a healthcare professional before starting a new diet plan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="flex flex-col items-center justify-center p-6">
        { isLoading ? (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        ) : (
        <>
            <div className="relative w-64 h-64 flex items-center justify-center">
                <svg className="absolute w-full h-full" viewBox="0 0 200 200">
                    <circle
                        cx="100" cy="100" r="90"
                        fill="none"
                        stroke="hsl(var(--secondary))"
                        strokeWidth="12"
                    />
                    <circle
                        cx="100" cy="100" r="90"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="12"
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                        strokeDasharray={CIRCLE_CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 ease-linear"
                    />
                </svg>
                <div className="z-10 text-center">
                    <p className="text-4xl font-bold font-mono text-primary">{formatTime(timeRemaining)}</p>
                    <p className="text-sm text-muted-foreground">Time Remaining</p>
                </div>
            </div>
            <div className="flex gap-4 mt-6">
                <Button onClick={handleStartStop} size="lg" disabled={timeRemaining <= 0}>
                    {isRunning ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                    {isRunning ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg" disabled={isRunning}>
                    <RefreshCw className="mr-2"/>
                    Reset
                </Button>
            </div>
        </>
        )}
      </Card>
    </div>
  );
}
