
'use client'; 

import { getAuth, signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber as firebaseSignInWithPhoneNumber, type ConfirmationResult, signOut as firebaseSignOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { saveProfile as saveProfileServer } from '@/services/firestore.server';
import { getProfile } from '@/services/firestore';


const auth = getAuth(app);

export function initializeRecaptchaVerifier() {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: any) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            },
            'expired-callback': () => {
                // Response expired. Ask user to solve reCAPTCHA again.
            }
        });
    }
}

async function setSessionCookie(user: any) {
  if (user) {
    const idToken = await user.getIdToken();
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  }
}

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        const existingProfile = await getProfile(user.uid);
        if (!existingProfile) {
             await saveProfileServer({ 
                name: user.displayName, 
                email: user.email, 
                photoURL: user.photoURL 
            }, user.uid);
        }

        await setSessionCookie(user);

    } catch (error: any) {
        if (error.code === 'auth/account-exists-with-different-credential') {
            throw new Error("An account already exists with this email address. Please sign in with your other method.");
        }
        throw new Error(error.message);
    }
}

export async function sendOtp(phoneNumber: string): Promise<void> {
    try {
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await firebaseSignInWithPhoneNumber(auth, `+${phoneNumber}`, appVerifier);
        window.confirmationResult = confirmationResult;
    } catch (error: any) {
        let errorMessage = "Failed to send OTP. Please check the number and try again.";
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.render().then((widgetId) => {
                if (window.grecaptcha) {
                    window.grecaptcha.reset(widgetId);
                }
            });
        }
        throw new Error(errorMessage);
    }
}

export async function signInWithPhoneNumber(otp: string) {
     try {
        if (!window.confirmationResult) {
            throw new Error("Please request an OTP first.");
        }
        const userCredential = await window.confirmationResult.confirm(otp);
        const user = userCredential.user;

        const existingProfile = await getProfile(user.uid);
        if (!existingProfile) {
            await saveProfileServer({ 
                name: 'New User',
                phoneNumber: user.phoneNumber 
            }, user.uid);
        }

        await setSessionCookie(userCredential.user);
     } catch (error: any) {
        let errorMessage = 'An unexpected error occurred during sign-in.';
        if (error.code === 'auth/invalid-verification-code') {
            errorMessage = "Invalid OTP. Please try again.";
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = "No user found with this phone number. Please sign up first.";
        }
        throw new Error(errorMessage);
     }
}

export async function signOut() {
    await firebaseSignOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' });
}

// Extend the Window interface
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
    grecaptcha: any;
  }
}
