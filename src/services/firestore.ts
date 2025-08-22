
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
  increment,
  updateDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { MealLog } from '@/lib/types';
import { startOfDay } from 'date-fns';


function getCurrentUserId() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
        return user.uid;
    }
    return null;
}

function getTodayDocId() {
    return new Date().toISOString().split('T')[0];
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
export async function addMeal(mealData: Omit<MealLog, 'id' | 'createdAt'>): Promise<string> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    const mealsColRef = collection(db, 'users', userId, 'meals');
    const docRef = await addDoc(mealsColRef, {
        ...mealData,
        createdAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateMeal(mealId: string, mealData: Partial<MealLog>) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    const mealDocRef = doc(db, 'users', userId, 'meals', mealId);
    await updateDoc(mealDocRef, mealData);
}

export async function deleteMeal(mealId: string) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    const mealDocRef = doc(db, 'users', userId, 'meals', mealId);
    await deleteDoc(mealDocRef);
}

export async function getTodaysMeals(): Promise<MealLog[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];
    
    const todayStart = startOfDay(new Date());
    const mealsColRef = collection(db, 'users', userId, 'meals');
    const q = query(mealsColRef, where('createdAt', '>=', Timestamp.fromDate(todayStart)), orderBy('createdAt', 'asc'));

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealLog));
    }
    return [];
}


// --- Activities ---
export async function getTodaysActivities() {
    return [];
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
export async function saveSleepLog(sleepData: { quality: string, userId: string }) {
  const { quality, userId } = sleepData;
  if (!userId) throw new Error("User not authenticated");
  // Save sleep quality directly to the daily summary document.
  const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', getTodayDocId());
  await setDoc(summaryDocRef, {
    sleepQuality: quality,
  }, { merge: true }); // Using merge:true will create the doc if it doesn't exist.
}

export async function getSleepLogForToday() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  // Read sleep quality from the daily summary document.
  const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', getTodayDocId());
  const docSnap = await getDoc(summaryDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Return the sleep data if it exists on the summary
    return data.sleepQuality ? { quality: data.sleepQuality } : null;
  }
  return null;
}


// --- Daily Summary ---
const defaultSummary = {
    consumedCalories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    caloriesBurned: 0,
    dailyGoal: 2000,
    macroGoals: {
        protein: 150,
        carbs: 250,
        fats: 67,
        fiber: 30,
    },
};

export async function getDailySummaryForToday() {
    const userId = getCurrentUserId();
    if (!userId) return defaultSummary;
    const todayId = getTodayDocId();
    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', todayId);
    const docSnap = await getDoc(summaryDocRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        const profile = await getProfile(); // Correctly await the profile
        if (profile && (profile as any).dailyCalories) {
            const newSummary = {
                ...defaultSummary,
                dailyGoal: (profile as any).dailyCalories,
                macroGoals: {
                    protein: (profile as any).protein || 0,
                    carbs: (profile as any).carbs || 0,
                    fats: (profile as any).fats || 0,
                    fiber: (profile as any).fiber || 0,
                },
            };
            await setDoc(summaryDocRef, newSummary);
            return newSummary;
        }
        // If no profile or no goals in profile, create a default summary
        await setDoc(summaryDocRef, defaultSummary);
        return defaultSummary;
    }
}


export async function updateDailySummaryWithNewGoals(goals: { dailyGoal: number, macroGoals: object }) {
    const userId = getCurrentUserId();
    if (!userId) return;
    const todayId = getTodayDocId();
    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', todayId);

    // Ensure document exists before updating, creating if necessary
    const docSnap = await getDoc(summaryDocRef);
    if (!docSnap.exists()) {
        await getDailySummaryForToday(); // This will create it with potentially old goals
    }
    
    // Now set the new goals
    await setDoc(summaryDocRef, {
        dailyGoal: goals.dailyGoal,
        macroGoals: goals.macroGoals,
    }, { merge: true });
}

export async function updateDailySummaryOnMealChange(macros: { calories: number, protein: number, carbs: number, fats: number, fiber: number }) {
    const userId = getCurrentUserId();
    if (!userId) return;
    const todayId = getTodayDocId();
    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', todayId);
    
    // Ensure the document exists before trying to increment
    const docSnap = await getDoc(summaryDocRef);
    if (!docSnap.exists()) {
        await getDailySummaryForToday(); // This will create the doc with default/profile values
    }

    await setDoc(summaryDocRef, {
        consumedCalories: increment(macros.calories),
        protein: increment(macros.protein),
        carbs: increment(macros.carbs),
        fats: increment(macros.fats),
        fiber: increment(macros.fiber),
    }, { merge: true });
}
