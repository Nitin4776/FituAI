
import { NextResponse } from 'next/server';
import {
    getDailySuggestion as getDailySuggestionFlow,
    type DailySuggestionInput
} from '@/ai/flows/daily-suggestion';
import { getProfile, getBloodTestAnalyses, getTodaysMeals, getTodaysActivities, getSleepLogForToday } from '@/services/firestore';
import { auth as adminAuth } from '@/lib/firebase.server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

async function getUserId(): Promise<string | null> {
    try {
        const sessionCookie = cookies().get('session')?.value;
        if (!sessionCookie) {
            return null;
        }
        const decodedToken = await adminAuth().verifySessionCookie(sessionCookie, true);
        return decodedToken.uid;
    } catch (error) {
        console.error('Error verifying session cookie:', error);
        return null;
    }
}

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }
        
        const [profile, bloodTests, meals, activities, sleep] = await Promise.all([
            getProfile(userId),
            getBloodTestAnalyses(userId),
            getTodaysMeals(userId),
            getTodaysActivities(userId),
            getSleepLogForToday(userId),
        ]);
        
        if (!profile) {
            return NextResponse.json({ suggestion: "Set up your profile and goals to receive personalized daily suggestions." });
        }

        const flowInput: DailySuggestionInput = {
            profile: profile,
            latestBloodTest: bloodTests?.[0], // Get the most recent one
            todaysMeals: meals,
            todaysActivities: activities,
            todaysSleep: sleep,
        };
        
        const { suggestion } = await getDailySuggestionFlow(flowInput);
        return NextResponse.json({ suggestion });

    } catch (error) {
        console.error('Failed to get AI daily suggestion:', error);
        return NextResponse.json({ error: 'Could not generate a suggestion at this time. Please try again later.' }, { status: 500 });
    }
}
