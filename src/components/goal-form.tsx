
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
import { Checkbox } from './ui/checkbox';

const goalSchema = z.object({
    goal: z.enum(['lose', 'maintain', 'gain']),
    buildMuscle: z.boolean().default(false),
    targetWeight: z.coerce.number().optional(),
}).refine(data => {
    if(data.goal === 'lose' || data.goal === 'gain') {
        return data.targetWeight !== undefined && data.targetWeight > 0;
    }
    return true;
}, {
    message: "Target weight is required for this goal",
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
  buildMuscle?: boolean;
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

const activityLevelProteinIncrement = {
    sedentary: 0.0,
    light: 0.1,
    moderate: 0.2,
    active: 0.3,
    very_active: 0.4,
}

const goalCalorieAdjustments = {
    lose: -500,
    lose_muscle: -300, // Smaller deficit when building muscle to preserve mass
    maintain: 0,
    gain: 500,
    maintain_muscle: 250, // Slight surplus for lean gains
};


export function GoalForm() {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
        goal: 'maintain',
        buildMuscle: false,
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
            buildMuscle: savedProfile.buildMuscle || false,
            targetWeight: savedProfile.targetWeight || undefined,
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
        const goalMetrics = calculateGoalMetrics(metrics, profile, data.goal, data.buildMuscle);

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
  
  const calculateGoalMetrics = (baseMetrics: FitnessMetrics, profile: FullProfile, goal: GoalFormValues['goal'], buildMuscle: boolean): GoalMetrics => {
      const tdee = baseMetrics.bmr * activityLevelMultipliers[profile.activityLevel];
      
      let calorieAdjustment = 0;
      if (buildMuscle) {
          if (goal === 'lose') calorieAdjustment = goalCalorieAdjustments.lose_muscle;
          else if (goal === 'maintain') calorieAdjustment = goalCalorieAdjustments.maintain_muscle;
          else calorieAdjustment = goalCalorieAdjustments.gain; // Same for gain
      } else {
          calorieAdjustment = goalCalorieAdjustments[goal];
      }
      
      const dailyCalories = Math.round(tdee + calorieAdjustment);
      
      // Protein Calculation
      const baseProteinMultiplier = buildMuscle ? 1.7 : 1.5;
      const proteinIncrement = activityLevelProteinIncrement[profile.activityLevel];
      const finalProteinMultiplier = baseProteinMultiplier + proteinIncrement;
      const protein = Math.round(finalProteinMultiplier * profile.weight);
      const proteinCalories = protein * 4;

      // Fat Calculation (25% of total calories)
      const fatCalories = dailyCalories * 0.25;
      const fats = Math.round(fatCalories / 9);

      // Carb Calculation (Remaining calories)
      const carbCalories = dailyCalories - proteinCalories - fatCalories;
      const carbs = Math.round(carbCalories / 4);

      // Fiber Calculation
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
  
  const getGoalDescription = (goal: string, buildMuscle?: boolean) => {
    let description = '';
    switch(goal) {
      case 'lose': description = 'lose weight'; break;
      case 'maintain': description = 'maintain your weight'; break;
      case 'gain': description = 'gain weight'; break;
      default: return '';
    }
    if (buildMuscle) {
        description += ' and build muscle';
    }
    description += '.';
    return description;
  }

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
                          <FormItem className="space-y-3"><FormLabel>Primary Goal</FormLabel><FormControl>
                              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <FormItem>
                                      <FormControl><RadioGroupItem value="lose" id="lose" className="sr-only peer" /></FormControl>
                                      <Label htmlFor="lose" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Lose Weight</Label>
                                  </FormItem>
                                  <FormItem>
                                      <FormControl><RadioGroupItem value="maintain" id="maintain" className="sr-only peer" /></FormControl>
                                      <Label htmlFor="maintain" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Maintain</Label>
                                  </FormItem>
                                  <FormItem>
                                      <FormControl><RadioGroupItem value="gain" id="gain" className="sr-only peer" /></FormControl>
                                      <Label htmlFor="gain" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Gain Weight</Label>
                                  </FormItem>
                              </RadioGroup>
                          </FormControl><FormMessage /></FormItem>
                      )}/>

                      <FormField
                        control={goalForm.control}
                        name="buildMuscle"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                Also build muscle?
                                </FormLabel>
                                <FormMessage />
                            </div>
                            </FormItem>
                        )}
                        />

                      {(goal === 'lose' || goal === 'gain') && (
                          <FormField control={goalForm.control} name="targetWeight" render={({ field }) => (
                              <FormItem><FormLabel>Target Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="kg" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
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
              {profile?.goal && <CardDescription>Daily targets to help you {getGoalDescription(profile.goal, profile.buildMuscle)}</CardDescription>}
          </CardHeader>
          <CardContent className='space-y-4'>
              {goalMetrics ? (
                  <>
                      <MetricCard icon={Flame} label="Daily Calorie Goal" value={`${goalMetrics.dailyCalories} kcal`} description={`To ${getGoalDescription(profile!.goal, profile!.buildMuscle)}`} iconClassName="text-orange-500" />
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
