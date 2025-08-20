'use client';

import { useState, useEffect } from 'react';
import { saveSleepLogAction } from '@/app/actions';
import { getSleepLogForToday } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { SleepLog } from '@/lib/types';

const sleepOptions = {
    excellent: '🤩',
    good: '😊',
    moderate: '😐',
    low: '😩',
};

type SleepQuality = keyof typeof sleepOptions;

export function SleepTracker() {
    const [selectedSleep, setSelectedSleep] = useState<SleepQuality | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function loadSleepLog() {
            setIsLoading(true);
            const sleepLog = await getSleepLogForToday() as SleepLog | null;
            if (sleepLog) {
                setSelectedSleep(sleepLog.quality as SleepQuality);
            }
            setIsLoading(false);
        }
        loadSleepLog();
    }, []);

    const handleSelectSleep = async (quality: SleepQuality) => {
        setSelectedSleep(quality);
        try {
            await saveSleepLogAction(quality);
            toast({
                title: 'Sleep Logged',
                description: `You've logged your sleep as "${quality}".`,
            });
        } catch (error) {
            setSelectedSleep(null); // Revert on error
            toast({
                variant: 'destructive',
                title: 'Log Failed',
                description: (error as Error).message,
            });
        }
    };

    if (isLoading) {
        return (
            <div>
                 <p className="text-sm text-muted-foreground">Sleep</p>
                 <div className='flex justify-center items-center h-full'>
                    <Loader2 className="h-5 w-5 animate-spin" />
                 </div>
            </div>
        )
    }

    return (
        <div>
            <p className="text-sm text-muted-foreground">Sleep</p>
            <div className='flex gap-1 items-center justify-center pt-2'>
                <TooltipProvider>
                    {Object.entries(sleepOptions).map(([quality, emoji]) => (
                        <Tooltip key={quality}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        'text-2xl rounded-full h-9 w-9 transition-all duration-200',
                                        selectedSleep === quality ? 'bg-primary/20 scale-110' : 'opacity-50 hover:opacity-100'
                                    )}
                                    onClick={() => handleSelectSleep(quality as SleepQuality)}
                                >
                                    {emoji}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className='capitalize'>{quality}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
             <p className="text-xs text-muted-foreground">&nbsp;</p>
        </div>
    );
}
