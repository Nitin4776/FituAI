import { FastingCalculator } from '@/components/fasting-calculator';

export default function FastingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Intermittent Fasting Calculator</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Choose a fasting plan to see your recommended schedule and learn about its benefits.
        </p>
      </div>
      <FastingCalculator />
    </div>
  );
}
