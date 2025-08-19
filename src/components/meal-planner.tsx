'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Utensils, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMealMacros, deleteMealAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { addMeal, getMeals } from '@/services/firestore';

const mealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  mealName: z.string().min(1, 'Meal name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
});

type MealFormValues = z.infer<typeof mealSchema>;
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
  createdAt: { seconds: number, nanoseconds: number };
};

const mealTypes: MealFormValues['mealType'][] = ['breakfast', 'lunch', 'dinner', 'snack'];

const isToday = (timestamp: { seconds: number; nanoseconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

export function MealPlanner() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: { mealType: 'breakfast', mealName: '', quantity: '' },
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
    if (mealNameInput && mealNameInput.length > 1) {
      const filteredSuggestions = uniqueMealNames.filter(name => 
        name.toLowerCase().includes(mealNameInput.toLowerCase()) && name.toLowerCase() !== mealNameInput.toLowerCase()
      );
      setSuggestions(filteredSuggestions.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setSuggestions([]);
    }
  }, [mealNameInput, uniqueMealNames]);

  const onSubmit: SubmitHandler<MealFormValues> = async (data) => {
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
      setIsDialogOpen(false);
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
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Calories: {Math.round(meal.calories)} kcal</li>
                <li>Protein: {Math.round(meal.protein)} g</li>
                <li>Carbs: {Math.round(meal.carbs)} g</li>
                <li>Fats: {Math.round(meal.fats)} g</li>
                <li>Fiber: {Math.round(meal.fiber)} g</li>
              </ul>
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

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-headline">Log Your Meals</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Log a New Meal</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

      <Tabs defaultValue="breakfast" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {mealTypes.map(t => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
        </TabsList>
        {mealTypes.map(t => <TabsContent key={t} value={t}>{renderMealCards(t)}</TabsContent>)}
      </Tabs>
    </>
  );
}
