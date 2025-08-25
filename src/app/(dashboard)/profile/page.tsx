
'use client';

import { useState, useEffect } from 'react';
import { ProfileForm } from '@/components/profile-form';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Mail, Phone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { getProfile } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function checkProfile() {
      if (user) {
        const profile = await getProfile(user.uid);
        setProfileData(profile);
        // A user is considered "new" for this context if their height isn't set.
        if (!profile || !profile.height) {
          setIsNewUser(true);
        } else {
          setIsNewUser(false);
        }
      }
      setIsLoading(false);
    }
    if (!authLoading) {
       checkProfile();
    }
  }, [user, authLoading]);

  const onProfileUpdated = async () => {
      setIsNewUser(false);
      // Re-fetch profile data after save
      if(user) {
          const profile = await getProfile(user.uid);
          setProfileData(profile);
      }
  }

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                { authLoading || !user ? (
                   <Skeleton className="h-9 w-48 md:w-72 rounded-md" />
                ) : (
                  <h1 className="font-headline text-3xl md:text-4xl text-primary">
                      Hi, {user.displayName}
                  </h1>
                )}
                <p className="mt-2 text-lg text-muted-foreground">
                    Update your personal details to calculate your body metrics.
                </p>
            </div>
             <Button variant="ghost" onClick={signOut} className="flex-shrink-0">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden md:inline">Sign Out</span>
            </Button>
        </div>
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        <>
            { isNewUser && (
                <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle className="text-primary">Welcome to FitLife AI!</AlertTitle>
                <AlertDescription>
                    Please complete your profile details below. This information is essential for us to create your personalized fitness and health plan. You can use our AI to scan your body or enter the details manually.
                </AlertDescription>
                </Alert>
            )}
            { profileData && !profileData.email && (
                 <Alert variant="destructive">
                    <Mail className="h-4 w-4" />
                    <AlertTitle>Complete Your Profile</AlertTitle>
                    <AlertDescription>
                        Please add your email address to your profile for account recovery and communication.
                    </AlertDescription>
                </Alert>
            )}
             { profileData && !profileData.phoneNumber && (
                 <Alert variant="destructive">
                    <Phone className="h-4 w-4" />
                    <AlertTitle>Complete Your Profile</AlertTitle>
                    <AlertDescription>
                        Please add your phone number to your profile to enable all features.
                    </AlertDescription>
                </Alert>
            )}
        </>
      )}
      <ProfileForm onProfileSave={onProfileUpdated} />
    </div>
  );
}
