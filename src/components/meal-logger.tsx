
'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Camera, Loader2, Trash2, Pencil, Flame, Drumstick, Wheat, Beef } from 'lucide-react';
import { getTodaysMeals } from '@/services/firestore';
import { analyzeAndAddMeal, deleteMealAction, updateMealAction } from '@/app/actions';
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
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null);
  const { toast } = useToast();

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealFormSchema),
  });

  const fetchMeals = async () => {
    setIsLoading(true);
    const todaysMeals = await getTodaysMeals();
    const groupedMeals = { breakfast: [], morningSnack: [], lunch: [], eveningSnack: [], dinner: [] };
    todaysMeals.forEach((meal) => {
      groupedMeals[meal.mealType as MealType].push(meal);
    });
    setMeals(groupedMeals);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMeals();
  }, []);

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
        await deleteMealAction(meal);
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
        if (editingMeal) {
            const oldMacros = {
                calories: editingMeal.calories,
                protein: editingMeal.protein,
                carbs: editingMeal.carbs,
                fats: editingMeal.fats,
                fiber: editingMeal.fiber
            }
            await updateMealAction(editingMeal.id, oldMacros, { ...data, mealType: selectedMealType });
            toast({
                title: "Meal Updated",
                description: `${data.mealName} has been successfully updated.`,
            });
        } else {
             await analyzeAndAddMeal({ ...data, mealType: selectedMealType });
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

  const MealCard = ({ meal }: { meal: MealLog }) => (
    <Card className="bg-secondary/50">
        <CardContent className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold">{meal.mealName}</h4>
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
                    <p className="text-muted-foreground">Prot</p>
                </div>
                <div className="text-xs">
                    <Wheat className="h-4 w-4 mx-auto text-yellow-500"/>
                    <p className="font-bold">{meal.carbs.toFixed(0)}g</p>
                    <p className="text-muted-foreground">Carb</p>
                </div>
                 <div className="text-xs">
                    <Beef className="h-4 w-4 mx-auto text-purple-500"/>
                    <p className="font-bold">{meal.fats.toFixed(0)}g</p>
                    <p className="text-muted-foreground">Fat</p>
                </div>
                 <div className="text-xs">
                    <Wheat className="h-4 w-4 mx-auto text-green-500"/>
                    <p className="font-bold">{meal.fiber.toFixed(0)}g</p>
                    <p className="text-muted-foreground">Fibr</p>
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
                    <Button variant="outline" size="icon" className="text-amber-600 hover:text-amber-700" onClick={() => toast({ title: "Coming Soon!", description: "Logging meals via camera is under development."})}>
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
    </>
  );
}
