
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import { GlassWater, Minus, Plus, Loader2, Target } from 'lucide-react';
import { getProfile, saveWaterIntake, getTodaysWaterIntake } from '@/services/firestore';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './ui/progress';

// Assuming one glass is 250ml
const GLASS_SIZE_ML = 250;

export function WaterLogger() {
    const [glasses, setGlasses] = useState(0);
    const [goalGlasses, setGoalGlasses] = useState(8); // Default goal
    const [goalLiters, setGoalLiters] = useState(2); // Default goal
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchWaterData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [profile, todaysWaterLog] = await Promise.all([getProfile(), getTodaysWaterIntake()]);

            if (profile?.weight) {
                // A common recommendation is 30-35ml of water per kg of body weight. We'll use 33ml.
                const recommendedIntakeMl = profile.weight * 33;
                setGoalLiters(parseFloat((recommendedIntakeMl / 1000).toFixed(1)));
                setGoalGlasses(Math.round(recommendedIntakeMl / GLASS_SIZE_ML));
            }

            if (todaysWaterLog) {
                setGlasses(todaysWaterLog.glasses);
            }

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load your water intake data.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchWaterData();
    }, [fetchWaterData]);

    const handleUpdateWater = async (newCount: number) => {
        if (newCount < 0) return;
        setGlasses(newCount); // Optimistic update
        try {
            await saveWaterIntake({ glasses: newCount });
        } catch (error) {
            setGlasses(glasses); // Revert on error
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not save your water intake.'
            })
        }
    }

    const progressPercentage = goalGlasses > 0 ? (glasses / goalGlasses) * 100 : 0;
    
    return (
        <Card>
        <CardHeader>
            <CardTitle className="font-headline">Today's Water Intake</CardTitle>
            <CardDescription>Log your water consumption to stay hydrated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 text-center p-6">
                 <div className='flex items-center justify-center gap-2 mb-4'>
                    <Target className="h-5 w-5 text-primary" />
                    <p className="text-muted-foreground">
                        Your suggested daily goal is 
                        <span className="font-bold text-primary"> {goalLiters} liters</span> 
                        (approx. <span className="font-bold text-primary">{goalGlasses} glasses</span>).
                    </p>
                </div>
                {isLoading ? (
                     <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center space-x-4">
                        <Button size="icon" variant="outline" className="rounded-full w-16 h-16" onClick={() => handleUpdateWater(glasses - 1)} disabled={glasses === 0}>
                            <Minus className="h-8 w-8" />
                        </Button>
                        <div className="text-center">
                            <GlassWater className="h-32 w-32 text-primary mx-auto" />
                            <p className="text-4xl font-bold mt-2">{glasses}</p>
                            <p className="text-muted-foreground">glasses</p>
                        </div>
                        <Button size="icon" variant="outline" className="rounded-full w-16 h-16" onClick={() => handleUpdateWater(glasses + 1)}>
                            <Plus className="h-8 w-8" />
                        </Button>
                    </div>
                )}
            </Card>

            <div>
                <Progress value={progressPercentage} className="h-4" />
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>{glasses} of {goalGlasses} glasses</span>
                    <span>{Math.round(progressPercentage)}%</span>
                </div>
            </div>
        </CardContent>
        </Card>
    );
}
