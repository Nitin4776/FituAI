
'use client';

import { ProfileForm } from '@/components/profile-form';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { signOut } = useAuth();
  
  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="font-headline text-3xl md:text-4xl text-primary">Profile</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Update your personal details to calculate your body metrics.
                </p>
            </div>
             <Button variant="ghost" onClick={signOut} className="flex-shrink-0">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Sign Out</span>
            </Button>
        </div>
      <ProfileForm />
    </div>
  );
}
