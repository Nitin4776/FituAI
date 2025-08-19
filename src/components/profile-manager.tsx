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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Weight, Ruler, TrendingUp, Loader2, Flame } from 'lucide-react';
import { getProfile, saveProfile } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  height: z.coerce.number().positive('Height must be positive'),
  weight: z.coerce.number().positive('Weight must be positive'),
  age: z.coerce.number().int().min(1, 'Age must be positive'),
  gender: z.enum(['male', 'female']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface FitnessMetrics {
  bmi: number;
  bmiCategory: string;
  idealWeight: string;
  bodyFat: number;
  dailyCalories: number;
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
  const [profile, setProfile] = useState<ProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { 
      height: '' as any, 
      weight: '' as any,
      age: '' as any,
      gender: 'male', 
      activityLevel: 'sedentary',
      goal: 'maintain',
    },
  });

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const savedProfile = await getProfile();
      if (savedProfile) {
        setProfile(savedProfile as ProfileFormValues);
        form.reset(savedProfile);
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [form]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    try {
      await saveProfile(data);
      setProfile(data);
      toast({
        title: 'Profile Saved',
        description: 'Your details have been successfully updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your profile. Please try again.',
      });
    }
  };

  const metrics: FitnessMetrics | null = useMemo(() => {
    if (!profile) return null;
    const heightInMeters = profile.height / 100;
    const bmi = parseFloat((profile.weight / (heightInMeters * heightInMeters)).toFixed(1));

    let bmiCategory = '';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Normal weight';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obesity';

    const idealWeightMin = (18.5 * heightInMeters * heightInMeters).toFixed(1);
    const idealWeightMax = (24.9 * heightInMeters * heightInMeters).toFixed(1);

    const bmr =
      profile.gender === 'male'
        ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
        : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;

    const tdee = bmr * activityLevelMultipliers[profile.activityLevel];
    const dailyCalories = tdee + goalCalorieAdjustments[profile.goal];

    const bodyFat =
      profile.gender === 'male'
        ? 1.2 * bmi + 0.23 * profile.age - 16.2
        : 1.2 * bmi + 0.23 * profile.age - 5.4;

    return {
      bmi,
      bmiCategory,
      idealWeight: `${idealWeightMin} kg - ${idealWeightMax} kg`,
      bodyFat: parseFloat(bodyFat.toFixed(1)),
      dailyCalories: Math.round(dailyCalories),
    };
  }, [profile]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Your Details</CardTitle>
          <CardDescription>Enter your information to calculate metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="height" render={({ field }) => (
                      <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" placeholder="180" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  <FormField control={form.control} name="weight" render={({ field }) => (
                      <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="75" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" placeholder="30" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Gender</FormLabel><FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center gap-4">
                          <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="male" /></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="female" /></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem>
                        </RadioGroup>
                      </FormControl><FormMessage /></FormItem>
                  )}/>
                 <FormField control={form.control} name="activityLevel" render={({ field }) => (
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
                 <FormField control={form.control} name="goal" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Your Goal</FormLabel><FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-4">
                          <FormItem><FormControl><RadioGroupItem value="lose" className="sr-only peer" /></FormControl>
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Lose Weight
                            </Label>
                          </FormItem>
                          <FormItem><FormControl><RadioGroupItem value="maintain" className="sr-only peer" /></FormControl>
                            <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Maintain Weight
                            </Label>
                          </FormItem>
                          <FormItem><FormControl><RadioGroupItem value="gain" className="sr-only peer" /></FormControl>
                             <Label className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Gain Weight
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl><FormMessage /></FormItem>
                  )}/>
                <Button type="submit" className="w-full">Calculate & Save</Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Your Metrics</CardTitle>
          <CardDescription>Results based on your provided details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : metrics ? (
            <>
              <MetricCard icon={Target} label="Body Mass Index (BMI)" value={metrics.bmi.toString()} description={metrics.bmiCategory} />
              <MetricCard icon={Weight} label="Ideal Weight Range" value={metrics.idealWeight} description="Based on healthy BMI range" />
              <MetricCard icon={TrendingUp} label="Body Fat Percentage" value={`~${metrics.bodyFat}%`} description="Estimated value" />
              <MetricCard icon={Flame} label="Daily Calorie Goal" value={`${metrics.dailyCalories} kcal`} description={`To ${profile?.goal} weight`} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <p>Fill out the form to see your metrics.</p>
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
}

function MetricCard({ icon: Icon, label, value, description }: MetricCardProps) {
    return (
        <div className="p-4 bg-secondary rounded-lg flex items-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary mr-4">
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-bold font-headline">{value}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}
