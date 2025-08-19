'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Utensils } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  description: z.string().min(1, 'Description is required'),
  calories: z.coerce.number().min(0, 'Calories must be a positive number'),
  protein: z.coerce.number().min(0, 'Protein must be a positive number'),
  carbs: z.coerce.number().min(0, 'Carbs must be a positive number'),
  fats: z.coerce.number().min(0, 'Fats must be a positive number'),
});

type MealFormValues = z.infer<typeof mealSchema>;
type MealLog = MealFormValues & { id: string };

const mealTypes: MealFormValues['mealType'][] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function MealPlanner() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: { mealType: 'breakfast', description: '' },
  });

  const onSubmit: SubmitHandler<MealFormValues> = (data) => {
    setMeals((prev) => [...prev, { ...data, id: Date.now().toString() }]);
    form.reset();
    setIsDialogOpen(false);
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
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Calories: {meal.calories} kcal</li>
                <li>Protein: {meal.protein} g</li>
                <li>Carbs: {meal.carbs} g</li>
                <li>Fats: {meal.fats} g</li>
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., Chicken Salad" {...field} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="calories" render={({ field }) => (
                      <FormItem><FormLabel>Calories</FormLabel><FormControl><Input type="number" placeholder="350" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField control={form.control} name="protein" render={({ field }) => (
                      <FormItem><FormLabel>Protein (g)</FormLabel><FormControl><Input type="number" placeholder="30" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField control={form.control} name="carbs" render={({ field }) => (
                      <FormItem><FormLabel>Carbs (g)</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField control={form.control} name="fats" render={({ field }) => (
                      <FormItem><FormLabel>Fats (g)</FormLabel><FormControl><Input type="number" placeholder="15" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                  <Button type="submit">Log Meal</Button>
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
