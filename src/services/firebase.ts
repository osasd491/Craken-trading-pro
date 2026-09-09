import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

// Embedded production config ensures Vercel and all remote hosts never crash
// even if firebase-applet-config.json is absent in Git or deployment bundles
const DEFAULT_FIREBASE_CONFIG = {
  projectId: "pragmatic-trainer-v8chg",
  appId: "1:763968815800:web:9976004094e5e085f6aa4d",
  apiKey: "AIzaSyCzx0Z0PsoIGj9Go9rsfRP4sdVMWv_K10o",
  authDomain: "pragmatic-trainer-v8chg.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-crakenprotrading-2bdd6d1d-1b06-41f2-b223-c848621011d7",
  storageBucket: "pragmatic-trainer-v8chg.firebasestorage.app",
  messagingSenderId: "763968815800"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      app = initializeApp(DEFAULT_FIREBASE_CONFIG);
    } else {
      app = getApp();
    }
    const dbId = DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;
    db = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
  }
} catch (err) {
  console.warn('Firebase initialization notice:', err);
}

export { app, db, doc, onSnapshot, setDoc, getDoc };
