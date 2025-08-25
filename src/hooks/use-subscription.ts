
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { getProfile } from '@/services/firestore';
import { usePathname } from 'next/navigation';

type SubscriptionStatus = {
  isSubscribed: boolean;
  loading: boolean;
};

export function useSubscription(): SubscriptionStatus {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    isSubscribed: false,
    loading: true,
  });
  const pathname = usePathname();

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({ isSubscribed: false, loading: false });
      return;
    }

    try {
      const profile = await getProfile(user.uid);
      if (profile && profile.subscription) {
        const plan = profile.subscription.plan;
        if (plan === 'free') {
          setSubscription({ isSubscribed: false, loading: false });
          return;
        }

        const subscribedUntil = profile.subscription.subscribedUntil?.toDate();
        const isSubscribed = subscribedUntil && subscribedUntil > new Date();
        setSubscription({ isSubscribed: !!isSubscribed, loading: false });
      } else {
        setSubscription({ isSubscribed: false, loading: false });
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
      setSubscription({ isSubscribed: false, loading: false });
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    checkSubscription();
  }, [user, authLoading, checkSubscription, pathname]);

  return subscription;
}
