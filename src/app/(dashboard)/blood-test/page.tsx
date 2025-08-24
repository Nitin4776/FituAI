
import { BloodTestAnalyzer } from '@/components/blood-test-analyzer';
import { Sparkles } from 'lucide-react';

export default function BloodTestPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary flex items-center gap-2">
            Blood Test Analysis <Sparkles className="text-yellow-500" />
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Upload your blood test report for an AI-powered analysis and summary.
        </p>
      </div>
      <BloodTestAnalyzer />
    </div>
  );
}
