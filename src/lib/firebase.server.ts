import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const runtime = 'nodejs';

let serviceAccount: any;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON is not set. Server-side Firebase services will not be available.");
  }
} catch (e) {
  console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
}

export function initFirebaseAdminApp() {
  if (getApps().length === 0 && serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
}

// These are now getters to ensure the app is initialized before they are used.
export const db = () => {
    initFirebaseAdminApp();
    return getFirestore();
}

export const auth = () => {
    initFirebaseAdminApp();
    return getAuth();
}
