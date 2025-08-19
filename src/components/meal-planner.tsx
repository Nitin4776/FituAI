'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Utensils, Sparkles, Loader2 } from 'lucide-react';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMealMacros } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const mealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  mealName: z.string().min(1, 'Meal name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
});

type MealFormValues = z.infer<typeof mealSchema>;
type MealLog = {
  id: string;
  mealType: MealFormValues['mealType'];
  description: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

const mealTypes: MealFormValues['mealType'][] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function MealPlanner() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: { mealType: 'breakfast', mealName: '', quantity: '' },
  });

  const onSubmit: SubmitHandler<MealFormValues> = async (data) => {
    setIsCalculating(true);
    try {
      const macros = await getMealMacros(data);
      const newMeal: MealLog = {
        id: Date.now().toString(),
        mealType: data.mealType,
        description: data.mealName,
        quantity: data.quantity,
        ...macros,
      };
      setMeals((prev) => [...prev, newMeal]);
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Calculation Failed',
        description: 'Could not calculate macros. Please try again.',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const renderMealCards = (mealType: MealFormValues['mealType']) => {
    const filteredMeals = meals.filter((m) => m.mealType === mealType);
    if (filteredMeals.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-10">
          <Utensils className="mx-auto h-8 w-8" />
          <p className="mt-2">No {mealType} logged yet.</p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {filteredMeals.map((meal) => (
          <Card key={meal.id}>
            <CardHeader>
              <CardTitle className="text-lg">{meal.description}</CardTitle>
              <p className="text-sm text-muted-foreground">{meal.quantity}</p>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Calories: {Math.round(meal.calories)} kcal</li>
                <li>Protein: {Math.round(meal.protein)} g</li>
                <li>Carbs: {Math.round(meal.carbs)} g</li>
                <li>Fats: {Math.round(meal.fats)} g</li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-end mb-4">
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
                    <FormItem><FormLabel>Meal Name</FormLabel><FormControl><Input placeholder="e.g., Chicken Salad" {...field} /></FormControl><FormMessage /></FormItem>
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
