
'use server';

import { db } from '@/lib/firebase.server';

// This is a dedicated server action for saving the profile.
// It's separate from the client-side firestore functions.
export async function saveProfile(profileData: any, uid: string) {
  if (!uid) throw new Error('User UID is required to save profile');
  const userDocRef = db().collection('users').doc(uid);
  // We only expect { name: '...' } at sign up
  await userDocRef.set(profileData, { merge: true });
}

export async function getProfile(userId: string) {
  if (!userId) return null;
  const userDocRef = db().collection('users').doc(userId);
  const docSnap = await userDocRef.get();
  return docSnap.exists ? docSnap.data() : null;
}
