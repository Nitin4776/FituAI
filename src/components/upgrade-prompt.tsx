
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock } from 'lucide-react';

interface UpgradePromptProps {
    featureName: string;
    description?: string;
}

export function UpgradePrompt({ featureName, description }: UpgradePromptProps) {
    return (
        <Card className="text-center bg-gradient-to-r from-primary/10 to-accent/10">
            <CardHeader>
                <CardTitle className="font-headline flex items-center justify-center gap-2">
                    <Lock className="text-primary" />
                    Unlock {featureName}
                </CardTitle>
                <CardDescription>
                   {description || 'This is a premium feature. Upgrade your plan to access it and more AI-powered tools.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/subscribe">
                    <Button>
                        <Sparkles className="mr-2" />
                        Upgrade to Premium
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
