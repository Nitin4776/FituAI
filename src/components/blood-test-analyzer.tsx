'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, Loader2, Sparkles, FileText, Activity, ShieldQuestion, AlertTriangle } from 'lucide-react';
import { analyzeReport } from '@/app/actions';
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
import type { AnalyzeBloodTestResultsOutput } from '@/ai/flows/blood-test-results-analysis';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { getLatestBloodTestAnalysis, saveBloodTestAnalysis } from '@/services/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

const formSchema = z.object({
  report: z.custom<FileList>().refine((files) => files?.length === 1, 'A blood test report is required.'),
});

type FormValues = z.infer<typeof formSchema>;

const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

export function BloodTestAnalyzer() {
  const [analysis, setAnalysis] = useState<AnalyzeBloodTestResultsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    async function loadLatestAnalysis() {
      setIsFetchingHistory(true);
      const latestAnalysis = await getLatestBloodTestAnalysis();
      if (latestAnalysis) {
        setAnalysis(latestAnalysis as AnalyzeBloodTestResultsOutput);
      }
      setIsFetchingHistory(false);
    }
    loadLatestAnalysis();
  }, []);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const file = data.report[0];
      const dataUri = await toDataURL(file);
      const result = await analyzeReport({ reportDataUri: dataUri });
      setAnalysis(result);
      await saveBloodTestAnalysis(result);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze the report. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeVariant = (level: string): 'destructive' | 'warning' | 'default' => {
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes('high') || lowerLevel.includes('critical')) {
      return 'destructive';
    }
    if (lowerLevel.includes('low') || lowerLevel.includes('borderline')) {
        return 'warning';
    }
    return 'default';
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Upload Report</CardTitle>
          <CardDescription>Select a new blood test report file to analyze.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="report"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Report File</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            field.onChange(e.target.files);
                            setFileName(e.target.files?.[0]?.name || '');
                          }}
                          className="pl-10"
                        />
                        <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                    {fileName && <p className="text-sm text-muted-foreground">Selected: {fileName}</p>}
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">AI Analysis</CardTitle>
          <CardDescription>Your latest analysis results are shown below.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isLoading || isFetchingHistory ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">
                {isLoading ? 'The AI is analyzing your report...' : 'Loading latest analysis...'}
                <br/>This may take a moment.
              </p>
            </div>
          ) : analysis ? (
            <Accordion type="single" collapsible defaultValue="summary" className="w-full">
              <AccordionItem value="summary">
                <AccordionTrigger><FileText className="mr-2 text-primary" /> Summary</AccordionTrigger>
                <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                  {analysis.summary}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="markers">
                <AccordionTrigger><AlertTriangle className="mr-2 text-primary" /> Critical Markers</AccordionTrigger>
                <AccordionContent>
                   <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Marker</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysis.criticalMarkers.map((marker) => (
                           <TableRow key={marker.marker}>
                             <TableCell className="font-medium">{marker.marker}</TableCell>
                             <TableCell>{marker.value}</TableCell>
                             <TableCell>
                                <Badge variant={getBadgeVariant(marker.level)}>{marker.level}</Badge>
                             </TableCell>
                           </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="dos_donts">
                <AccordionTrigger><ShieldQuestion className="mr-2 text-primary" /> Do's & Don'ts</AccordionTrigger>
                <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                  {analysis.dosAndDonts}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="lifestyle">
                <AccordionTrigger><Activity className="mr-2 text-primary" /> Lifestyle Modifications</AccordionTrigger>
                <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                  {analysis.lifestyleModifications}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Upload a report to see the analysis.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
