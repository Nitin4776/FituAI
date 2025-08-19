// IMPORTANT: Replace this with your actual Firebase config
// This is just a placeholder and will not work.
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVton6VpvmTbUCyZHmi5dvVkE7JeB5QDE",
  authDomain: "crickseries.firebaseapp.com",
  projectId: "crickseries",
  storageBucket: "crickseries.appspot.com",
  messagingSenderId: "625037598322",
  appId: "1:625037598322:web:4d9a5e0c112941869b2ceb"
};

// Initialize Firebase
const apps = getApps();
const app = apps.length ? apps[0] : initializeApp(firebaseConfig);

const db = getFirestore(app);

export { app, db };
