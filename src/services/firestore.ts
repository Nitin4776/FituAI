
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
  writeBatch,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { MealLog, ActivityLog, SleepLog, WaterLog } from '@/lib/types';
import { startOfDay, subDays } from 'date-fns';


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

export async function getProfile(userId?: string) {
  const uid = userId || getCurrentUserId();
  if (!uid) return null;
  const userDocRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userDocRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// --- Meals ---
export async function addMeal(mealData: Omit<MealLog, 'id' | 'createdAt' | 'mealType'> & { mealType: string }) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const batch = writeBatch(db);

    const mealsColRef = collection(db, 'users', userId, 'meals');
    const newMealRef = doc(mealsColRef); // Create a reference with a new ID
    batch.set(newMealRef, {
        ...mealData,
        createdAt: Timestamp.now(),
    });

    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', getTodayDocId());
    batch.set(summaryDocRef, {
        consumedCalories: increment(mealData.calories),
        protein: increment(mealData.protein),
        carbs: increment(mealData.carbs),
        fats: increment(mealData.fats),
        fiber: increment(mealData.fiber),
    }, { merge: true });
    
    await batch.commit();
}

export async function updateMeal(mealData: MealLog) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const batch = writeBatch(db);

    const mealDocRef = doc(db, 'users', userId, 'meals', mealData.id);
    const originalMealSnap = await getDoc(mealDocRef);
    if (!originalMealSnap.exists()) {
        throw new Error("Original meal not found for update.");
    }
    const originalMealData = originalMealSnap.data() as MealLog;

    // Update the meal document itself
    batch.update(mealDocRef, { ...mealData });

    // Calculate the difference in macros to update the summary
    const macroDiff = {
        calories: mealData.calories - originalMealData.calories,
        protein: mealData.protein - originalMealData.protein,
        carbs: mealData.carbs - originalMealData.carbs,
        fats: mealData.fats - originalMealData.fats,
        fiber: mealData.fiber - originalMealData.fiber,
    };
    
    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', getTodayDocId());
    batch.set(summaryDocRef, {
        consumedCalories: increment(macroDiff.calories),
        protein: increment(macroDiff.protein),
        carbs: increment(macroDiff.carbs),
        fats: increment(macroDiff.fats),
        fiber: increment(macroDiff.fiber),
    }, { merge: true });

    await batch.commit();
}

export async function deleteMeal(meal: MealLog) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const batch = writeBatch(db);

    const mealDocRef = doc(db, 'users', userId, 'meals', meal.id);
    batch.delete(mealDocRef);

    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', getTodayDocId());
    batch.set(summaryDocRef, {
        consumedCalories: increment(-meal.calories),
        protein: increment(-meal.protein),
        carbs: increment(-meal.carbs),
        fats: increment(-meal.fats),
        fiber: increment(-meal.fiber),
    }, { merge: true });

    await batch.commit();
}

export async function getTodaysMeals(userId?: string): Promise<MealLog[]> {
    const uid = userId || getCurrentUserId();
    if (!uid) return [];
    
    const todayStart = startOfDay(new Date());
    const mealsColRef = collection(db, 'users', uid, 'meals');
    const q = query(mealsColRef, where('createdAt', '>=', Timestamp.fromDate(todayStart)), orderBy('createdAt', 'asc'));

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealLog));
    }
    return [];
}


// --- Activities ---
export async function addActivity(activityData: Omit<ActivityLog, 'id' | 'createdAt'>) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const batch = writeBatch(db);

    const activitiesColRef = collection(db, 'users', userId, 'activities');
    const newActivityRef = doc(activitiesColRef);
    batch.set(newActivityRef, {
        ...activityData,
        createdAt: Timestamp.now(),
    });

    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', getTodayDocId());
    batch.set(summaryDocRef, {
        caloriesBurned: increment(activityData.caloriesBurned),
    }, { merge: true });

    await batch.commit();
}

export async function updateActivity(activityData: ActivityLog) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    
    const batch = writeBatch(db);

    const activityDocRef = doc(db, 'users', userId, 'activities', activityData.id);
    const originalActivitySnap = await getDoc(activityDocRef);
    if (!originalActivitySnap.exists()) {
        throw new Error("Original activity not found for update.");
    }
    const originalActivityData = originalActivitySnap.data() as ActivityLog;

    batch.update(activityDocRef, { ...activityData });

    const calorieDiff = activityData.caloriesBurned - originalActivityData.caloriesBurned;

    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', getTodayDocId());
    batch.set(summaryDocRef, {
        caloriesBurned: increment(calorieDiff),
    }, { merge: true });

    await batch.commit();
}

export async function deleteActivity(activity: ActivityLog) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const batch = writeBatch(db);

    const activityDocRef = doc(db, 'users', userId, 'activities', activity.id);
    batch.delete(activityDocRef);

    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', getTodayDocId());
    batch.set(summaryDocRef, {
        caloriesBurned: increment(-activity.caloriesBurned),
    }, { merge: true });
    
    await batch.commit();
}

export async function getTodaysActivities(userId?: string): Promise<ActivityLog[]> {
    const uid = userId || getCurrentUserId();
    if (!uid) return [];
    
    const todayStart = startOfDay(new Date());
    const activitiesColRef = collection(db, 'users', uid, 'activities');
    const q = query(activitiesColRef, where('createdAt', '>=', Timestamp.fromDate(todayStart)), orderBy('createdAt', 'asc'));

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
    }
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

export async function getBloodTestAnalyses(userId?: string) {
    const uid = userId || getCurrentUserId();
    if (!uid) return [];
    const analysisColRef = collection(db, 'users', uid, 'bloodTestAnalyses');
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
export async function saveSleepLog(sleepData: { quality: SleepLog['quality'] }) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const batch = writeBatch(db);
    const todayStart = startOfDay(new Date());

    // Query for existing sleep log for today
    const sleepColRef = collection(db, 'users', userId, 'sleepLogs');
    const q = query(sleepColRef, where('createdAt', '>=', Timestamp.fromDate(todayStart)), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        // No log today, create a new one
        const newSleepLogRef = doc(sleepColRef);
        batch.set(newSleepLogRef, { ...sleepData, createdAt: Timestamp.now() });
    } else {
        // Log exists, update it
        const existingLogRef = querySnapshot.docs[0].ref;
        batch.update(existingLogRef, { ...sleepData });
    }
    
    // Update the daily summary
    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', getTodayDocId());
    batch.set(summaryDocRef, {
        sleepQuality: sleepData.quality,
    }, { merge: true });

    await batch.commit();
}


export async function getSleepLogForToday(userId?: string): Promise<SleepLog | null> {
  const uid = userId || getCurrentUserId();
  if (!uid) return null;
  
  const todayStart = startOfDay(new Date());
  const sleepColRef = collection(db, 'users', uid, 'sleepLogs');
  const q = query(sleepColRef, where('createdAt', '>=', Timestamp.fromDate(todayStart)), limit(1));

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as SleepLog;
  }
  return null;
}

// --- Water Intake ---
export async function saveWaterIntake(waterData: { glasses: number }) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const todayId = getTodayDocId();
    const waterLogDocRef = doc(db, 'users', userId, 'waterLogs', todayId);
    
    // Using set with merge to create or update the document for the day
    await setDoc(waterLogDocRef, {
        ...waterData,
        createdAt: Timestamp.now(),
    }, { merge: true });
}

export async function getTodaysWaterIntake(userId?: string): Promise<WaterLog | null> {
    const uid = userId || getCurrentUserId();
    if (!uid) return null;
    
    const todayId = getTodayDocId();
    const waterLogDocRef = doc(db, 'users', uid, 'waterLogs', todayId);
    const docSnap = await getDoc(waterLogDocRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as WaterLog;
    }
    return null;
}

// --- Workout Plan ---
export async function saveWorkoutPlan(planData: any) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    const planColRef = collection(db, 'users', userId, 'workoutPlans');
    await addDoc(planColRef, {
        ...planData,
        createdAt: Timestamp.now(),
    });
}

export async function getLatestWorkoutPlan() {
    const userId = getCurrentUserId();
    if (!userId) return null;

    const sevenDaysAgo = subDays(new Date(), 7);
    const planColRef = collection(db, 'users', userId, 'workoutPlans');
    const q = query(
        planColRef,
        orderBy('createdAt', 'desc'),
        where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
        limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
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
    waterGlasses: 0,
    waterGoal: 8,
};

export async function getDailySummaryForToday() {
    const userId = getCurrentUserId();
    if (!userId) return defaultSummary;
    const todayId = getTodayDocId();
    const summaryDocRef = doc(db, 'users', userId, 'dailySummaries', todayId);
    
    const [summarySnap, waterSnap, profile] = await Promise.all([
        getDoc(summaryDocRef),
        getTodaysWaterIntake(userId),
        getProfile(userId),
    ]);

    let summaryData;

    if (summarySnap.exists()) {
        summaryData = summarySnap.data();
    } else {
        // Create a new summary
        const newSummary = { ...defaultSummary };
        if (profile && (profile as any).dailyCalories) {
            newSummary.dailyGoal = (profile as any).dailyCalories;
            newSummary.macroGoals = {
                protein: (profile as any).protein || 0,
                carbs: (profile as any).carbs || 0,
                fats: (profile as any).fats || 0,
                fiber: (profile as any).fiber || 0,
            };
        }
        await setDoc(summaryDocRef, newSummary);
        summaryData = newSummary;
    }

    // Add water data to the summary
    summaryData.waterGlasses = waterSnap?.glasses || 0;
    
    // Calculate water goal
    const GLASS_SIZE_ML = 250;
    if (profile && (profile as any).weight) {
        const recommendedIntakeMl = (profile as any).weight * 33;
        summaryData.waterGoal = Math.round(recommendedIntakeMl / GLASS_SIZE_ML);
    } else {
        summaryData.waterGoal = 8; // Default if no weight
    }

    return summaryData;
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
