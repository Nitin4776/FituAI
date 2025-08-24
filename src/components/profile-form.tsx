
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
import { Target, Weight, Ruler, TrendingUp, Loader2, Flame, ArrowRight } from 'lucide-react';
import { getProfile, saveProfile } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  name: z.string().optional(),
  height: z.coerce.number().positive('Height must be positive'),
  weight: z.coerce.number().positive('Weight must be positive'),
  age: z.coerce.number().int().min(1, 'Age must be positive'),
  gender: z.enum(['male', 'female']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface FitnessMetrics {
  bmi: number;
  bmiCategory: string;
  idealWeight: string;
  bodyFat: number;
  bmr: number;
}

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { 
      name: '',
      height: '' as any,
      weight: '' as any,
      age: '' as any,
      gender: 'male', 
      activityLevel: 'sedentary',
    },
  });

  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const savedProfile = await getProfile();
      if (savedProfile) {
        profileForm.reset({
            ...savedProfile,
            name: user?.displayName || '',
            height: savedProfile.height || '',
            weight: savedProfile.weight || '',
            age: savedProfile.age || '',
        });
        if (!savedProfile.height) {
            setIsNewUser(true);
        }
      } else if (user) {
        profileForm.reset({ name: user.displayName || '' });
        setIsNewUser(true);
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [profileForm, user]);

  const onProfileSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const wasNewUser = isNewUser;
      await saveProfile(data);
      toast({
        title: 'Details Saved',
        description: 'Your physical details have been updated.',
      });
      // Force re-render to update metrics
      profileForm.trigger();
      setIsNewUser(false); // No longer a new user after saving

      if (wasNewUser) {
        toast({
            title: 'Great! Next, set your goal.',
            description: 'You will now be redirected to the Goal page.',
            action: <Button onClick={() => router.push('/goal')}>Go to Goal <ArrowRight /></Button>
        });
        router.push('/goal');
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your details. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const calculateBaseMetrics = (data: ProfileFormValues): FitnessMetrics => {
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
    
    return { bmi, bmiCategory, idealWeight: `${idealWeightMin} kg - ${idealWeightMax} kg`, bodyFat: parseFloat(bodyFat.toFixed(1)), bmr };
  }

  const baseMetrics = useMemo(() => {
    const profileData = profileForm.getValues();
    if (!profileData.height || !profileData.weight || !profileData.age || !profileData.gender) return null;
    if (Object.values(profileData).some(v => v === '')) return null;
    return calculateBaseMetrics(profileData);
  }, [profileForm.watch()]);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-8">
          <Card>
              <CardHeader>
              <CardTitle className="font-headline">Your Details</CardTitle>
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
                      <FormField control={profileForm.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Your name" {...field} readOnly className="text-muted-foreground" /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={profileForm.control} name="height" render={({ field }) => (
                          <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" placeholder="180" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                          )}/>
                      <FormField control={profileForm.control} name="weight" render={({ field }) => (
                          <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="75" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                          )}/>
                      </div>
                      <FormField control={profileForm.control} name="age" render={({ field }) => (
                          <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" placeholder="30" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
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
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="animate-spin" />}
                        Save Details
                      </Button>
                  </form>
                  </Form>
              )}
              </CardContent>
          </Card>
      </div>

      <div className="space-y-8">
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
                <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
                <p>Fill out the "Your Details" form to see your metrics.</p>
                </div>
            )}
            </CardContent>
        </Card>
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
