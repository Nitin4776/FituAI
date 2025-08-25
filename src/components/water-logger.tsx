
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function WaterLogger() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Today's Water Intake</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Water logging functionality will be implemented here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
