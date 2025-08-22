
import { BloodTestAnalyzer } from '@/components/blood-test-analyzer';

export default function BloodTestPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Blood Test Analysis</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Upload your blood test report for an AI-powered analysis and summary.
        </p>
      </div>
      <BloodTestAnalyzer />
    </div>
  );
}
