
import { WaterLogger } from '@/components/water-logger';

export default function LogWaterPage() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Log Water Intake</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Keep track of your daily water consumption to stay hydrated and healthy.
        </p>
      </div>
      <WaterLogger />
    </div>
  );
}
