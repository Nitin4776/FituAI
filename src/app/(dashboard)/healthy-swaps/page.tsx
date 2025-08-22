
import { HealthySwap } from '@/components/healthy-swap';

export default function HealthySwapsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Healthy Swap AI</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Enter a food item and let our AI suggest a healthier alternative for you.
        </p>
      </div>
      <HealthySwap />
    </div>
  );
}
