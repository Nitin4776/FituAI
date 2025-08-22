
'use client';

import { ProfileManager } from '@/components/profile-manager';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { signOut } = useAuth();
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="font-headline text-3xl md:text-4xl text-primary">Profile & Goal</h1>
            <p className="mt-2 text-lg text-muted-foreground">
            Update your personal details and set your goal to get personalized recommendations.
            </p>
        </div>
         <Button variant="ghost" onClick={signOut} className="flex-shrink-0">
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Sign Out</span>
        </Button>
      </div>
      <ProfileManager />
    </div>
  );
}
