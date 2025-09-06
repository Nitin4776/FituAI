
// IMPORTANT: Replace this with your actual Firebase config
// This is just a placeholder and will not work.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "fitlife-ai-u0s3q",
  "appId": "1:1073563159152:web:d6ac6b3219523bdf6ac2b5",
  "storageBucket": "fitlife-ai-u0s3q.appspot.com",
  "apiKey": "AIzaSyC6tNInkw-ucc4ktW-p5NGtJwgGVk3nhxI",
  "authDomain": "fitlife-ai-u0s3q.firebaseapp.com",
  "messagingSenderId": "1073563159152"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);


export { app, db, auth };
