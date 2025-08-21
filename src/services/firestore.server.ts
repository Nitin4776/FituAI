'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
} from 'firebase/firestore';


// This is a dedicated server action for saving the profile.
// It's separate from the client-side firestore functions.
export async function saveProfile(profileData: any, uid: string) {
  if (!uid) throw new Error("User UID is required to save profile");
  const userDocRef = doc(db, 'users', uid);
  // We only expect { name: '...' } at sign up
  await setDoc(userDocRef, profileData, { merge: true });
}
