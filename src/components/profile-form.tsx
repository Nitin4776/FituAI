
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, type SubmitHandler, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Target, Weight, Ruler, TrendingUp, Loader2, Flame, ArrowRight, Upload, Sparkles, User, Mail, Phone } from 'lucide-react';
import { getProfile, saveProfile } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

const profileSchema = z.object({
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

const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

function cmToFeetAndInches(cm: number) {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
}

function feetAndInchesToCm(feet: number, inches: number) {
    const totalInches = (feet * 12) + inches;
    return Math.round(totalInches * 2.54);
}

const AIScan = ({ form }: { form: UseFormReturn<ProfileFormValues> }) => {
    const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
    const [backPhoto, setBackPhoto] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { toast } = useToast();

    const handleAnalyze = async () => {
        if (!frontPhoto || !backPhoto) {
            toast({ variant: 'destructive', title: 'Please upload both photos.' });
            return;
        }
        setIsAnalyzing(true);
        try {
            const [frontPhotoDataUri, backPhotoDataUri] = await Promise.all([
                toDataURL(frontPhoto),
                toDataURL(backPhoto),
            ]);

            const response = await fetch('/api/analyze-vitals', {
                method: 'POST',
                body: JSON.stringify({ frontPhotoDataUri, backPhotoDataUri }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Failed to analyze photos.');
            
            const result = await response.json();

            form.setValue('height', Math.round(result.heightCm));
            form.setValue('weight', Math.round(result.weightKg));
            form.setValue('age', Math.round(result.age));
            
            toast({ title: 'Analysis Complete!', description: 'Your estimated details have been filled in below.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Analysis Failed', description: (error as Error).message });
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="text-primary" /> AI Body Scan</CardTitle>
                <CardDescription>Upload front and back photos for our AI to estimate your height, weight, and age. For best results, wear form-fitting clothes and stand in a neutral pose.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="front-photo">Front Photo</Label>
                        <Input id="front-photo" type="file" accept="image/*" onChange={(e) => setFrontPhoto(e.target.files?.[0] || null)} />
                         {frontPhoto && <p className="text-xs text-muted-foreground">Selected: {frontPhoto.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="back-photo">Back Photo</Label>
                        <Input id="back-photo" type="file" accept="image/*" onChange={(e) => setBackPhoto(e.target.files?.[0] || null)} />
                        {backPhoto && <p className="text-xs text-muted-foreground">Selected: {backPhoto.name}</p>}
                    </div>
                 </div>
                 <Button onClick={handleAnalyze} disabled={!frontPhoto || !backPhoto || isAnalyzing} className="w-full">
                    {isAnalyzing ? <Loader2 className="animate-spin" /> : 'Analyze with AI'}
                 </Button>
            </CardContent>
        </Card>
    )
}


export function ProfileForm({ onProfileSave }: { onProfileSave: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [feet, setFeet] = useState(0);
  const [inches, setInches] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

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

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const savedProfile = await getProfile();
      if (savedProfile) {
        profileForm.reset({ ...savedProfile });
        if (savedProfile.height) {
            const { feet, inches } = cmToFeetAndInches(savedProfile.height);
            setFeet(feet);
            setInches(inches);
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [profileForm]);

  useEffect(() => {
      const heightInCm = profileForm.watch('height');
      if (heightUnit === 'ft' && heightInCm) {
          const { feet, inches } = cmToFeetAndInches(heightInCm);
          setFeet(feet);
          setInches(inches);
      }
  }, [profileForm.watch('height'), heightUnit])

  const handleFeetInchChange = (newFeet: number, newInches: number) => {
      setFeet(newFeet);
      setInches(newInches);
      const cm = feetAndInchesToCm(newFeet, newInches);
      profileForm.setValue('height', cm, { shouldValidate: true });
  }

  const onProfileSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      await saveProfile(data);
      onProfileSave(); // Callback to notify parent component
      toast({
        title: 'Details Saved',
        description: 'Your physical details have been updated.',
      });
      // Force re-render to update metrics
      profileForm.trigger();
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
    if (profileForm.formState.isValidating || Object.keys(profileForm.formState.errors).length > 0) return null;
    return calculateBaseMetrics(profileData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileForm.watch(), profileForm.formState.isValidating, profileForm.formState.errors]);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-8">
            <AIScan form={profileForm} />
            <Card>
              <CardHeader>
              <CardTitle className="font-headline">Your Details</CardTitle>
              <CardDescription>Enter your information manually to calculate your body metrics.</CardDescription>
              </CardHeader>
              <CardContent>
              {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : (
                  <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                       <FormField
                          control={profileForm.control}
                          name="height"
                          render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between items-center">
                                    <FormLabel>Height</FormLabel>
                                     <Tabs defaultValue={heightUnit} onValueChange={(value) => setHeightUnit(value as 'cm' | 'ft')} className="w-auto">
                                        <TabsList className="h-7 text-xs">
                                            <TabsTrigger value="cm" className="h-6 text-xs">cm</TabsTrigger>
                                            <TabsTrigger value="ft" className="h-6 text-xs">ft/in</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                                <FormControl>
                                    { heightUnit === 'cm' ? (
                                        <Input type="number" placeholder="180" {...field} value={field.value ?? ''} />
                                     ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input type="number" placeholder="ft" value={feet || ''} onChange={e => handleFeetInchChange(Number(e.target.value), inches)} />
                                            <Input type="number" placeholder="in" value={inches || ''} onChange={e => handleFeetInchChange(feet, Number(e.target.value))} />
                                        </div>
                                     )}
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                          )}
                        />
                      <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={profileForm.control} name="weight" render={({ field }) => (
                          <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="75" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                          )}/>
                      <FormField control={profileForm.control} name="age" render={({ field }) => (
                          <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" placeholder="30" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      </div>
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
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Details'}
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
        
        {user && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Account Information</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    {user.email && (
                         <div className="flex items-center gap-4 text-sm">
                            <Mail className="text-muted-foreground" />
                            <span>{user.email}</span>
                        </div>
                    )}
                     {user.phoneNumber && (
                         <div className="flex items-center gap-4 text-sm">
                            <Phone className="text-muted-foreground" />
                            <span>{user.phoneNumber}</span>
                        </div>
                    )}
                 </CardContent>
            </Card>
        )}
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
