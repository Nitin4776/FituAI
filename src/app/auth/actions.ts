'use client'; 

import { z } from 'zod';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signOut
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { saveProfile as saveProfileServerAction } from '@/services/firestore.server';


const auth = getAuth(app);

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
  password: z.string().min(6),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});


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

    await saveProfileServerAction({ name: validatedCredentials.name }, userCredential.user.uid);

  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred.';
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email address is already in use by another account.';
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
        await signInWithEmailAndPassword(
            auth,
            validatedCredentials.email,
            validatedCredentials.password
        );
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
}
