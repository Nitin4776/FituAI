import { db } from '@/lib/firebase';
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

// Hardcoded user ID for now. Replace with actual user ID from auth.
const USER_ID = 'test-user';

// --- Profile ---
export async function saveProfile(profileData: any) {
  const userDocRef = doc(db, 'users', USER_ID);
  await setDoc(userDocRef, profileData, { merge: true });
}

export async function getProfile() {
  const userDocRef = doc(db, 'users', USER_ID);
  const docSnap = await getDoc(userDocRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// --- Meals ---
export async function addMeal(mealData: any) {
  const mealsColRef = collection(db, 'users', USER_ID, 'meals');
  await addDoc(mealsColRef, {
    ...mealData,
    createdAt: Timestamp.now(),
  });
}

export async function getMeals() {
  const mealsColRef = collection(db, 'users', USER_ID, 'meals');
  const q = query(mealsColRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteMeal(mealId: string) {
    const mealDocRef = doc(db, 'users', USER_ID, 'meals', mealId);
    await deleteDoc(mealDocRef);
}


// --- Activities ---
export async function addActivity(activityData: any) {
  const activitiesColRef = collection(db, 'users', USER_ID, 'activities');
  await addDoc(activitiesColRef, {
    ...activityData,
    createdAt: Timestamp.now(),
  });
}

export async function getActivities() {
    const activitiesColRef = collection(db, 'users', USER_ID, 'activities');
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
    const activityDocRef = doc(db, 'users', USER_ID, 'activities', activityId);
    await deleteDoc(activityDocRef);
}

// --- Blood Test Analysis ---
export async function saveBloodTestAnalysis(analysisData: any) {
    const analysisColRef = collection(db, 'users', USER_ID, 'bloodTestAnalyses');
    await addDoc(analysisColRef, {
        ...analysisData,
        createdAt: Timestamp.now(),
    });
}

export async function getBloodTestAnalyses() {
    const analysisColRef = collection(db, 'users', USER_ID, 'bloodTestAnalyses');
    const q = query(analysisColRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return [];
}


// --- Fasting ---
export async function saveFastingState(fastingState: any) {
    const fastingDocRef = doc(db, 'users', USER_ID, 'fastingState', 'current');
    await setDoc(fastingDocRef, fastingState, { merge: true });
}

export async function getFastingState() {
    const fastingDocRef = doc(db, 'users', USER_ID, 'fastingState', 'current');
    const docSnap = await getDoc(fastingDocRef);
    return docSnap.exists() ? docSnap.data() : null;
}


// --- Sleep ---
export async function saveSleepLog(sleepData: { quality: string }) {
  const sleepLogRef = doc(db, 'users', USER_ID, 'sleep', new Date().toISOString().split('T')[0]);
  await setDoc(sleepLogRef, {
    ...sleepData,
    createdAt: Timestamp.now(),
  }, { merge: true });
}

export async function getSleepLogForToday() {
  const sleepLogRef = doc(db, 'users', USER_ID, 'sleep', new Date().toISOString().split('T')[0]);
  const docSnap = await getDoc(sleepLogRef);
  return docSnap.exists() ? docSnap.data() : null;
}
