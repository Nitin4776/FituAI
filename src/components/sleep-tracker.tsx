'use client';

import { useState, useEffect } from 'react';
import { saveSleepLog } from '@/services/firestore';
import { getSleepLogForToday } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { SleepLog } from '@/lib/types';
import { Label } from './ui/label';

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
            const sleepLog = await getSleepLogForToday();
            if (sleepLog) {
                setSelectedSleep(sleepLog.quality);
            }
            setIsLoading(false);
        }
        loadSleepLog();
    }, []);

    const handleSelectSleep = async (quality: SleepQuality) => {
        if (isLoading) return; // Prevent clicking while still loading/saving
        const originalState = selectedSleep;
        setSelectedSleep(quality); // Optimistic update
        try {
            await saveSleepLog({ quality });
            toast({
                title: 'Sleep Logged',
                description: `You've logged your sleep as "${quality}".`,
            });
        } catch (error) {
            setSelectedSleep(originalState); // Revert on error
            toast({
                variant: 'destructive',
                title: 'Log Failed',
                description: (error as Error).message,
            });
        }
    };

    return (
        <div className="text-center">
            <Label className="text-sm text-muted-foreground">How was your sleep?</Label>
            <div className='flex gap-1 items-center justify-center pt-1'>
                {isLoading ? (
                    <div className='flex items-center justify-center h-9 w-full'>
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    );
}
