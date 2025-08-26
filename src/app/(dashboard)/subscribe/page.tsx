
'use client';

import { useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { saveProfile } from '@/services/firestore';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const standardFeatures = [
    'Set & Track Personal Goals',
    'Intermittent Fasting Calculator',
    'Log Meals, Activities & Water',
];

const premiumFeatures = [
    'AI-Powered Healthy Swaps',
    'AI Blood Test Analysis',
    'AI Meal Plan Generator',
    'AI Body Vitals Scan',
    'Personalized AI Daily Suggestions',
];

const plans = [
    {
        name: 'Free',
        price: '₹0',
        duration: 'month',
        features: standardFeatures,
        premium: false,
        cta: 'Continue with Free',
        planId: 'free',
    },
    {
        name: 'Monthly',
        price: '₹49',
        originalPrice: '₹100',
        discount: '51% off',
        duration: 'month',
        features: [...standardFeatures, ...premiumFeatures],
        premium: true,
        cta: 'Choose Monthly',
        planId: 'monthly',
    },
    {
        name: 'Half-Yearly',
        price: '₹294',
        originalPrice: '₹600',
        discount: '51% off',
        duration: '6 months',
        features: [...standardFeatures, ...premiumFeatures],
        premium: true,
        cta: 'Choose Half-Yearly',
        planId: 'half_yearly',
    },
    {
        name: 'Yearly',
        price: '₹588',
        originalPrice: '₹1200',
        discount: '51% off',
        duration: 'year',
        features: [...standardFeatures, ...premiumFeatures],
        premium: true,
        cta: 'Choose Yearly',
        planId: 'yearly',
    }
]

type Plan = typeof plans[0];

export default function SubscribePage() {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const { toast } = useToast();
    const router = useRouter();

    const handlePlanSelection = (plan: Plan) => {
        if (plan.planId === 'free') {
            handleSelectPlan(plan.planId);
        } else {
            setSelectedPlan(plan);
            setCouponCode('');
            setIsCouponDialogOpen(true);
        }
    };

    const handleProceedToPayment = () => {
        toast({
            variant: 'destructive',
            title: 'Coming Soon!',
            description: 'Payment gateway integration in progress. Please try the 1-month free plan with the available coupon code.',
        });
    };
    
    const handleApplyCoupon = async () => {
        if (selectedPlan?.planId === 'monthly' && couponCode === 'FITUAI-INDIA') {
            setIsLoading(selectedPlan.planId);
            try {
                const now = new Date();
                const subscribedUntil = new Date(now.setMonth(now.getMonth() + 1));
                
                await saveProfile({
                    subscription: {
                        plan: 'monthly',
                        subscribedAt: new Date(),
                        subscribedUntil: subscribedUntil,
                        coupon: 'FITUAI-INDIA'
                    }
                });
                
                toast({
                    title: 'Coupon Applied!',
                    description: "You've received a 1-month free subscription! You're being redirected.",
                });

                router.push('/profile');

            } catch(error) {
                toast({
                    variant: 'destructive',
                    title: 'Something went wrong',
                    description: 'Could not apply your coupon. Please try again.',
                });
            } finally {
                setIsLoading(null);
                setIsCouponDialogOpen(false);
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Invalid Coupon',
                description: 'This coupon code is not valid for the selected plan.',
            });
        }
    }

    const handleSelectPlan = async (planId: string) => {
        setIsLoading(planId);
        try {
            // This is where you would call the API to create a payment order
            // For now, we simulate success and update the profile
            const now = new Date();
            let subscribedUntil: Date | null = null;
            if (planId === 'monthly') {
                subscribedUntil = new Date(now.setMonth(now.getMonth() + 1));
            } else if (planId === 'half_yearly') {
                subscribedUntil = new Date(now.setMonth(now.getMonth() + 6));
            } else if (planId === 'yearly') {
                subscribedUntil = new Date(now.setFullYear(now.getFullYear() + 1));
            }

            await saveProfile({
                subscription: {
                    plan: planId,
                    subscribedAt: new Date(),
                    subscribedUntil: subscribedUntil
                }
            });
            
            toast({
                title: 'Plan Selected!',
                description: "You're now being redirected to complete your profile.",
            });

            router.push('/profile');

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Something went wrong',
                description: 'Could not update your subscription. Please try again.',
            });
        } finally {
            setIsLoading(null);
            setIsCouponDialogOpen(false);
        }
    }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8">
        <div className="text-center mb-8">
            <h1 className="font-headline text-4xl md:text-5xl text-primary">Choose Your Plan</h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Unlock the full power of AI to supercharge your health journey.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map(plan => (
                <Card key={plan.name} className={cn(
                    "flex flex-col",
                    plan.premium && "border-primary border-2 shadow-primary/20 bg-gradient-to-r from-primary/10 to-accent/10"
                )}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                            {plan.premium && (plan as any).discount && (
                                <Badge variant="destructive">{(plan as any).discount}</Badge>
                            )}
                        </div>
                        <CardDescription>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                                {plan.premium && (plan as any).originalPrice && (
                                     <span className="text-lg line-through text-muted-foreground">{(plan as any).originalPrice}</span>
                                )}
                                <span className="text-muted-foreground">/{plan.duration}</span>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <ul className="space-y-2 text-sm">
                            {plan.features.map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                    <span className={cn(premiumFeatures.includes(feature) ? "text-primary" : "text-green-500")}>
                                        <Check className="h-4 w-4" />
                                    </span>
                                    <span className="text-muted-foreground">{feature}</span>
                                </li>
                            ))}
                             {!plan.premium && premiumFeatures.map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                     <span className="text-destructive">
                                        <X className="h-4 w-4" />
                                    </span>
                                    <span className="text-muted-foreground/50">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant={plan.premium ? 'default' : 'outline'}
                            onClick={() => handlePlanSelection(plan)}
                            disabled={!!isLoading}
                        >
                            {isLoading === plan.planId ? <Loader2 className="animate-spin" /> : plan.cta}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
         <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
                You can change your plan at any time.
            </p>
        </div>

        <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Have a Coupon Code?</DialogTitle>
                    <DialogDescription>
                        {selectedPlan?.planId === 'monthly' 
                            ? 'Get 1 month of premium access for FREE! Enter the coupon code "FITUAI-INDIA" and click Apply.'
                            : 'If you have a coupon code, enter it below. Otherwise, proceed to payment.'
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="coupon-code">Coupon Code</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="coupon-code" 
                            placeholder="Enter your code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                        />
                         {selectedPlan?.planId === 'monthly' && (
                            <Button 
                                onClick={handleApplyCoupon}
                                disabled={isLoading === 'monthly' || couponCode.toUpperCase() !== 'FITUAI-INDIA'}
                            >
                                {isLoading === 'monthly' ? <Loader2 className="animate-spin" /> : 'Apply'}
                            </Button>
                         )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                         <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleProceedToPayment} disabled={!!isLoading}>
                        {isLoading && isLoading !== 'monthly' ? <Loader2 className="animate-spin" /> : 'Make a Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
