
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Flame, Wheat, Drumstick, Beef } from 'lucide-react';
import { getProfile, saveProfile, updateDailySummaryWithNewGoals } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const goalSchema = z.object({
    goal: z.enum(['lose', 'maintain', 'gain']),
    targetWeight: z.coerce.number().optional(),
}).refine(data => {
    if(data.goal !== 'maintain') {
        return data.targetWeight !== undefined && data.targetWeight > 0;
    }
    return true;
}, {
    message: "Target weight is required for your goal",
    path: ["targetWeight"],
});

type GoalFormValues = z.infer<typeof goalSchema>;

type FullProfile = {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
  targetWeight?: number;
  dailyCalories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
};

interface FitnessMetrics {
  bmr: number;
}

interface GoalMetrics {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

const activityLevelMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
};

const proteinPerKgMultipliers = {
    sedentary: 1.2,
    light: 1.4,
    moderate: 1.6,
    active: 1.8,
    very_active: 2.0,
}

const goalCalorieAdjustments = {
    lose: -500,
    maintain: 0,
    gain: 500,
};


export function GoalForm() {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
        goal: 'maintain',
        targetWeight: '' as any,
    }
  });

  const goal = goalForm.watch('goal');

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const savedProfile = await getProfile() as FullProfile | null;
      if (savedProfile) {
        setProfile(savedProfile);
        goalForm.reset({
            goal: savedProfile.goal || 'maintain',
            targetWeight: savedProfile.targetWeight || '',
        });
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [goalForm]);

  const onGoalSubmit: SubmitHandler<GoalFormValues> = async (data) => {
     if (!profile?.height || !profile?.weight || !profile?.age) {
        toast({
            variant: 'destructive',
            title: 'Details Needed',
            description: 'Please complete your profile before setting a goal.',
        });
        return;
    }
    try {
        const metrics = calculateBMR(profile);
        const goalMetrics = calculateGoalMetrics(metrics, profile, data.goal);

        const fullProfileData: FullProfile = {
            ...profile,
            ...data,
            ...goalMetrics,
        };
        await saveProfile(fullProfileData);
        await updateDailySummaryWithNewGoals({
            dailyGoal: goalMetrics.dailyCalories,
            macroGoals: {
                protein: goalMetrics.protein,
                carbs: goalMetrics.carbs,
                fats: goalMetrics.fats,
                fiber: goalMetrics.fiber,
            }
        });
        setProfile(fullProfileData);
        toast({
            title: 'Goal Set!',
            description: 'Your daily nutritional goals have been calculated and saved.',
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save your goal. Please try again.',
        });
    }
  }

  const calculateBMR = (data: FullProfile): FitnessMetrics => {
    const bmr = Math.round(data.gender === 'male'
        ? 10 * data.weight + 6.25 * data.height - 5 * data.age + 5
        : 10 * data.weight + 6.25 * data.height - 5 * data.age - 161);
    
    return { bmr };
  }
  
  const calculateGoalMetrics = (baseMetrics: FitnessMetrics, profile: FullProfile, goal: GoalFormValues['goal']): GoalMetrics => {
      const tdee = baseMetrics.bmr * activityLevelMultipliers[profile.activityLevel];
      const dailyCalories = Math.round(tdee + goalCalorieAdjustments[goal]);

      // 1. Calculate Protein (based on body weight and activity level)
      const protein = Math.round(proteinPerKgMultipliers[profile.activityLevel] * profile.weight);
      const proteinCalories = protein * 4;

      // 2. Calculate Fats (25% of total calories)
      const fats = Math.round((dailyCalories * 0.25) / 9);
      const fatCalories = fats * 9;

      // 3. Calculate Carbohydrates (the remainder)
      const carbCalories = dailyCalories - proteinCalories - fatCalories;
      const carbs = Math.round(carbCalories / 4);

      // 4. Calculate Fiber
      const fiber = Math.round((dailyCalories / 1000) * 14);

      return { dailyCalories, protein, carbs, fats, fiber };
  }

  const goalMetrics = useMemo(() => {
     if (!profile || !profile.goal || !profile.dailyCalories) return null;
     return {
        dailyCalories: profile.dailyCalories,
        protein: profile.protein,
        carbs: profile.carbs,
        fats: profile.fats,
        fiber: profile.fiber
     }
  }, [profile]);

  if(isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
          <CardHeader>
              <CardTitle className="font-headline">Your Goal</CardTitle>
              <CardDescription>Select your fitness goal to calculate daily targets.</CardDescription>
          </CardHeader>
          <CardContent>
              <Form {...goalForm}>
                  <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-6">
                      <FormField control={goalForm.control} name="goal" render={({ field }) => (
                          <FormItem className="space-y-3"><FormLabel>Your Goal</FormLabel><FormControl>
                              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-4">
                                  <FormItem>
                                      <FormControl>
                                          <RadioGroupItem value="lose" id="lose" className="sr-only peer" />
                                      </FormControl>
                                      <Label htmlFor="lose" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                          Lose Weight
                                      </Label>
                                  </FormItem>
                                  <FormItem>
                                      <FormControl>
                                          <RadioGroupItem value="maintain" id="maintain" className="sr-only peer" />
                                      </FormControl>
                                      <Label htmlFor="maintain" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                          Maintain
                                      </Label>
                                  </FormItem>
                                  <FormItem>
                                      <FormControl>
                                          <RadioGroupItem value="gain" id="gain" className="sr-only peer" />
                                      </FormControl>
                                      <Label htmlFor="gain" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                          Gain Weight
                                      </Label>
                                  </FormItem>
                              </RadioGroup>
                          </FormControl><FormMessage /></FormItem>
                      )}/>
                      {goal !== 'maintain' && (
                          <FormField control={goalForm.control} name="targetWeight" render={({ field }) => (
                              <FormItem><FormLabel>Target Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="70" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                          )}/>
                      )}
                      <Button type="submit" className="w-full">Set Goal & Calculate Macros</Button>
                  </form>
              </Form>
          </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle className='text-xl font-headline'>Your Daily Goals</CardTitle>
              {profile?.goal && <CardDescription>Daily targets based on your goal of "{profile.goal}" weight.</CardDescription>}
          </CardHeader>
          <CardContent className='space-y-4'>
              {goalMetrics ? (
                  <>
                      <MetricCard icon={Flame} label="Daily Calorie Goal" value={`${goalMetrics.dailyCalories} kcal`} description={`To ${profile?.goal} weight`} iconClassName="text-orange-500" />
                      <MetricCard icon={Drumstick} label="Protein" value={`${goalMetrics.protein}g`} description="Essential for muscle repair and growth." iconClassName="text-red-500" />
                      <MetricCard icon={Wheat} label="Carbohydrates" value={`${goalMetrics.carbs}g`} description="Your body's main source of energy." iconClassName="text-yellow-500" />
                      <MetricCard icon={Beef} label="Fats" value={`${goalMetrics.fats}g`} description="Important for hormone production and health." iconClassName="text-purple-500" />
                      <MetricCard icon={Wheat} label="Fiber" value={`${goalMetrics.fiber}g`} description="Crucial for digestive health." iconClassName="text-green-500" />
                  </>
              ) : (
                  <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
                      <p>Set a goal to see your daily nutrition targets.</p>
                  </div>
              )}
          </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    description: string;
    iconClassName?: string;
}

function MetricCard({ icon: Icon, label, value, description, iconClassName }: MetricCardProps) {
    return (
        <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg flex items-center">
            <div className="p-3 rounded-full bg-background/50 mr-4">
                <Icon className={cn("h-6 w-6", iconClassName)} />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-lg font-bold font-headline">{value}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}
