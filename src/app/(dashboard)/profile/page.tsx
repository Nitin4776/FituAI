
'use client';

import { useState, useEffect } from 'react';
import { ProfileForm } from '@/components/profile-form';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { getProfile } from '@/services/firestore';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [isNewUser, setIsNewUser] = useState(false);
  
  useEffect(() => {
    async function checkProfile() {
      if (user) {
        const profile = await getProfile(user.uid);
        // A user is considered "new" for this context if their height isn't set.
        if (!profile || !profile.height) {
          setIsNewUser(true);
        } else {
          setIsNewUser(false);
        }
      }
    }
    checkProfile();
  }, [user]);

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
      {isNewUser && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle className="text-primary">Welcome to FitLife AI!</AlertTitle>
          <AlertDescription>
            Please complete your profile details below. This information is essential for us to create your personalized fitness and health plan.
          </AlertDescription>
        </Alert>
      )}
      <ProfileForm />
    </div>
  );
}
