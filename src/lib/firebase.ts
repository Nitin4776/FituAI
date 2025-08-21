// IMPORTANT: Replace this with your actual Firebase config
// This is just a placeholder and will not work.
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC6tNInkw-ucc4ktW-p5NGtJwgGVk3nhxI",
  authDomain: "fitlife-ai-u0s3q.firebaseapp.com",
  projectId: "fitlife-ai-u0s3q",
  storageBucket: "fitlife-ai-u0s3q.appspot.com",
  messagingSenderId: "1073563159152",
  appId: "1:1073563159152:web:d6ac6b3219523bdf6ac2b5"
};

// Initialize Firebase
const apps = getApps();
const app = apps.length ? apps[0] : initializeApp(firebaseConfig);

const db = getFirestore(app);

export { app, db };
