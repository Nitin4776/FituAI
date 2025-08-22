
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Utensils, ChefHat, Flame, Drumstick, Wheat, Beef } from 'lucide-react';
import type { GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { Skeleton } from './ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { getDailySummaryForToday } from '@/services/firestore';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Target } from 'lucide-react';
import Link from 'next/link';

const mealTypes = {
  breakfast: 'Breakfast',
  morningSnack: 'Morning Snack',
  lunch: 'Lunch',
  eveningSnack: 'Evening Snack',
  dinner: 'Dinner',
};

const planFormSchema = z.object({
  cuisine: z.string().min(2, 'Cuisine is required.'),
  diet: z.enum(['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'jain']),
});

type PlanFormValues = z.infer<typeof planFormSchema>;
type MealPlan = GenerateMealPlanOutput;
type Meal = MealPlan[keyof MealPlan];


function MarkdownList({ content }: { content: string }) {
    if (!content) return null;
    const items = content.split('\n').map(item => item.trim().replace(/^- \*/, '').replace(/^-/, '').replace(/^\*/, '').trim()).filter(Boolean);
    return (
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    );
}

export function AiMealPlan() {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(0);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const { toast } = useToast();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
        cuisine: 'Any',
        diet: 'vegetarian',
    }
  });

  useEffect(() => {
    async function fetchGoal() {
        setIsLoadingGoal(true);
        const summary = await getDailySummaryForToday();
        setDailyGoal(summary.dailyGoal);
        setIsLoadingGoal(false);
    }
    fetchGoal();
  }, [])

  const onSubmit: SubmitHandler<PlanFormValues> = async (data) => {
    setIsLoading(true);
    setIsDialogOpen(false);
    setMealPlan(null);

    try {
      const response = await fetch('/api/ai/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, dailyCalorieGoal: dailyGoal }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }
      const result = await response.json();
      setMealPlan(result);
      toast({
        title: "Meal Plan Generated!",
        description: "Your personalized meal plan is ready.",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const MealPlanCard = ({ meal }: { meal: Meal }) => (
    <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-b-0">
             <Card className="bg-secondary/50">
                <CardHeader className="p-4">
                     <AccordionTrigger className='p-0 hover:no-underline'>
                        <div className="flex justify-between w-full items-center pr-2">
                           <h4 className="font-semibold">{meal.mealName}</h4>
                           <span className='text-sm text-muted-foreground font-semibold'>{meal.calories.toFixed(0)} kcal</span>
                        </div>
                    </AccordionTrigger>
                </CardHeader>
                <AccordionContent className='px-4'>
                    <div className='pb-4 space-y-4'>
                        <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t">
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
                                <Flame className="h-4 w-4 mx-auto text-orange-500"/>
                                <p className="font-bold">{meal.calories.toFixed(0)}</p>
                                <p className="text-muted-foreground">Kcal</p>
                            </div>
                        </div>

                        <div>
                            <h5 className="font-semibold mb-2 flex items-center gap-2"><ChefHat /> Recipe</h5>
                            <MarkdownList content={meal.recipe} />
                        </div>
                    </div>
                </AccordionContent>
            </Card>
        </AccordionItem>
    </Accordion>
  );

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setIsDialogOpen(true)} disabled={isLoadingGoal}>
          { isLoadingGoal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" /> }
          Generate a Meal Plan
        </Button>
      </div>

      <div className="space-y-6">
        {isLoading ? (
             [...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : mealPlan ? (
            Object.entries(mealTypes).map(([key, name]) => (
            <Card key={key}>
                <CardHeader>
                    <CardTitle className="font-headline">{name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MealPlanCard meal={mealPlan[key as keyof MealPlan]} />
                </CardContent>
            </Card>
            ))
        ) : (
             <div className="text-center py-20 text-muted-foreground">
                <Utensils className="h-12 w-12 mx-auto" />
                <p className="mt-4 text-lg">Your AI-generated meal plan will appear here.</p>
                <p>Click "Generate a Meal Plan" to get started.</p>
            </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Your Meal Preferences</DialogTitle>
            <DialogDescription>
              Tell the AI what you'd like to eat, and it will generate a one-day plan for you.
            </DialogDescription>
          </DialogHeader>
           {dailyGoal > 0 ? (
                <Alert>
                    <Target className="h-4 w-4" />
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>
                        The AI will generate a plan for your daily goal of <strong>{dailyGoal} calories</strong>. You can change this in your <Link href="/profile" className="underline">profile</Link>.
                    </AlertDescription>
                </Alert>
            ) : (
                 <Alert variant="destructive">
                    <Target className="h-4 w-4" />
                    <AlertTitle>Set Your Goal!</AlertTitle>
                    <AlertDescription>
                        For best results, first set your calorie goal in your <Link href="/profile" className="underline">profile</Link>.
                    </AlertDescription>
                </Alert>
            )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cuisine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuisine</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your cuisine preference" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Any">Any</SelectItem>
                            <SelectItem value="Indian">Indian</SelectItem>
                            <SelectItem value="Italian">Italian</SelectItem>
                            <SelectItem value="Mexican">Mexican</SelectItem>
                            <SelectItem value="Chinese">Chinese</SelectItem>
                            <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dietary Preference</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your dietary preference" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                            <SelectItem value="eggetarian">Eggetarian</SelectItem>
                            <SelectItem value="jain">Jain</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" disabled={isLoading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Plan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
