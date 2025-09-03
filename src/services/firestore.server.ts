
'use server';

import { db } from '@/lib/firebase.server';
import { getAuth as getAdminAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getAuth } from "firebase-admin/auth";
import { app } from '@/lib/firebase';

const clientAuth = getAdminAuth(app);


export async function saveProfile(profileData: any, uid: string) {
  if (!uid) throw new Error('User UID is required to save profile');
  const userDocRef = db().collection('users').doc(uid);
  await userDocRef.set(profileData, { merge: true });
}

export async function getProfile(userId: string) {
  if (!userId) return null;
  const userDocRef = db().collection('users').doc(userId);
  const docSnap = await userDocRef.get();
  return docSnap.exists ? docSnap.data() : null;
}

export async function deleteMeal(userId: string, mealId: string) {
    if (!userId || !mealId) throw new Error("User and meal ID are required.");
    const mealDocRef = db().collection('users').doc(userId).collection('meals').doc(mealId);
    await mealDocRef.delete();
}

export async function signUpWithEmail(credentials: any) {
  const { email, password, name } = credentials;
  try {
    const userRecord = await getAuth().createUser({
      email: email,
      password: password,
      displayName: name,
    });
    
    await saveProfile({
      name: name,
      email: email,
    }, userRecord.uid);
    
    return userRecord;
  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred.';
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-exists':
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

export async function signUpWithPhoneNumber(name: string, otp: string, confirmationResult: any) {
     try {
        const userCredential = await confirmationResult.confirm(otp);
        
        await getAuth().updateUser(userCredential.user.uid, {
            displayName: name
        });

        await saveProfile({ 
            name: name, 
            phoneNumber: userCredential.user.phoneNumber 
        }, userCredential.user.uid);

        return userCredential.user;

     } catch (error: any) {
        let errorMessage = 'An unexpected error occurred during sign-up.';
        if (error.code === 'auth/invalid-verification-code') {
            errorMessage = "Invalid OTP. Please try again.";
        }
        throw new Error(errorMessage);
     }
}
