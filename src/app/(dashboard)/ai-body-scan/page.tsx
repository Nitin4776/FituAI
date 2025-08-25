
import { AiBodyScan } from '@/components/ai-body-scan';
import { Sparkles } from 'lucide-react';

export default function AiBodyScanPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary flex items-center gap-2">
            AI Body Scan <Sparkles className="text-yellow-500" />
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Upload front and back photos for our AI to estimate your height, weight, and age.
        </p>
      </div>
      <AiBodyScan />
    </div>
  );
}
