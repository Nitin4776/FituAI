
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Trash2, Pencil, Flame, Dumbbell, Bike, PersonStanding, Weight, HeartPulse, Brain, Waves, Footprints, Sword } from 'lucide-react';
import { getTodaysActivities, addActivity, updateActivity, deleteActivity } from '@/services/firestore';
import { analyzeActivity, type AnalyzeActivityOutput } from '@/ai/flows/analyze-activity';
import type { ActivityLog } from '@/lib/types';
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

const activityFormSchema = z.object({
  activityName: z.string().min(2, 'Activity name is required.'),
  duration: z.string().min(1, 'Duration is required.'),
  description: z.string().optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

// Helper to get an icon for an activity
const getActivityIcon = (activityName: string): React.ElementType => {
    const lowerCaseName = activityName.toLowerCase();
    if (lowerCaseName.includes('run') || lowerCaseName.includes('jog')) return Footprints;
    if (lowerCaseName.includes('walk')) return PersonStanding;
    if (lowerCaseName.includes('cycl') || lowerCaseName.includes('bik')) return Bike;
    if (lowerCaseName.includes('weight') || lowerCaseName.includes('lift')) return Weight;
    if (lowerCaseName.includes('yoga') || lowerCaseName.includes('meditat')) return Brain;
    if (lowerCaseName.includes('cardio') || lowerCaseName.includes('hiit')) return HeartPulse;
    if (lowerCaseName.includes('swim')) return Waves;
    if (lowerCaseName.includes('sport') || lowerCaseName.includes('martial art')) return Sword;
    return Dumbbell;
}

export function ActivityLogger() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityLog | null>(null);
  const { toast } = useToast();

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
  });

  const fetchActivities = async () => {
    setIsLoading(true);
    const todaysActivities = await getTodaysActivities();
    setActivities(todaysActivities);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleAddClick = () => {
    setEditingActivity(null);
    form.reset({ activityName: '', duration: '', description: '' });
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (activity: ActivityLog) => {
    setEditingActivity(activity);
    form.reset({
      activityName: activity.activityName,
      duration: activity.duration,
      description: activity.description || ''
    });
    setIsDialogOpen(true);
  }

  const handleDelete = async (activity: ActivityLog) => {
    try {
        await deleteActivity(activity);
        toast({
            title: "Activity Deleted",
            description: `${activity.activityName} has been removed from your log.`,
        });
        fetchActivities(); // Refresh the list
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: (error as Error).message,
        });
    }
  }

  const onSubmit: SubmitHandler<ActivityFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
        const { caloriesBurned }: AnalyzeActivityOutput = await analyzeActivity(data);

        if (editingActivity) {
            const fullActivityData = {
                ...editingActivity,
                ...data,
                caloriesBurned,
            };
            await updateActivity(fullActivityData);
            toast({
                title: "Activity Updated",
                description: `${data.activityName} has been successfully updated.`,
            });
        } else {
            const fullActivityData = {
                ...data,
                caloriesBurned,
            };
             await addActivity(fullActivityData);
             toast({
                title: "Activity Added",
                description: `Our AI has analyzed and logged ${data.activityName}.`,
             });
        }
      
      fetchActivities();
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

  const ActivityCard = ({ activity }: { activity: ActivityLog }) => {
    const Icon = getActivityIcon(activity.activityName);
    return (
        <Card className="bg-secondary/50">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <Icon className="h-8 w-8 text-primary mt-1" />
                        <div>
                            <h4 className="font-semibold">{activity.activityName}</h4>
                            <p className="text-sm text-muted-foreground">{activity.duration}</p>
                            {activity.description && <p className="text-xs text-muted-foreground mt-1 italic">"{activity.description}"</p>}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(activity)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your activity entry
                                    and remove its data from your daily summary.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(activity)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-center mt-3 pt-3 border-t">
                    <Flame className="h-5 w-5 text-orange-500"/>
                    <p className="font-semibold">{activity.caloriesBurned.toFixed(0)}</p>
                    <p className="text-muted-foreground text-sm">Calories Burned (est.)</p>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline">Logged Activities</CardTitle>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" /> Log Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            {isLoading ? (
                [...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
            ) : activities.length > 0 ? (
                activities.map(activity => <ActivityCard key={activity.id} activity={activity} />)
            ) : (
                <div className="text-center py-10">
                    <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">No activities logged yet for today.</p>
                </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit' : 'Log'} Activity / Workout</DialogTitle>
            <DialogDescription>
              Enter the details below. Our AI will estimate the calories burned.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="activityName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity / Workout Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Running, Weightlifting" {...field} />
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
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 30 minutes, 1 hour" {...field} />
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
                      <Textarea placeholder="Any extra details? e.g., 5km distance, 3 sets of 10 reps" {...field} />
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
                  {isSubmitting ? (editingActivity ? 'Updating...' : 'Logging...') : (editingActivity ? 'Update Activity' : 'Log Activity')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
