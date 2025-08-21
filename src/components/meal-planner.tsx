'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Utensils, Sparkles, Loader2, Trash2, Bot, Upload, Camera, BookOpen, Flame, Drumstick, Wheat, Beef, Pencil, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMealMacros, deleteMealAction, generateMealPlanAction, analyzeMealImageAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { addMeal, getMeals, getProfile } from '@/services/firestore';
import type { GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';

const mealSchema = z.object({
  mealType: z.enum(['breakfast', 'morningSnack', 'lunch', 'eveningSnack', 'dinner']),
  mealName: z.string().min(1, 'Meal name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  description: z.string().optional(),
});

const planSchema = z.object({
    cuisine: z.string().min(1, 'Cuisine is required.'),
    diet: z.enum(['vegetarian', 'non-vegetarian', 'eggetarian', 'vegan']),
});

type MealFormValues = z.infer<typeof mealSchema>;
type PlanFormValues = z.infer<typeof planSchema>;
type DialogStep = 'choice' | 'manual' | 'analyze';


type MealLog = {
  id: string;
  mealType: MealFormValues['mealType'];
  mealName: string;
  quantity: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  recipe?: string;
  createdAt: { seconds: number, nanoseconds: number };
};

const mealTypes: {name: string, value: MealFormValues['mealType']}[] = [
    { name: 'Breakfast', value: 'breakfast'},
    { name: 'Morning Snack', value: 'morningSnack'},
    { name: 'Lunch', value: 'lunch'},
    { name: 'Evening Snack', value: 'eveningSnack'},
    { name: 'Dinner', value: 'dinner'},
];

const cuisineTypes = ['Indian', 'Subcontinental', 'Italian', 'Mexican', 'Chinese', 'Mediterranean'];
const dietTypes: PlanFormValues['diet'][] = ['vegetarian', 'non-vegetarian', 'eggetarian', 'vegan'];

const isToday = (timestamp: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return false;
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const calorieDistribution = {
    breakfast: 0.25,
    morningSnack: 0.075,
    lunch: 0.35,
    eveningSnack: 0.075,
    dinner: 0.25,
}

function MacroDisplay({ label, value, unit, icon: Icon }: { label: string; value: number; unit: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon className="h-5 w-5 text-primary" />
      <span className="font-bold text-sm">{Math.round(value)}{unit}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}


export function MealPlanner() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [isLogMealDialogOpen, setIsLogMealDialogOpen] = useState(false);
  const [logMealDialogStep, setLogMealDialogStep] = useState<DialogStep>('choice');
  const [isPlanMealDialogOpen, setIsPlanMealDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(2000); // Default
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<GenerateMealPlanOutput | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<{name: string, recipe: string} | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: { mealType: 'breakfast', mealName: '', quantity: '', description: '' },
  });
  
  const planForm = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: { cuisine: 'Indian', diet: 'vegetarian' },
  });

  const mealNameInput = form.watch('mealName');

  const uniqueMealNames = useMemo(() => {
    const names = new Set(meals.map(m => m.mealName));
    return Array.from(names);
  }, [meals]);


  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [savedMeals, profile] = await Promise.all([getMeals(), getProfile()]);
      setMeals(savedMeals as MealLog[]);
      
      if (profile) {
        const heightInMeters = profile.height / 100;
        const bmr =
        profile.gender === 'male'
            ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
            : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;

        const activityMultipliers = {
            sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
        };
        const goalAdjustments = { lose: -500, maintain: 0, gain: 500 };
        const tdee = bmr * activityMultipliers[profile.activityLevel as keyof typeof activityMultipliers];
        setDailyGoal(Math.round(tdee + goalAdjustments[profile.goal as keyof typeof goalAdjustments]));
      }

      setIsLoading(false);
    }
    loadData();
  }, []);
  
  useEffect(() => {
    if (isLogMealDialogOpen && logMealDialogStep === 'analyze') {
        const getCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: true});
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
        }
        };
        getCameraPermission();
    } else {
        // Stop camera stream when dialog is closed or step changes
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [isLogMealDialogOpen, logMealDialogStep]);


  useEffect(() => {
    if (mealNameInput && mealNameInput.length > 1) {
      const filteredSuggestions = uniqueMealNames.filter(name => 
        name.toLowerCase().includes(mealNameInput.toLowerCase()) && name.toLowerCase() !== mealNameInput.toLowerCase()
      );
      setSuggestions(filteredSuggestions.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setSuggestions([]);
    }
  }, [mealNameInput, uniqueMealNames]);

  const onAddMealSubmit: SubmitHandler<MealFormValues> = async (data) => {
    setIsCalculating(true);
    try {
      const macros = await getMealMacros(data);
      const newMealData = {
        mealType: data.mealType,
        mealName: data.mealName,
        quantity: data.quantity,
        description: data.description,
        ...macros,
      };

      await addMeal(newMealData);
      
      const newMealForState = {
        ...newMealData,
        id: Date.now().toString(),
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      }
      setMeals((prev) => [newMealForState, ...prev]);

      form.reset();
      setIsLogMealDialogOpen(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: 'Could not log meal. Please try again.',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const onPlanMealSubmit: SubmitHandler<PlanFormValues> = async (data) => {
    setIsGenerating(true);
    setGeneratedPlan(null);
    try {
        const plan = await generateMealPlanAction(data);
        setGeneratedPlan(plan);
        setIsPlanMealDialogOpen(false);
        planForm.reset();
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Planning Failed',
            description: (error as Error).message || 'Could not generate a meal plan. Please try again.',
        });
    } finally {
        setIsGenerating(false);
    }
  }

  const handleDeleteMeal = async (mealId: string) => {
    try {
        await deleteMealAction(mealId);
        setMeals((prev) => prev.filter(m => m.id !== mealId));
        toast({
            title: "Meal Deleted",
            description: "The meal has been removed from your log.",
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: 'Could not delete the meal. Please try again.',
        });
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const takePicture = () => {
    if (videoRef.current && photoRef.current) {
        const video = videoRef.current;
        const photo = photoRef.current;
        const context = photo.getContext('2d');
        
        photo.width = video.videoWidth;
        photo.height = video.videoHeight;
        
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = photo.toDataURL('image/jpeg');
        setImagePreview(dataUri);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    try {
        const result = await analyzeMealImageAction({ imageDataUri: imagePreview });
        if (!result.isFood) {
             toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: "The AI couldn't recognize a food item in the image. Please log your meal manually.",
            });
            setLogMealDialogStep('manual');
        } else {
            form.setValue('mealName', result.mealName);
            form.setValue('quantity', result.quantity);
            // Pre-fill the form for user confirmation.
            setLogMealDialogStep('manual');
        }

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Analysis Failed',
            description: "An error occurred while analyzing the image. Please try again or log manually.",
        });
    } finally {
        setIsAnalyzing(false);
        setImagePreview(null);
    }
  }

  const renderMealCards = (mealTypeValue: MealFormValues['mealType']) => {
    const filteredMeals = meals.filter((m) => m.mealType === mealTypeValue && isToday(m.createdAt));
    const targetCalories = Math.round(dailyGoal * calorieDistribution[mealTypeValue]);
    const consumedCalories = filteredMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const progress = targetCalories > 0 ? (consumedCalories / targetCalories) * 100 : 0;

     if (isLoading) {
       return (
         <div className="text-center text-muted-foreground py-10">
           <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
           <p className="mt-2">Loading meals...</p>
         </div>
       );
     }
     
    return (
        <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground bg-secondary p-2 rounded-md">
                <div className="flex justify-between items-center text-xs px-1">
                    <span>Consumed: {Math.round(consumedCalories)} kcal</span>
                    <span>Recommended: ~{targetCalories} kcal</span>
                </div>
                <Progress value={progress} className="h-1 mt-1" />
            </div>

            {filteredMeals.length === 0 ? (
                 <div className="text-center text-muted-foreground py-10">
                    <Utensils className="mx-auto h-8 w-8" />
                    <p className="mt-2">No {mealTypes.find(mt => mt.value === mealTypeValue)?.name} logged for today yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredMeals.map((meal) => (
                    <Card key={meal.id}>
                        <CardHeader className='pb-2'>
                          <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{meal.mealName}</CardTitle>
                                <p className="text-sm text-muted-foreground">{meal.quantity}</p>
                                {meal.description && <p className="text-xs text-muted-foreground pt-1 italic">"{meal.description}"</p>}
                            </div>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8 flex-shrink-0">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this meal from your log.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteMeal(meal.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-5 gap-2 pt-2">
                           <MacroDisplay label="Calories" value={meal.calories} unit="kcal" icon={Flame} />
                           <MacroDisplay label="Protein" value={meal.protein} unit="g" icon={Drumstick} />
                           <MacroDisplay label="Carbs" value={meal.carbs} unit="g" icon={Wheat} />
                           <MacroDisplay label="Fats" value={meal.fats} unit="g" icon={Beef} />
                           <MacroDisplay label="Fiber" value={meal.fiber} unit="g" icon={Wheat} />
                        </CardContent>
                    </Card>
                    ))}
                </div>
            )}
      </div>
    );
  };
  
  const renderAiPlan = () => {
    if (!generatedPlan) return null;
    
    const planEntries = Object.entries(generatedPlan) as [MealFormValues['mealType'], MealLog][];

    return (
        <div className="mt-8">
            <div className='flex items-center gap-2 mb-4'>
                <Bot className="h-8 w-8 text-primary" />
                <div>
                    <h2 className="text-2xl font-headline">AI Generated Meal Plan</h2>
                    <p className="text-muted-foreground">Here is a sample meal plan based on your preferences and goals.</p>
                </div>
            </div>
            <Tabs defaultValue="breakfast" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-auto sm:grid-cols-5">
                    {Object.keys(generatedPlan).map(key => {
                        const mealType = mealTypes.find(mt => mt.value === key);
                        if (!mealType) return null;
                        return (
                             <TabsTrigger key={mealType.value} value={mealType.value} className="capitalize">{mealType.name}</TabsTrigger>
                        )
                    })}
                </TabsList>
                {planEntries.map(([mealType, meal]) => (
                    <TabsContent key={mealType} value={mealType}>
                         <div className="space-y-4 mt-4">
                            <Card className="flex flex-col">
                                <CardHeader className='pb-4'>
                                    <CardTitle className="text-lg">{meal.mealName}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{meal.quantity}</p>
                                </CardHeader>
                                <CardContent className="flex-grow grid grid-cols-5 gap-2">
                                    <MacroDisplay label="Calories" value={meal.calories} unit="kcal" icon={Flame} />
                                    <MacroDisplay label="Protein" value={meal.protein} unit="g" icon={Drumstick} />
                                    <MacroDisplay label="Carbs" value={meal.carbs} unit="g" icon={Wheat} />
                                    <MacroDisplay label="Fats" value={meal.fats} unit="g" icon={Beef} />
                                    <MacroDisplay label="Fiber" value={meal.fiber} unit="g" icon={Wheat} />
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedRecipe({name: meal.mealName, recipe: meal.recipe || "No recipe available."})}>
                                       <BookOpen className="mr-2 h-4 w-4" /> View Recipe
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
  }

  const renderLogMealDialogContent = () => {
    switch (logMealDialogStep) {
        case 'analyze':
            return (
                <div className='space-y-4'>
                    {imagePreview ? (
                        <div className='space-y-4'>
                            <img src={imagePreview} alt="Meal Preview" className="rounded-md w-full" />
                            <Button onClick={handleAnalyzeImage} className="w-full" disabled={isAnalyzing}>
                                {isAnalyzing ? <Loader2 className='animate-spin mr-2' /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Analyze Image
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => setImagePreview(null)}>Take a different picture</Button>
                        </div>
                    ) : (
                        <Tabs defaultValue="camera">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="camera">Camera</TabsTrigger>
                                <TabsTrigger value="upload">Upload</TabsTrigger>
                            </TabsList>
                            <TabsContent value="camera">
                                <div className="space-y-2">
                                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-secondary" autoPlay muted playsInline />
                                    <canvas ref={photoRef} className="hidden" />
                                    {hasCameraPermission === false ? (
                                        <Alert variant="destructive">
                                            <AlertTitle>Camera Access Denied</AlertTitle>
                                            <AlertDescription>Please allow camera access in your browser settings to use this feature.</AlertDescription>
                                        </Alert>
                                    ) : (
                                        <Button onClick={takePicture} className="w-full" disabled={!hasCameraPermission}>
                                            <Camera className="mr-2 h-4 w-4" /> Take Picture
                                        </Button>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="upload">
                                <div className="space-y-2">
                                    <Input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="hidden" />
                                    <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                                        <Upload className="mr-2 h-4 w-4" /> Choose from Library
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                     <Button variant="link" onClick={() => setLogMealDialogStep('choice')}>Back to options</Button>
                </div>
            );
        case 'manual':
            return (
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddMealSubmit)} className="space-y-4">
                        <FormField control={form.control} name="mealType" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Meal Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select meal type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                {mealTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField control={form.control} name="mealName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Meal Name</FormLabel>
                                <FormControl>
                                <div className="relative">
                                    <Input placeholder="e.g., Chicken Salad" {...field} autoComplete="off" onBlur={() => setTimeout(() => setSuggestions([]), 100)} />
                                    {suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full bg-background border rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                                        {suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="p-2 hover:bg-accent cursor-pointer text-sm"
                                            onMouseDown={() => {
                                            form.setValue('mealName', suggestion);
                                            setSuggestions([]);
                                            }}
                                        >
                                            {suggestion}
                                        </div>
                                        ))}
                                    </div>
                                    )}
                                </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField control={form.control} name="quantity" render={({ field }) => (
                            <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input placeholder="e.g., 1 bowl" {...field} /></FormControl><FormMessage /></FormItem>
                        )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                <Textarea placeholder="e.g., Made with grilled chicken, romaine lettuce, and a light vinaigrette." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <DialogFooter>
                        <Button type="button" variant="link" onClick={() => setLogMealDialogStep('choice')}>Back to options</Button>
                        <Button type="submit" disabled={isCalculating}>
                            {isCalculating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Calculating...
                            </>
                            ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Log Meal with AI
                            </>
                            )}
                        </Button>
                        </DialogFooter>
                    </form>
                </Form>
            );
        case 'choice':
        default:
            return (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setLogMealDialogStep('manual')}>
                       <Pencil className="h-6 w-6" />
                        Log Manually
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setLogMealDialogStep('analyze')}>
                       <Image className="h-6 w-6" />
                        Analyze with Photo
                    </Button>
                </div>
            );
    }
  }
  
  const getDialogTitle = () => {
    switch (logMealDialogStep) {
        case 'manual': return 'Log a New Meal';
        case 'analyze': return 'Analyze Meal from Image';
        case 'choice':
        default: return 'Log Meal / Analyze with AI';
    }
  }

  const getDialogDescription = () => {
    switch (logMealDialogStep) {
        case 'manual': return 'Fill in the details of your meal below.';
        case 'analyze': return 'Upload a photo or use your camera to get an AI analysis.';
        case 'choice':
        default: return 'How would you like to log your meal?';
    }
  }


  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-headline">Today's Meals</h2>
        <div className='flex flex-wrap gap-2 justify-end'>
            <Dialog open={isPlanMealDialogOpen} onOpenChange={setIsPlanMealDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Bot className="mr-2 h-4 w-4" /> Plan Day with AI
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-headline">Generate a Meal Plan</DialogTitle>
                    </DialogHeader>
                    <Form {...planForm}>
                        <form onSubmit={planForm.handleSubmit(onPlanMealSubmit)} className='space-y-4'>
                             <FormField control={planForm.control} name="cuisine" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cuisine</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select cuisine" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                        {cuisineTypes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={planForm.control} name="diet" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dietary Preference</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select diet" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                        {dietTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isGenerating}>
                                    {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                    ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate Plan
                                    </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <Dialog open={isLogMealDialogOpen} onOpenChange={(isOpen) => {
                setIsLogMealDialogOpen(isOpen);
                 if (!isOpen) {
                    // Reset state when closing
                    setLogMealDialogStep('choice');
                    setImagePreview(null);
                    setHasCameraPermission(null);
                    form.reset();
                }
            }}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Log Meal
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-headline">{getDialogTitle()}</DialogTitle>
                        <DialogDescription>{getDialogDescription()}</DialogDescription>
                    </DialogHeader>
                    {renderLogMealDialogContent()}
                </DialogContent>
            </Dialog>
        </div>
      </div>

       <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline">{selectedRecipe?.name}</DialogTitle>
            <DialogDescription>A simple recipe to get you started.</DialogDescription>
          </DialogHeader>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedRecipe?.recipe?.replace(/\n/g, '<br />') || '' }}
          />
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="breakfast" className="w-full">
        <TabsList className="w-full justify-start sm:grid sm:w-full sm:grid-cols-5">
          {mealTypes.map(t => <TabsTrigger key={t.value} value={t.value}>{t.name}</TabsTrigger>)}
        </TabsList>
        {mealTypes.map(t => <TabsContent key={t.value} value={t.value}>{renderMealCards(t.value)}</TabsContent>)}
      </Tabs>

      {renderAiPlan()}
    </>
  );
}
