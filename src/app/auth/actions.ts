
'use client'; 

import { z } from 'zod';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
  type ConfirmationResult,
  linkWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getProfile, saveProfile } from '@/services/firestore';


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

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
  password: z.string().min(6),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        const existingProfile = await getProfile(user.uid);
        if (!existingProfile) {
             await saveProfile({ 
                name: user.displayName, 
                email: user.email, 
                photoURL: user.photoURL 
            }, user.uid);
        }

        await setSessionCookie(user);

    } catch (error: any) {
        // Handle cases where the email is already linked to another account (e.g. phone)
        if (error.code === 'auth/account-exists-with-different-credential') {
            const pendingCred = error.credential;
            // For now, we'll just inform the user. A more advanced flow could link them.
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
        // Reset the verifier to allow retries
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

export async function signUpWithPhoneNumber(name: string, otp: string) {
     try {
        if (!window.confirmationResult) {
            throw new Error("Please request an OTP first.");
        }
        const userCredential = await window.confirmationResult.confirm(otp);
        
        await updateProfile(userCredential.user, {
            displayName: name
        });
        await saveProfile({ 
            name: name, 
            phoneNumber: userCredential.user.phoneNumber 
        }, userCredential.user.uid);
        await setSessionCookie(userCredential.user);

     } catch (error: any) {
        let errorMessage = 'An unexpected error occurred during sign-up.';
        if (error.code === 'auth/invalid-verification-code') {
            errorMessage = "Invalid OTP. Please try again.";
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
            await saveProfile({ 
                name: 'New User', // Placeholder name
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


export async function signUpAction(credentials: z.infer<typeof signUpSchema>) {
  try {
    const validatedCredentials = signUpSchema.parse(credentials);
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      validatedCredentials.email,
      validatedCredentials.password
    );
    
    await updateProfile(userCredential.user, {
      displayName: validatedCredentials.name
    });

    await saveProfile({ 
        name: validatedCredentials.name,
        email: validatedCredentials.email,
     }, userCredential.user.uid);
    await setSessionCookie(userCredential.user);


  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred.';
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email address is already in use. Please sign in or use a different email.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'The email address is not valid.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled.';
                break;
            case 'auth/weak-password':
                errorMessage = 'The password is too weak.';
                break;
            default:
                errorMessage = error.message;
        }
    }
    throw new Error(errorMessage);
  }
}

export async function signInAction(credentials: z.infer<typeof signInSchema>) {
    try {
        const validatedCredentials = signInSchema.parse(credentials);
        const userCredential = await signInWithEmailAndPassword(
            auth,
            validatedCredentials.email,
            validatedCredentials.password
        );
         await setSessionCookie(userCredential.user);
    } catch (error: any)
{
        let errorMessage = 'An unexpected error occurred.';
        if (error.code) {
            switch (error.code) {
                case 'auth/invalid-credential':
                     errorMessage = 'Invalid email or password. Please try again.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This user account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No user found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                default:
                    errorMessage = 'Invalid credentials. Please try again.';
            }
        }
        throw new Error(errorMessage);
    }
}

export async function signOutAction() {
    await signOut(auth);
    // Request the browser to clear the session cookie
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
