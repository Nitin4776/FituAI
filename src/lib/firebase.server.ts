import { getApps, initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON is not set. Server-side Firebase services will not be available.");
  }
} catch (e) {
  console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
}


const app = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount!),
    })
  : getApp();

const db = getFirestore(app);
const auth = getAuth(app);

function initFirebaseAdminApp() {
    // This function is just to ensure the module is loaded and initialized.
    // The initialization happens when the module is first imported.
}


export { app, db, auth, initFirebaseAdminApp };
