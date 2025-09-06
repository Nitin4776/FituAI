
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Loader2, Sparkles, Utensils, ChefHat, Flame, Drumstick, Wheat, Beef, Youtube, Trash2, RefreshCw } from 'lucide-react';
import type { GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { Skeleton } from './ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { getDailySummaryForToday, saveMealPlan, getLatestMealPlan, deleteLatestMealPlan } from '@/services/firestore';
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
  const [generatedPlan, setGeneratedPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(0);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const { toast } = useToast();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
        cuisine: 'Any',
        diet: 'vegetarian',
    }
  });

  useEffect(() => {
    async function fetchInitialData() {
        setIsLoadingInitialData(true);
        const [summary, savedPlan] = await Promise.all([
            getDailySummaryForToday(),
            getLatestMealPlan()
        ]);
        setDailyGoal(summary.dailyGoal);
        if (savedPlan) {
            setMealPlan(savedPlan as MealPlan);
        }
        setIsLoadingInitialData(false);
    }
    fetchInitialData();
  }, [])

  const onSubmit: SubmitHandler<PlanFormValues> = async (data) => {
    setIsLoading(true);
    setIsFormDialogOpen(false);
    setGeneratedPlan(null);
    setMealPlan(null);

    try {
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, dailyCalorieGoal: dailyGoal }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const result = await response.json();
      setGeneratedPlan(result);
      toast({
        title: "AI Meal Plan Generated!",
        description: "Review the plan and choose to save or discard it.",
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

  const handleSavePlan = async () => {
      if (!generatedPlan) return;
      setIsLoading(true);
      try {
          await saveMealPlan(generatedPlan);
          setMealPlan(generatedPlan);
          setGeneratedPlan(null);
          toast({
              title: "Meal Plan Saved!",
              description: "Your new meal plan is now active."
          });
      } catch (error) {
           toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: (error as Error).message,
            });
      } finally {
          setIsLoading(false);
      }
  }
  
  const handleDiscardPlan = () => {
      setGeneratedPlan(null);
  }

  const handleGenerateNew = () => {
      setMealPlan(null);
      setGeneratedPlan(null);
      setIsFormDialogOpen(true);
  }

  const handleDeletePlan = async () => {
      setIsLoading(true);
      try {
          await deleteLatestMealPlan();
          setMealPlan(null);
          toast({
              title: 'Plan Discarded',
              description: 'Your saved meal plan has been deleted.'
          })
      } catch (error) {
           toast({
                variant: 'destructive',
                title: 'Delete Failed',
                description: (error as Error).message,
            });
      } finally {
          setIsLoading(false);
      }
  }

  const MealPlanCard = ({ meal }: { meal: Meal }) => (
    <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-b-0">
             <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
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
                            <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-semibold flex items-center gap-2"><ChefHat /> Recipe</h5>
                                 {meal.youtubeSearchQuery && (
                                    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(meal.youtubeSearchQuery)}`} target="_blank" rel="noopener noreferrer">
                                        <Youtube className="h-5 w-5 text-red-600 hover:text-red-700" />
                                    </a>
                                )}
                            </div>
                            <MarkdownList content={meal.recipe} />
                        </div>
                    </div>
                </AccordionContent>
            </Card>
        </AccordionItem>
    </Accordion>
  );

  const PlanDisplay = ({ plan }: { plan: MealPlan }) => (
    <div className="space-y-6">
        {Object.entries(mealTypes).map(([key, name]) => (
            <Card key={key}>
                <CardHeader>
                    <CardTitle className="font-headline">{name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MealPlanCard meal={plan[key as keyof MealPlan]} />
                </CardContent>
            </Card>
        ))}
    </div>
  )

  const renderContent = () => {
    if (isLoading || isLoadingInitialData) {
        return [...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />);
    }
    if (generatedPlan) {
        return (
            <>
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="font-headline">Review Your New Plan</CardTitle>
                        <CardDescription>Do you want to save this meal plan for today?</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center gap-4">
                        <Button onClick={handleSavePlan}>Save Plan</Button>
                        <Button variant="outline" onClick={handleDiscardPlan}>Discard</Button>
                    </CardContent>
                </Card>
                <PlanDisplay plan={generatedPlan} />
            </>
        )
    }
    if (mealPlan) {
        return (
            <>
                 <div className="flex justify-center gap-4">
                    <Button onClick={handleGenerateNew}>
                       <RefreshCw className="mr-2" /> Generate New Plan
                    </Button>
                    <Button variant="destructive" onClick={handleDeletePlan}>
                       <Trash2 className="mr-2" /> Discard Plan
                    </Button>
                </div>
                <PlanDisplay plan={mealPlan} />
            </>
        )
    }
    return (
        <div className="text-center py-20 text-muted-foreground">
            <Utensils className="h-12 w-12 mx-auto" />
            <p className="mt-4 text-lg">You don't have a meal plan for today.</p>
            <Button onClick={() => setIsFormDialogOpen(true)} className="mt-4">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate a Meal Plan
            </Button>
        </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
       {renderContent()}
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
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
                        The AI will generate a plan for your daily goal of <strong>{dailyGoal} calories</strong>. You can change this in your <Link href="/goal" className="underline">Goal section</Link>.
                    </AlertDescription>
                </Alert>
            ) : (
                 <Alert variant="destructive">
                    <Target className="h-4 w-4" />
                    <AlertTitle>Set Your Goal!</AlertTitle>
                    <AlertDescription>
                        For best results, first set your calorie goal in the <Link href="/goal" className="underline">Goal section</Link>.
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
