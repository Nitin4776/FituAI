'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Utensils, Sparkles, Loader2, Trash2, Bot, Upload, Camera, BookOpen } from 'lucide-react';
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
import { addMeal, getMeals } from '@/services/firestore';
import type { GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

const mealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  mealName: z.string().min(1, 'Meal name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
});

const planSchema = z.object({
    cuisine: z.string().min(1, 'Cuisine is required.'),
    diet: z.enum(['vegetarian', 'non-vegetarian', 'eggetarian', 'vegan']),
});

type MealFormValues = z.infer<typeof mealSchema>;
type PlanFormValues = z.infer<typeof planSchema>;

type MealLog = {
  id: string;
  mealType: MealFormValues['mealType'];
  mealName: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  recipe?: string;
  createdAt: { seconds: number, nanoseconds: number };
};

const mealTypes: MealFormValues['mealType'][] = ['breakfast', 'lunch', 'dinner', 'snack'];
const cuisineTypes = ['Indian', 'Subcontinental', 'Italian', 'Mexican', 'Chinese', 'Mediterranean'];
const dietTypes: PlanFormValues['diet'][] = ['vegetarian', 'non-vegetarian', 'eggetarian', 'vegan'];

const isToday = (timestamp: { seconds: number; nanoseconds: number }) => {
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

export function MealPlanner() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false);
  const [isPlanMealDialogOpen, setIsPlanMealDialogOpen] = useState(false);
  const [isAnalyzeMealDialogOpen, setIsAnalyzeMealDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    defaultValues: { mealType: 'breakfast', mealName: '', quantity: '' },
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
      const savedMeals = await getMeals();
      setMeals(savedMeals as MealLog[]);
      setIsLoading(false);
    }
    loadData();
  }, []);
  
  useEffect(() => {
    if (isAnalyzeMealDialogOpen) {
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
        // Stop camera stream when dialog is closed
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [isAnalyzeMealDialogOpen]);


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
      setIsAddMealDialogOpen(false);
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
            setIsAnalyzeMealDialogOpen(false);
        } else {
            form.setValue('mealName', result.mealName);
            form.setValue('quantity', result.quantity);
            // This is a bit of a hack. The getMealMacros will be called again on submit,
            // but we pre-fill the form for user confirmation.
            setIsAnalyzeMealDialogOpen(false);
            setIsAddMealDialogOpen(true); // Open the manual log dialog with pre-filled data
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

  const renderMealCards = (mealType: MealFormValues['mealType']) => {
    const filteredMeals = meals.filter((m) => m.mealType === mealType && isToday(m.createdAt));

     if (isLoading) {
       return (
         <div className="text-center text-muted-foreground py-10">
           <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
           <p className="mt-2">Loading meals...</p>
         </div>
       );
     }

    if (filteredMeals.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-10">
          <Utensils className="mx-auto h-8 w-8" />
          <p className="mt-2">No {mealType} logged for today yet.</p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {filteredMeals.map((meal) => (
          <Card key={meal.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{meal.mealName}</CardTitle>
              <p className="text-sm text-muted-foreground">{meal.quantity}</p>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div><span className="font-semibold">Calories:</span> {Math.round(meal.calories)} kcal</div>
                <div><span className="font-semibold">Protein:</span> {Math.round(meal.protein)} g</div>
                <div><span className="font-semibold">Carbs:</span> {Math.round(meal.carbs)} g</div>
                <div><span className="font-semibold">Fats:</span> {Math.round(meal.fats)} g</div>
                <div><span className="font-semibold">Fiber:</span> {Math.round(meal.fiber)} g</div>
              </div>
            </CardContent>
            <CardFooter>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full text-red-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            </CardFooter>
          </Card>
        ))}
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
                <TabsList className="grid w-full grid-cols-4">
                    {mealTypes.map(t => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
                </TabsList>
                {planEntries.map(([mealType, meal]) => (
                    <TabsContent key={mealType} value={mealType}>
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-lg">{meal.mealName}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{meal.quantity}</p>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                        <div><span className="font-semibold">Calories:</span> {Math.round(meal.calories)} kcal</div>
                                        <div><span className="font-semibold">Protein:</span> {Math.round(meal.protein)} g</div>
                                        <div><span className="font-semibold">Carbs:</span> {Math.round(meal.carbs)} g</div>
                                        <div><span className="font-semibold">Fats:</span> {Math.round(meal.fats)} g</div>
                                        <div><span className="font-semibold">Fiber:</span> {Math.round(meal.fiber)} g</div>
                                    </div>
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

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-headline">Today's Meals</h2>
        <div className='flex flex-wrap gap-2 justify-end'>
            <Dialog open={isAnalyzeMealDialogOpen} onOpenChange={(isOpen) => {
                setIsAnalyzeMealDialogOpen(isOpen);
                if (!isOpen) {
                    setImagePreview(null);
                    setHasCameraPermission(null);
                }
            }}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Camera className="mr-2 h-4 w-4" /> Analyze Meal with AI
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Analyze Meal from Image</DialogTitle>
                        <CardDescription>Upload a photo or use your camera to get an AI analysis of your meal.</CardDescription>
                    </DialogHeader>
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
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={isPlanMealDialogOpen} onOpenChange={setIsPlanMealDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
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
            <Dialog open={isAddMealDialogOpen} onOpenChange={setIsAddMealDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Meal Manually
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle className="font-headline">Log a New Meal</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddMealSubmit)} className="space-y-4">
                    <FormField control={form.control} name="mealType" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Meal Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select meal type" /></SelectTrigger></FormControl>
                            <SelectContent>
                            {mealTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
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
                    <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
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
        <TabsList className="grid w-full grid-cols-4">
          {mealTypes.map(t => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
        </TabsList>
        {mealTypes.map(t => <TabsContent key={t} value={t}>{renderMealCards(t)}</TabsContent>)}
      </Tabs>

      {renderAiPlan()}
    </>
  );
}
