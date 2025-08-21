'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onIdTokenChanged, type User, getIdToken } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { signOutAction } from '@/app/auth/actions';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { setCookie, deleteCookie } from 'cookies-next';

const auth = getAuth(app);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPages = ['/signin', '/signup'];

async function setSessionCookie(user: User | null) {
  if (user) {
    const idToken = await getIdToken(user);
    setCookie('session', idToken, {
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, 
    });
  } else {
    deleteCookie('session');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      await setSessionCookie(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublic = publicPages.includes(pathname);

    if (user && isPublic) {
      router.push('/');
    } else if (!user && !isPublic) {
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const isPublic = publicPages.includes(pathname);
  if (!loading && !user && !isPublic) {
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
