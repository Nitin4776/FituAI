
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Lightbulb, Loader2 } from 'lucide-react';
import { getAiDailySuggestion } from '@/app/actions';

export function AiDailySuggestion() {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSuggestion() {
      setIsLoading(true);
      const result = await getAiDailySuggestion();
      setSuggestion(result);
      setIsLoading(false);
    }
    fetchSuggestion();
  }, []);

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Lightbulb className="text-primary" />
          AI Daily Suggestion
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <p className="text-muted-foreground">{suggestion}</p>
        )}
      </CardContent>
    </Card>
  );
}
