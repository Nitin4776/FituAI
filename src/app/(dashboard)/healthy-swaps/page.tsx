
import { HealthySwap } from '@/components/healthy-swap';
import { Sparkles } from 'lucide-react';

export default function HealthySwapsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary flex items-center gap-2">
            Healthy Swap AI <Sparkles className="text-yellow-500" />
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Enter a food item and let our AI suggest a healthier alternative for you.
        </p>
      </div>
      <HealthySwap />
    </div>
  );
}
