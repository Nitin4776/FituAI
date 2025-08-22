'use server';

import { db } from '@/lib/firebase.server';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// This is a dedicated server action for saving the profile.
// It's separate from the client-side firestore functions.
export async function saveProfile(profileData: any, uid: string) {
  if (!uid) throw new Error('User UID is required to save profile');
  const userDocRef = doc(db(), 'users', uid);
  // We only expect { name: '...' } at sign up
  await setDoc(userDocRef, profileData, { merge: true });
}

export async function getProfile(userId: string) {
  if (!userId) return null;
  const userDocRef = doc(db(), 'users', userId);
  const docSnap = await getDoc(userDocRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function deleteMeal(userId: string, mealId: string) {
  if (!userId) throw new Error('User not authenticated');
  const mealDocRef = doc(db(), `users/${userId}/meals/${mealId}`);
  await deleteDoc(mealDocRef);
}

export async function deleteActivity(userId: string, activityId: string) {
  if (!userId) throw new Error('User not authenticated');
  const activityDocRef = doc(db(), `users/${userId}/activities/${activityId}`);
  await deleteDoc(activityDocRef);
}
