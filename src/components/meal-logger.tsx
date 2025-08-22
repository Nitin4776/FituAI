
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Camera, Loader2, Trash2, Pencil, Flame, Drumstick, Wheat, Beef, Upload, Video } from 'lucide-react';
import { getTodaysMeals, addMeal, updateMeal, deleteMeal } from '@/services/firestore';
import type { AnalyzeMealOutput } from '@/ai/flows/analyze-meal';
import type { AnalyzeMealFromImageOutput } from '@/ai/flows/analyze-meal-from-image';
import type { MealLog } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
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
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const mealTypes = {
  breakfast: 'Breakfast',
  morningSnack: 'Morning Snack',
  lunch: 'Lunch',
  eveningSnack: 'Evening Snack',
  dinner: 'Dinner',
};

type MealType = keyof typeof mealTypes;

const mealFormSchema = z.object({
  mealName: z.string().min(2, 'Meal name is required.'),
  quantity: z.string().min(1, 'Quantity is required.'),
  description: z.string().optional(),
});

type MealFormValues = z.infer<typeof mealFormSchema>;

const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

export function MealLogger() {
  const [meals, setMeals] = useState<Record<MealType, MealLog[]>>({
    breakfast: [],
    morningSnack: [],
    lunch: [],
    eveningSnack: [],
    dinner: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'capture' | 'upload' | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealFormSchema),
  });

  const fetchMeals = async () => {
    setIsLoading(true);
    const todaysMeals = await getTodaysMeals();
    const groupedMeals: Record<MealType, MealLog[]> = { breakfast: [], morningSnack: [], lunch: [], eveningSnack: [], dinner: [] };
    todaysMeals.forEach((meal) => {
      groupedMeals[meal.mealType as MealType].push(meal);
    });
    setMeals(groupedMeals);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  // Effect to request camera permission when capture mode is selected
  useEffect(() => {
    if (cameraMode === 'capture') {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      };
      getCameraPermission();
    } else {
       // Stop camera stream when not in capture mode
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraMode, toast]);

  const handleAddClick = (mealType: MealType) => {
    setEditingMeal(null);
    form.reset({ mealName: '', quantity: '', description: '' });
    setSelectedMealType(mealType);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (meal: MealLog) => {
    setEditingMeal(meal);
    form.reset({ mealName: meal.mealName, quantity: meal.quantity, description: meal.description || '' });
    setSelectedMealType(meal.mealType as MealType);
    setIsDialogOpen(true);
  }

  const handleDelete = async (meal: MealLog) => {
    try {
        await deleteMeal(meal);
        toast({
            title: "Meal Deleted",
            description: `${meal.mealName} has been removed from your log.`,
        });
        fetchMeals(); // Refresh the list
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: (error as Error).message,
        });
    }
  }

  const onSubmit: SubmitHandler<MealFormValues> = async (data) => {
    if (!selectedMealType) return;
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/analyze-meal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to analyze meal');
        }

        const nutritionalInfo: AnalyzeMealOutput = await response.json();

        if (editingMeal) {
            const fullMealData = {
                ...editingMeal,
                ...data,
                ...nutritionalInfo,
            };
            await updateMeal(fullMealData);
            toast({
                title: "Meal Updated",
                description: `${data.mealName} has been successfully updated.`,
            });
        } else {
            const fullMealData = {
                ...data,
                ...nutritionalInfo,
                mealType: selectedMealType,
            };
             await addMeal(fullMealData);
             toast({
                title: "Meal Added",
                description: `Our AI has analyzed and logged ${data.mealName}.`,
             });
        }
      
      fetchMeals();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCameraClick = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setIsCameraDialogOpen(true);
    setCameraMode(null); // Reset mode when opening
  };

  const handleImageAnalysis = async (imageDataUri: string) => {
    setIsAnalyzingImage(true);
    try {
        const response = await fetch('/api/analyze-meal-from-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageDataUri }),
        });

        if (!response.ok) {
            throw new Error('Failed to analyze image');
        }

        const result: AnalyzeMealFromImageOutput = await response.json();
        form.reset({
            mealName: result.mealName,
            quantity: result.quantity,
            description: '',
        });
        setIsCameraDialogOpen(false);
        setCameraMode(null);
        setIsDialogOpen(true); // Open the manual log dialog with pre-filled data
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Image Analysis Failed",
            description: (error as Error).message,
        });
    } finally {
        setIsAnalyzingImage(false);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if(context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUri = canvas.toDataURL('image/jpeg');
            handleImageAnalysis(dataUri);
        }
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const dataUri = await toDataURL(file);
        handleImageAnalysis(dataUri);
    }
  }

  const MealCard = ({ meal }: { meal: MealLog }) => (
    <Card className="bg-secondary/50">
        <CardContent className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold">{meal.mealName} <span className='text-xs font-normal text-muted-foreground'>({meal.calories.toFixed(0)} kcal)</span></h4>
                    <p className="text-sm text-muted-foreground">{meal.quantity}</p>
                    {meal.description && <p className="text-xs text-muted-foreground mt-1 italic">"{meal.description}"</p>}
                </div>
                <div className="flex gap-1">
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(meal)}><Pencil className="h-4 w-4" /></Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your meal entry
                                and remove its nutritional data from your daily total.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(meal)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center mt-3 pt-3 border-t">
                <div className="text-xs">
                    <Flame className="h-4 w-4 mx-auto text-orange-500"/>
                    <p className="font-bold">{meal.calories.toFixed(0)}</p>
                    <p className="text-muted-foreground">kcal</p>
                </div>
                <div className="text-xs">
                    <Drumstick className="h-4 w-4 mx-auto text-red-500"/>
                    <p className="font-bold">{meal.protein.toFixed(0)}g</p>
                    <p className="text-muted-foreground">Protein</p>
                </div>
                <div className="text-xs">
                    <Wheat className="h-4 w-4 mx-auto text-yellow-500"/>
                    <p className="font-bold">{meal.carbs.toFixed(0)}g</p>
                    <p className="text-muted-foreground">Carbs</p>
                </div>
                 <div className="text-xs">
                    <Beef className="h-4 w-4 mx-auto text-purple-500"/>
                    <p className="font-bold">{meal.fats.toFixed(0)}g</p>
                    <p className="text-muted-foreground">Fat</p>
                </div>
                 <div className="text-xs">
                    <Wheat className="h-4 w-4 mx-auto text-green-500"/>
                    <p className="font-bold">{meal.fiber.toFixed(0)}g</p>
                    <p className="text-muted-foreground">Fiber</p>
                </div>
            </div>
        </CardContent>
    </Card>
  )


  return (
    <>
      <div className="space-y-6">
        {isLoading ? (
             [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
            Object.entries(mealTypes).map(([key, name]) => (
            <Card key={key}>
                <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="font-headline">{name}</CardTitle>
                    <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="text-amber-600 hover:text-amber-700" onClick={() => handleAddClick(key as MealType)}>
                        <Plus />
                    </Button>
                    <Button variant="outline" size="icon" className="text-amber-600 hover:text-amber-700" onClick={() => handleCameraClick(key as MealType)}>
                        <Camera />
                    </Button>
                    </div>
                </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {meals[key as MealType].length > 0 ? (
                        meals[key as MealType].map(meal => <MealCard key={meal.id} meal={meal} />)
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No {name.toLowerCase()} logged yet.</p>
                    )}
                </CardContent>
            </Card>
            ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMeal ? 'Edit' : 'Log'} {selectedMealType ? mealTypes[selectedMealType] : 'Meal'}</DialogTitle>
            <DialogDescription>
              Enter the details below. Our AI will estimate the nutritional information.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="mealName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chicken breast with broccoli" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity / Serving Size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1 bowl, 200g" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any extra details? e.g., cooked with olive oil, no salt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? (editingMeal ? 'Updating...' : 'Logging...') : (editingMeal ? 'Update Meal' : 'Log Meal')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

       <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log with Camera</DialogTitle>
            <DialogDescription>
              Capture or upload a photo of your meal. The AI will identify it for you.
            </DialogDescription>
          </DialogHeader>
          {isAnalyzingImage ? (
             <div className="flex flex-col items-center justify-center h-64 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">The AI is analyzing your meal...<br/>This may take a moment.</p>
            </div>
          ) : (
            <>
                {!cameraMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8">
                    <Button variant="outline" className="h-24 text-lg" onClick={() => setCameraMode('capture')}>
                        <Video className="mr-2" /> Capture Photo
                    </Button>
                    <Button variant="outline" className="h-24 text-lg" onClick={() => setCameraMode('upload')}>
                        <Upload className="mr-2" /> Upload Photo
                    </Button>
                </div>
                )}
                
                {cameraMode === 'upload' && (
                     <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Click the button to select an image file.</p>
                        <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
                           Select from computer
                        </Button>
                        <Input 
                            ref={fileInputRef} 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange}
                        />
                    </div>
                )}
                
                {cameraMode === 'capture' && (
                    <div className="space-y-4">
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                         {hasCameraPermission === false && (
                            <Alert variant="destructive">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                    Please allow camera access in your browser to use this feature.
                                </AlertDescription>
                            </Alert>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                        <Button className="w-full" onClick={handleCapture} disabled={!hasCameraPermission}>
                            <Camera className="mr-2" /> Capture and Analyze
                        </Button>
                    </div>
                )}
            </>
          )}

          <DialogFooter>
             {cameraMode && (
                <Button variant="ghost" onClick={() => setCameraMode(null)}>Back</Button>
             )}
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
