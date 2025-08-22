
'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Utensils, ChefHat } from 'lucide-react';
import { generateMealPlan } from '@/app/actions';
import type { GenerateMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { Skeleton } from './ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

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
  const { toast } = useToast();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
        cuisine: 'Indian',
        diet: 'vegetarian',
    }
  });

  const onSubmit: SubmitHandler<PlanFormValues> = async (data) => {
    setIsLoading(true);
    setIsDialogOpen(false);
    setMealPlan(null);

    try {
      const result = await generateMealPlan(data);
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

  const MealPlanCard = ({ mealName, recipe }: { mealName: string; recipe: string }) => (
    <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-b-0">
             <Card className="bg-secondary/50">
                <CardHeader className="p-4">
                     <AccordionTrigger className='p-0 hover:no-underline'>
                        <h4 className="font-semibold">{mealName}</h4>
                    </AccordionTrigger>
                </CardHeader>
                <AccordionContent className='px-4'>
                    <div className='pb-4'>
                        <h5 className="font-semibold mb-2 flex items-center gap-2"><ChefHat /> Recipe</h5>
                        <MarkdownList content={recipe} />
                    </div>
                </AccordionContent>
            </Card>
        </AccordionItem>
    </Accordion>
  );

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setIsDialogOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" /> Generate a Meal Plan
        </Button>
      </div>

      <div className="space-y-6">
        {isLoading ? (
             [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : mealPlan ? (
            Object.entries(mealTypes).map(([key, name]) => (
            <Card key={key}>
                <CardHeader>
                    <CardTitle className="font-headline">{name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <MealPlanCard 
                        mealName={mealPlan[key as keyof MealPlan].mealName} 
                        recipe={mealPlan[key as keyof MealPlan].recipe} 
                    />
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cuisine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuisine</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Italian, Mexican, Indian" {...field} />
                    </FormControl>
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
