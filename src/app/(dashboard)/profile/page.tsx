
'use client';

import { useState, useEffect } from 'react';
import { ProfileForm } from '@/components/profile-form';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Mail, Phone, Gem, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { getProfile } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type Profile = {
    name: string;
    email?: string;
    phoneNumber?: string;
    height?: number;
    subscription?: {
        plan: string;
        subscribedAt: { seconds: number, nanoseconds: number };
        subscribedUntil: { seconds: number, nanoseconds: number };
    }
}

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function checkProfile() {
      if (user) {
        const profile = await getProfile(user.uid);
        setProfileData(profile as Profile);
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
          setProfileData(profile as Profile);
      }
  }

  const isSubscribed = profileData?.subscription?.subscribedUntil && new Date(profileData.subscription.subscribedUntil.seconds * 1000) > new Date();


  return (
    <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                { authLoading || !user ? (
                   <Skeleton className="h-9 w-48 md:w-72 rounded-md" />
                ) : (
                  <h1 className="font-headline text-3xl md:text-4xl text-primary">
                      Hi, {profileData?.name || user.displayName}
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
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Account Information</CardTitle>
            </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex items-center gap-4 text-sm">
                    <Mail className="text-muted-foreground" />
                    <span>{profileData?.email || user?.email || 'No email provided'}</span>
                </div>
                    <div className="flex items-center gap-4 text-sm">
                    <Phone className="text-muted-foreground" />
                    <span>{profileData?.phoneNumber || user?.phoneNumber || 'No phone number provided'}</span>
                </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                        <Gem className="text-muted-foreground" />
                        <h4 className='font-medium'>Subscription</h4>
                    </div>
                     {profileData?.subscription?.plan && profileData.subscription.plan !== 'free' ? (
                        <div className="pl-8 space-y-3">
                            <div className='flex items-center gap-2'>
                                <span className="font-semibold capitalize">{profileData.subscription.plan} Plan</span>
                                {isSubscribed ? (
                                    <Badge variant="default" className='bg-green-500 hover:bg-green-600'><CheckCircle className="h-3 w-3 mr-1"/>Active</Badge>
                                ) : (
                                    <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1"/>Inactive</Badge>
                                )}
                            </div>
                            {profileData.subscription.subscribedAt && (
                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Subscribed on: {format(new Date(profileData.subscription.subscribedAt.seconds * 1000), 'PPP')}
                                </p>
                            )}
                             {profileData.subscription.subscribedUntil && (
                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                     <Calendar className="h-4 w-4" />
                                    {isSubscribed ? 'Valid until:' : 'Expired on:'} {format(new Date(profileData.subscription.subscribedUntil.seconds * 1000), 'PPP')}
                                </p>
                            )}
                        </div>
                    ) : (
                         <div className="pl-8">
                             <p className="text-sm text-muted-foreground">No active subscription.</p>
                             <Button asChild variant="link" className="px-0 h-auto">
                                <Link href="/subscribe">Upgrade to Premium</Link>
                             </Button>
                         </div>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
