
import { ActivityLogger } from '@/components/activity-logger';

export default function LogActivityPage() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Log Activity / Workout</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Enter the details of your workout or physical activity to track your progress and calories burned.
        </p>
      </div>
      <ActivityLogger />
    </div>
  );
}
