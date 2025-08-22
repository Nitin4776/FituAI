
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { getAiDailySuggestion } from '@/app/actions';
import { Button } from './ui/button';

export function AiDailySuggestion() {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuggestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAiDailySuggestion();
      setSuggestion(result);
    } catch (error) {
      // The action already returns a user-friendly error message.
      setSuggestion((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestion();
  }, [fetchSuggestion]);

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="font-headline flex items-center gap-2">
            <Lightbulb className="text-primary" />
            AI Daily Suggestion
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchSuggestion} disabled={isLoading}>
                <RefreshCw className={isLoading ? "animate-spin" : ""} />
            </Button>
        </div>
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
