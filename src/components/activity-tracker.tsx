'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Dumbbell, Footprints, Flame, Loader2, Sparkles } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getActivityCalories } from '@/app/actions';
import { addActivity, getActivities } from '@/services/firestore';

const activitySchema = z.object({
  activity: z.string().min(1, 'Activity name is required'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

type ActivityLog = {
  id: string;
  date: string;
  activity: string;
  duration: number;
  caloriesBurned: number;
  createdAt: { seconds: number, nanoseconds: number };
};


export function ActivityTracker() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activity: '',
      duration: 0,
    },
  });
  
  useEffect(() => {
    async function loadActivities() {
      setIsLoading(true);
      const savedActivities = await getActivities();
      const activitiesWithDate = (savedActivities as any[]).map(act => ({
        ...act,
        date: new Date(act.createdAt.seconds * 1000).toLocaleDateString()
      }))
      setActivities(activitiesWithDate);
      setIsLoading(false);
    }
    loadActivities();
  }, []);


  const onSubmit: SubmitHandler<ActivityFormValues> = async (data) => {
    setIsCalculating(true);
    try {
      const { caloriesBurned } = await getActivityCalories(data);
      const newActivityData = {
        ...data,
        caloriesBurned: Math.round(caloriesBurned),
      };
      await addActivity(newActivityData);
      
      const newActivityForState: ActivityLog = {
        ...newActivityData,
        id: Date.now().toString(), // temp id
        date: new Date().toLocaleDateString(),
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
      };
      setActivities((prev) => [newActivityForState, ...prev]);

      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: 'Could not log activity. Please try again.',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-end mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-headline">Log New Activity</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="activity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Morning Run" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isCalculating}>
                      {isCalculating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Log Activity
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableCaption>A list of your recent activities.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">Duration (min)</TableHead>
                <TableHead className="text-right">Calories Burned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : activities.length > 0 ? (
                activities.map((act) => (
                  <TableRow key={act.id}>
                    <TableCell>{act.date}</TableCell>
                    <TableCell className="font-medium">{act.activity}</TableCell>
                    <TableCell className="text-right">{act.duration}</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1"><Flame className="h-4 w-4 text-orange-500" />{act.caloriesBurned} kcal</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No activities logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
