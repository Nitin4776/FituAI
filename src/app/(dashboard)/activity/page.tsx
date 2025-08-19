import { ActivityTracker } from '@/components/activity-tracker';

export default function ActivityPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Activity Tracker</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Manually log your workouts and daily physical activities to monitor your progress.
        </p>
      </div>
      <ActivityTracker />
    </div>
  );
}
