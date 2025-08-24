
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onIdTokenChanged, type User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { signOutAction } from '@/app/auth/actions';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getProfile } from '@/services/firestore';

const auth = getAuth(app);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPages = ['/signin', '/signup'];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = publicPages.includes(pathname);
    
    if (user) {
        // User is logged in
        if (isPublicPage) {
             // If user is logged in and on a public page, go to dashboard.
             router.push('/');
        } else {
            // Check if profile is complete. If not, redirect to profile page.
            getProfile(user.uid).then(profile => {
                // A profile is considered incomplete if the user hasn't set their height yet.
                const isProfileComplete = profile && profile.height;
                if (!isProfileComplete && pathname !== '/profile') {
                    router.push('/profile');
                }
            });
        }
    } else if (!user && !isPublicPage) {
        // If user is not logged in and not on a public page, go to signin.
        router.push('/signin');
    }
  }, [user, loading, pathname, router]);

  const signOut = async () => {
    try {
      await signOutAction();
      router.push('/signin');
    } catch (error) {
      console.error('Sign out failed', error);
    }
  };

  const isAuthPage = publicPages.includes(pathname);
  
  if (loading || (!user && !isAuthPage)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
