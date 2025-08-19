// IMPORTANT: Replace this with your actual Firebase config
// This is just a placeholder and will not work.
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const apps = getApps();
const app = apps.length ? apps[0] : initializeApp(firebaseConfig);

const db = getFirestore(app);

export { app, db };
