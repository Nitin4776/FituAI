'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Sunrise, Sunset, Zap } from 'lucide-react';

type FastingPlan = '16:8' | '18:6' | '20:4';

const fastingPlans = {
  '16:8': {
    name: '16:8 Method (Leangains)',
    eatingWindow: '12:00 PM - 8:00 PM',
    fastingWindow: '8:00 PM - 12:00 PM (next day)',
    description: 'A popular choice for beginners. It involves fasting for 16 hours and restricting your eating window to 8 hours. Many find it easy to adapt to their daily schedule.',
  },
  '18:6': {
    name: '18:6 Method',
    eatingWindow: '2:00 PM - 8:00 PM',
    fastingWindow: '8:00 PM - 2:00 PM (next day)',
    description: 'A slightly more advanced approach with a longer fasting period. This can potentially lead to greater benefits in terms of fat loss and autophagy.',
  },
  '20:4': {
    name: '20:4 Method (The Warrior Diet)',
    eatingWindow: '4:00 PM - 8:00 PM',
    fastingWindow: '8:00 PM - 4:00 PM (next day)',
    description: 'This is an advanced form of intermittent fasting, involving a 20-hour fast and a 4-hour eating window. It typically involves one large meal per day.',
  },
};

export function FastingCalculator() {
  const [selectedPlan, setSelectedPlan] = useState<FastingPlan>('16:8');
  const planDetails = fastingPlans[selectedPlan];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Select Your Plan</CardTitle>
          <CardDescription>Choose an intermittent fasting protocol.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedPlan}
            onValueChange={(value: FastingPlan) => setSelectedPlan(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a fasting plan" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(fastingPlans).map((plan) => (
                <SelectItem key={plan} value={plan}>
                  {fastingPlans[plan as FastingPlan].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      <Card className="row-span-2">
        <CardHeader>
          <CardTitle className="font-headline">{planDetails.name}</CardTitle>
          <CardDescription>Your recommended schedule and plan benefits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center"><Clock className="mr-2 h-4 w-4 text-primary"/> Schedule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-secondary rounded-lg">
                    <div className="font-medium flex items-center"><Sunrise className="mr-2 h-4 w-4 text-green-600"/> Eating Window</div>
                    <p className="text-muted-foreground">{planDetails.eatingWindow}</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                    <div className="font-medium flex items-center"><Sunset className="mr-2 h-4 w-4 text-blue-600"/> Fasting Window</div>
                    <p className="text-muted-foreground">{planDetails.fastingWindow}</p>
                </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center"><Zap className="mr-2 h-4 w-4 text-primary"/> Benefits & Info</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {planDetails.description} Common benefits of intermittent fasting include weight loss, improved metabolic health, and cellular repair. Always consult with a healthcare professional before starting a new diet plan.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
