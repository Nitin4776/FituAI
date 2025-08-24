
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Utensils, Wheat } from 'lucide-react';

const formSchema = z.object({
  foodItem: z.string().min(2, 'Please enter a food item.'),
});
type FormValues = z.infer<typeof formSchema>;

type SwapSuggestion = {
  healthySwap: string;
  reason: string;
};

export function HealthySwap() {
  const [suggestion, setSuggestion] = useState<SwapSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { foodItem: '' },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const response = await fetch('/api/healthy-swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestion');
      }

      const result = await response.json();
      setSuggestion(result);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: 'Could not get a swap suggestion. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Find a Healthy Swap</CardTitle>
          <CardDescription>What's a food you'd like to replace?</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="foodItem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Item</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Potato Chips" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Suggestion...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get AI Suggestion
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">AI Suggestion</CardTitle>
          <CardDescription>Your healthier alternative will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[150px]">
          {isLoading && (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Finding a delicious swap...</p>
            </div>
          )}
          {suggestion && !isLoading && (
            <div className="text-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Instead of {form.getValues('foodItem')}, try:</p>
                <p className="text-2xl font-bold font-headline text-primary">{suggestion.healthySwap}</p>
              </div>
              <div className="text-left p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                <p className="font-semibold flex items-center"><Wheat className="mr-2 h-4 w-4"/>Why it's better:</p>
                <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
              </div>
            </div>
          )}
          {!suggestion && !isLoading && (
            <div className="text-center text-muted-foreground">
              <Utensils className="h-8 w-8 mx-auto" />
              <p className="mt-2">Enter a food to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
