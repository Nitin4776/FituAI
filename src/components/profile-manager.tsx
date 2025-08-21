
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Target, Weight, Ruler, TrendingUp, Loader2, Flame, Wheat, Drumstick, Beef, ArrowDown } from 'lucide-react';
import { getProfile, saveProfile } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  height: z.coerce.number().positive('Height must be positive'),
  weight: z.coerce.number().positive('Weight must be positive'),
  age: z.coerce.number().int().min(1, 'Age must be positive'),
  gender: z.enum(['male', 'female']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
});

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


type ProfileFormValues = z.infer<typeof profileSchema>;
type GoalFormValues = z.infer<typeof goalSchema>;
type FullProfile = ProfileFormValues & GoalFormValues;


interface FitnessMetrics {
  bmi: number;
  bmiCategory: string;
  idealWeight: string;
  bodyFat: number;
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

const goalCalorieAdjustments = {
    lose: -500, // Calorie deficit for weight loss
    maintain: 0,
    gain: 500, // Calorie surplus for weight gain
};


export function ProfileManager() {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [showGoalCard, setShowGoalCard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const goalCardRef = useRef<HTMLDivElement>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { 
      height: '' as any,
      weight: '' as any,
      age: '' as any,
      gender: 'male', 
      activityLevel: 'sedentary',
    },
  });

  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
        goal: 'maintain',
        targetWeight: '' as any
    }
  });

  const goal = goalForm.watch('goal');

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const savedProfile = await getProfile();
      if (savedProfile) {
        setProfile(savedProfile as FullProfile);
        profileForm.reset(savedProfile);
        goalForm.reset(savedProfile);
        if (savedProfile.height && savedProfile.weight && savedProfile.age) {
            setShowGoalCard(true);
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [profileForm, goalForm]);

  const onProfileSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    try {
      const currentFullProfile = { ...profile, ...data };
      await saveProfile(currentFullProfile);
      setProfile(currentFullProfile);
      setShowGoalCard(true);
      toast({
        title: 'Details Saved',
        description: 'Your physical details have been updated.',
      });
      setTimeout(() => {
          goalCardRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your details. Please try again.',
      });
    }
  };

  const onGoalSubmit: SubmitHandler<GoalFormValues> = async (data) => {
    if (!profile || !profile.height || !profile.weight || !profile.age) {
        toast({
            variant: 'destructive',
            title: 'Details Needed',
            description: 'Please save your physical details before setting a goal.',
        });
        return;
    }
    try {
        const fullProfileData = { ...profile, ...data } as FullProfile;
        await saveProfile(fullProfileData);
        setProfile(fullProfileData);
        toast({
            title: 'Goal Set!',
            description: 'Your daily nutritional goals have been calculated.',
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save your goal. Please try again.',
        });
    }
  }

  const baseMetrics: FitnessMetrics | null = useMemo(() => {
    const profileData = profileForm.getValues();
    const isDataValid = profileData.height > 0 && profileData.weight > 0 && profileData.age > 0;

    if (!isDataValid && !profile) return null;
    
    const data = isDataValid ? profileData : profile;
    if (!data?.height || !data?.weight || !data?.age) return null;

    const heightInMeters = data.height / 100;
    const bmi = parseFloat((data.weight / (heightInMeters * heightInMeters)).toFixed(1));

    let bmiCategory = '';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Normal weight';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obesity';

    const idealWeightMin = (18.5 * heightInMeters * heightInMeters).toFixed(1);
    const idealWeightMax = (24.9 * heightInMeters * heightInMeters).toFixed(1);

    const bodyFat =
      data.gender === 'male'
        ? 1.2 * bmi + 0.23 * data.age - 16.2
        : 1.2 * bmi + 0.23 * data.age - 5.4;

    const bmr = Math.round(data.gender === 'male'
        ? 10 * data.weight + 6.25 * data.height - 5 * data.age + 5
        : 10 * data.weight + 6.25 * data.height - 5 * data.age - 161);

    return {
      bmi,
      bmiCategory,
      idealWeight: `${idealWeightMin} kg - ${idealWeightMax} kg`,
      bodyFat: parseFloat(bodyFat.toFixed(1)),
      bmr,
    };
  }, [profile, profileForm.watch('height'), profileForm.watch('weight'), profileForm.watch('age'), profileForm.watch('gender')]);

  const goalMetrics: GoalMetrics | null = useMemo(() => {
    if (!profile || !profile.goal || !baseMetrics) return null;
    
    const tdee = baseMetrics.bmr * activityLevelMultipliers[profile.activityLevel];
    const dailyCalories = tdee + goalCalorieAdjustments[profile.goal];

    const protein = Math.round((dailyCalories * 0.3) / 4);
    const carbs = Math.round((dailyCalories * 0.4) / 4);
    const fats = Math.round((dailyCalories * 0.3) / 9);
    const fiber = Math.round((dailyCalories / 1000) * 14);

    return { dailyCalories: Math.round(dailyCalories), protein, carbs, fats, fiber };

  }, [profile, baseMetrics]);


  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
            <Card>
                <CardHeader>
                <CardTitle className="font-headline">1. Your Details</CardTitle>
                <CardDescription>Enter your information to calculate your body metrics.</CardDescription>
                </CardHeader>
                <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={profileForm.control} name="height" render={({ field }) => (
                            <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" placeholder="180" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        <FormField control={profileForm.control} name="weight" render={({ field }) => (
                            <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="75" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={profileForm.control} name="age" render={({ field }) => (
                            <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" placeholder="30" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={profileForm.control} name="gender" render={({ field }) => (
                            <FormItem className="space-y-3"><FormLabel>Gender</FormLabel><FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="male" id="male"/></FormControl><Label htmlFor="male" className="font-normal">Male</Label></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="female" id="female"/></FormControl><Label htmlFor="female" className="font-normal">Female</Label></FormItem>
                                </RadioGroup>
                            </FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={profileForm.control} name="activityLevel" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Activity Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select your activity level" /></SelectTrigger></FormControl>
                                <SelectContent>
                                <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                                <SelectItem value="light">Lightly active (light exercise/sports 1-3 days/week)</SelectItem>
                                <SelectItem value="moderate">Moderately active (moderate exercise/sports 3-5 days/week)</SelectItem>
                                <SelectItem value="active">Very active (hard exercise/sports 6-7 days a week)</SelectItem>
                                <SelectItem value="very_active">Extra active (very hard exercise/physical job)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}/>
                        <Button type="submit" className="w-full">Save Details</Button>
                    </form>
                    </Form>
                )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle className="font-headline">Your Body Metrics</CardTitle>
                <CardDescription>Results based on your physical details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : baseMetrics ? (
                    <>
                    <MetricCard icon={Target} label="Body Mass Index (BMI)" value={baseMetrics.bmi.toString()} description={baseMetrics.bmiCategory} />
                    <MetricCard icon={Weight} label="Ideal Weight Range" value={baseMetrics.idealWeight} description="Based on healthy BMI range" />
                    <MetricCard icon={TrendingUp} label="Body Fat Percentage" value={`~${baseMetrics.bodyFat}%`} description="Estimated value" />
                    <MetricCard icon={Flame} label="Basal Metabolic Rate (BMR)" value={`${baseMetrics.bmr} kcal`} description="Calories burned at rest" />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    <p>Fill out the "Your Details" form to see your metrics.</p>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            {showGoalCard && (
                <Card ref={goalCardRef}>
                    <CardHeader>
                        <CardTitle className="font-headline">2. Your Goal</CardTitle>
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
            )}

            {profile?.goal && (
                 <Card>
                    <CardHeader>
                        <CardTitle className='text-xl font-headline'>Your Daily Goals</CardTitle>
                         <CardDescription>Daily targets based on your goal of "{profile.goal}" weight.</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {goalMetrics ? (
                            <>
                                <MetricCard icon={Flame} label="Daily Calorie Goal" value={`${goalMetrics.dailyCalories} kcal`} description={`To ${profile?.goal} weight`} />
                                <MetricCard icon={Drumstick} label="Protein" value={`${goalMetrics.protein}g`} description="Essential for muscle repair and growth." />
                                <MetricCard icon={Wheat} label="Carbohydrates" value={`${goalMetrics.carbs}g`} description="Your body's main source of energy." />
                                <MetricCard icon={Beef} label="Fats" value={`${goalMetrics.fats}g`} description="Important for hormone production and health." />
                                <MetricCard icon={Wheat} label="Fiber" value={`${goalMetrics.fiber}g`} description="Crucial for digestive health." />
                            </>
                        ) : (
                             <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                                <p>Set a goal to see your daily nutrition targets.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    description: string;
}

function MetricCard({ icon: Icon, label, value, description }: MetricCardProps) {
    return (
        <div className="p-4 bg-secondary rounded-lg flex items-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary mr-4">
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-lg font-bold font-headline">{value}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}

    

    