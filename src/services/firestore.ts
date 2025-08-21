import { db, auth as firebaseAuth } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  limit,
  deleteDoc,
  where,
  startOfDay,
  endOfDay,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


function getCurrentUserId() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
        return user.uid;
    }
    return null;
}


// --- Profile ---
export async function saveProfile(profileData: any, uid?: string) {
  const userId = uid || getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const userDocRef = doc(db, 'users', userId);
  await setDoc(userDocRef, profileData, { merge: true });
}

export async function getProfile() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const userDocRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userDocRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// --- Meals ---
export async function addMeal(mealData: any) {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const mealsColRef = collection(db, 'users', userId, 'meals');
  await addDoc(mealsColRef, {
    ...mealData,
    createdAt: Timestamp.now(),
  });
}

export async function getMeals() {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const mealsColRef = collection(db, 'users', userId, 'meals');
  const q = query(mealsColRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteMeal(mealId: string) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    const mealDocRef = doc(db, 'users', userId, 'meals', mealId);
    await deleteDoc(mealDocRef);
}


// --- Activities ---
export async function addActivity(activityData: any) {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const activitiesColRef = collection(db, 'users', userId, 'activities');
  await addDoc(activitiesColRef, {
    ...activityData,
    createdAt: Timestamp.now(),
  });
}

export async function getActivities() {
    const userId = getCurrentUserId();
    if (!userId) return [];
    const activitiesColRef = collection(db, 'users', userId, 'activities');
    const q = query(activitiesColRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
        };
    });
}

export async function deleteActivity(activityId: string) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    const activityDocRef = doc(db, 'users', userId, 'activities', activityId);
    await deleteDoc(activityDocRef);
}

// --- Blood Test Analysis ---
export async function saveBloodTestAnalysis(analysisData: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    const analysisColRef = collection(db, 'users', userId, 'bloodTestAnalyses');
    await addDoc(analysisColRef, {
        ...analysisData,
        createdAt: Timestamp.now(),
    });
}

export async function getBloodTestAnalyses() {
    const userId = getCurrentUserId();
    if (!userId) return [];
    const analysisColRef = collection(db, 'users', userId, 'bloodTestAnalyses');
    const q = query(analysisColRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return [];
}


// --- Fasting ---
export async function saveFastingState(fastingState: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    const fastingDocRef = doc(db, 'users', userId, 'fastingState', 'current');
    await setDoc(fastingDocRef, fastingState, { merge: true });
}

export async function getFastingState() {
    const userId = getCurrentUserId();
    if (!userId) return null;
    const fastingDocRef = doc(db, 'users', userId, 'fastingState', 'current');
    const docSnap = await getDoc(fastingDocRef);
    return docSnap.exists() ? docSnap.data() : null;
}


// --- Sleep ---
export async function saveSleepLog(sleepData: { quality: string }) {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const sleepLogRef = doc(db, 'users', userId, 'sleep', new Date().toISOString().split('T')[0]);
  await setDoc(sleepLogRef, {
    ...sleepData,
    createdAt: Timestamp.now(),
  }, { merge: true });
}

export async function getSleepLogForToday() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const sleepLogRef = doc(db, 'users', userId, 'sleep', new Date().toISOString().split('T')[0]);
  const docSnap = await getDoc(sleepLogRef);
  return docSnap.exists() ? docSnap.data() : null;
}
