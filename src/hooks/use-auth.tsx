'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onIdTokenChanged, type User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { signOutAction } from '@/app/auth/actions';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getCookie } from 'cookies-next';

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
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const sessionCookie = getCookie('session');
    const isPublicPage = publicPages.includes(pathname);
    const isDashboard = pathname === '/';

    if (user && sessionCookie) {
        // If user is logged in...
        if(isPublicPage) {
            // and on a public page, go to dashboard.
            router.push('/');
        } else if (!isDashboard) {
            // and not on the dashboard, go to the dashboard.
            router.push('/');
        }
    } else if (!user && !sessionCookie && !isPublicPage) {
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

  const isPublicPage = publicPages.includes(pathname);
  
  if (loading || (!user && !isPublicPage)) {
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
