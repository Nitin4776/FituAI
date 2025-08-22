'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Flame, Loader2, Sparkles, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  DialogDescription,
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
import { getActivityCalories, deleteActivityAction } from '@/app/actions';
import { addActivity, getTodaysActivities, updateActivity, updateDailySummaryOnActivityChange } from '@/services/firestore';
import { Textarea } from './ui/textarea';
import type { ActivityLog } from '@/lib/types';


const activitySchema = z.object({
  activity: z.string().min(1, 'Activity name is required'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  description: z.string().optional(),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

export function ActivityTracker() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingActivity, setEditingActivity] = useState<ActivityLog | null>(null);

  const { toast } = useToast();

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activity: '',
      duration: 0,
      description: '',
    },
  });
  
  useEffect(() => {
    async function loadActivities() {
      setIsLoading(true);
      const todaysActivities = await getTodaysActivities();
      setActivities(todaysActivities);
      setIsLoading(false);
    }
    loadActivities();
  }, []);
  
  useEffect(() => {
    if (isDialogOpen && editingActivity) {
      form.reset({
        activity: editingActivity.activity,
        duration: editingActivity.duration,
        description: editingActivity.description || '',
      });
    } else if (!isDialogOpen) {
      setEditingActivity(null);
      form.reset({ activity: '', duration: 0, description: '' });
    }
  }, [isDialogOpen, editingActivity, form]);


  const onSubmit: SubmitHandler<ActivityFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const { caloriesBurned } = await getActivityCalories(data);
      const calories = Math.round(caloriesBurned);
      
      const activityData = {
        ...data,
        caloriesBurned: calories,
      };

      if (editingActivity) {
        // Update existing activity
        const updatedActivity = { ...editingActivity, ...activityData };
        await updateActivity(updatedActivity);
        
        // Update summary: subtract old calories, add new calories
        const calorieDifference = calories - editingActivity.caloriesBurned;
        await updateDailySummaryOnActivityChange(calorieDifference);
        
        setActivities((prev) => 
            prev.map(act => act.id === editingActivity.id ? updatedActivity : act)
        );
        toast({ title: "Activity Updated", description: "Your activity has been successfully updated." });
      } else {
        // Add new activity
        const docId = await addActivity(activityData);
        await updateDailySummaryOnActivityChange(calories);
        
        const newActivityForState: ActivityLog = {
          ...activityData,
          id: docId,
          date: new Date().toLocaleDateString(),
          createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
        };
        setActivities((prev) => [newActivityForState, ...prev]);
        toast({ title: "Activity Added", description: "Your activity has been successfully logged." });
      }

      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: `Could not ${editingActivity ? 'update' : 'log'} activity. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (activityId: string, caloriesBurned: number) => {
    try {
      await deleteActivityAction(activityId);
      await updateDailySummaryOnActivityChange(-caloriesBurned);
      setActivities((prev) => prev.filter(act => act.id !== activityId));
      toast({
        title: "Activity Deleted",
        description: "The activity has been removed from your log.",
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete the activity. Please try again.',
      });
    }
  }

  const handleEditClick = (activity: ActivityLog) => {
    setEditingActivity(activity);
    setIsDialogOpen(true);
  }

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
                <DialogTitle className="font-headline">{editingActivity ? 'Edit Activity' : 'Log New Activity'}</DialogTitle>
                <DialogDescription>
                    {editingActivity ? 'Update the details of your activity below.' : 'Add a new activity to your daily log.'}
                </DialogDescription>
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
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Ran at a steady pace with a few sprints." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingActivity ? 'Updating...' : 'Calculating...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {editingActivity ? 'Update Activity' : 'Log Activity'}
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
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">Duration (min)</TableHead>
                <TableHead className="text-right">Calories Burned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="font-medium">
                      <div>{act.activity}</div>
                      {act.description && <div className="text-xs text-muted-foreground">{act.description}</div>}
                    </TableCell>
                    <TableCell className="text-right">{act.duration}</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1"><Flame className="h-4 w-4 text-orange-500" />{act.caloriesBurned} kcal</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(act)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                       <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this activity from your log.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteActivity(act.id, act.caloriesBurned)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No activities logged for today yet.
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
