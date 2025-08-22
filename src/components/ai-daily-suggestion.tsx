
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

export function AiDailySuggestion() {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuggestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/daily-suggestion');
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch suggestion.');
      }
      const result = await response.json();
      setSuggestion(result.suggestion);
    } catch (error) {
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
          <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: suggestion || '' }} />
        )}
      </CardContent>
    </Card>
  );
}
