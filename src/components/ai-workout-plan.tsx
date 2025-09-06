
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Loader2, Sparkles, Dumbbell, Brain, Check } from 'lucide-react';
import type { GenerateWorkoutPlanOutput } from '@/ai/flows/generate-workout-plan';
import { Skeleton } from './ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { getProfile } from '@/services/firestore';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const planFormSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  bodyTypeGoal: z.enum(['lean', 'toned', 'muscular']),
  restDay: z.enum(['any', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
});

type PlanFormValues = z.infer<typeof planFormSchema>;
type WorkoutPlan = GenerateWorkoutPlanOutput;
const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function AiWorkoutPlan() {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileGoal, setProfileGoal] = useState<{ goal: string, buildMuscle: boolean } | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const { toast } = useToast();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
        fitnessLevel: 'beginner',
        bodyTypeGoal: 'toned',
        restDay: 'any',
    }
  });

  useEffect(() => {
    async function fetchGoal() {
        setIsLoadingGoal(true);
        const profile = await getProfile();
        if (profile && profile.goal) {
            setProfileGoal({ goal: profile.goal, buildMuscle: profile.buildMuscle || false });
        }
        setIsLoadingGoal(false);
    }
    fetchGoal();
  }, []);

  const onSubmit: SubmitHandler<PlanFormValues> = async (data) => {
    if (!profileGoal) {
        toast({
            variant: 'destructive',
            title: 'Goal Not Set',
            description: 'Please set your fitness goal on the Goal page before generating a workout plan.',
        });
        return;
    }
    setIsLoading(true);
    setWorkoutPlan(null);

    try {
      const response = await fetch('/api/generate-workout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ...profileGoal }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workout plan');
      }

      const result = await response.json();
      // Ensure the schedule is sorted Monday-Sunday
      result.weeklySchedule.sort((a, b) => weekDays.indexOf(a.day.toLowerCase()) - weekDays.indexOf(b.day.toLowerCase()));
      setWorkoutPlan(result);

      toast({
        title: "Workout Plan Generated!",
        description: "Your personalized weekly workout plan is ready.",
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
  
  const WorkoutPlanDisplay = ({ plan }: { plan: WorkoutPlan }) => (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl text-primary">{plan.planName}</CardTitle>
        <CardDescription>{plan.planSummary}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-2" defaultValue={weekDays[new Date().getDay() -1]}>
             {plan.weeklySchedule.map(day => (
                <AccordionItem value={day.day.toLowerCase()} key={day.day} className="border-b-0">
                    <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
                        <CardHeader className='p-0'>
                             <AccordionTrigger className='p-4 hover:no-underline'>
                                <div className="flex justify-between w-full items-center pr-2">
                                   <h4 className="font-semibold capitalize">{day.day}</h4>
                                   <span className='text-sm text-muted-foreground font-semibold'>{day.focus}</span>
                                </div>
                            </AccordionTrigger>
                        </CardHeader>
                        <AccordionContent className='px-4 pb-4'>
                             {day.exercises && day.exercises.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Exercise</TableHead>
                                            <TableHead>Sets</TableHead>
                                            <TableHead>Reps</TableHead>
                                            <TableHead>Rest</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {day.exercises.map(ex => (
                                            <TableRow key={ex.name}>
                                                <TableCell className="font-medium">
                                                    {ex.name}
                                                    {ex.notes && <p className="text-xs text-muted-foreground italic mt-1">{ex.notes}</p>}
                                                </TableCell>
                                                <TableCell>{ex.sets}</TableCell>
                                                <TableCell>{ex.reps}</TableCell>
                                                <TableCell>{ex.rest}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center py-8">
                                    <Brain className="h-10 w-10 text-primary mb-2" />
                                    <p className="font-semibold">Rest & Recover</p>
                                    <p className="text-sm text-muted-foreground">Recovery is just as important as training. Use today to rest and recharge.</p>
                                </div>
                            )}
                        </AccordionContent>
                    </Card>
                </AccordionItem>
             ))}
        </Accordion>
      </CardContent>
    </Card>
  )

  return (
    <>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Set Your Workout Preferences</CardTitle>
                <CardDescription>
                Tell the AI your preferences to generate a tailored plan. Your primary goal is taken from the Goal page.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoadingGoal ? (
                     <Skeleton className="h-10 w-1/2" />
                 ) : !profileGoal ? (
                    <Alert variant="destructive">
                        <Dumbbell className="h-4 w-4" />
                        <AlertTitle>Set Your Goal First!</AlertTitle>
                        <AlertDescription>
                            Please go to the <Link href="/goal" className="underline font-semibold">Goal page</Link> to set your primary fitness goal before generating a workout plan.
                        </AlertDescription>
                    </Alert>
                 ) : (
                    <Alert>
                        <Check className="h-4 w-4" />
                        <AlertTitle>Your Goal is Set!</AlertTitle>
                        <AlertDescription>
                            Your plan will be generated for your goal to <span className="font-semibold capitalize">{profileGoal.goal} weight</span>
                            {profileGoal.buildMuscle && <span className="font-semibold"> and build muscle</span>}.
                        </AlertDescription>
                    </Alert>
                 )}

                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="fitnessLevel"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fitness Level</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="beginner">Beginner</SelectItem>
                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                            <SelectItem value="advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="bodyTypeGoal"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Desired Body Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="lean">Lean</SelectItem>
                                            <SelectItem value="toned">Toned</SelectItem>
                                            <SelectItem value="muscular">Muscular</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="restDay"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preferred Rest Day</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="any">Any</SelectItem>
                                            <SelectItem value="monday">Monday</SelectItem>
                                            <SelectItem value="tuesday">Tuesday</SelectItem>
                                            <SelectItem value="wednesday">Wednesday</SelectItem>
                                            <SelectItem value="thursday">Thursday</SelectItem>
                                            <SelectItem value="friday">Friday</SelectItem>
                                            <SelectItem value="saturday">Saturday</SelectItem>
                                            <SelectItem value="sunday">Sunday</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" disabled={isLoading || isLoadingGoal || !profileGoal} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Generating Your Plan...' : 'Generate Workout Plan'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
        
        <div className="mt-8">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Crafting your personalized workout plan...<br/>This can take up to a minute.</p>
                </div>
            ) : workoutPlan ? (
                <WorkoutPlanDisplay plan={workoutPlan} />
            ) : (
                <div className="text-center py-20 text-muted-foreground">
                    <Dumbbell className="h-12 w-12 mx-auto" />
                    <p className="mt-4 text-lg">Your AI-generated workout plan will appear here.</p>
                    <p>Set your preferences above to get started.</p>
                </div>
            )}
      </div>
    </>
  );
}
