import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Custom firestore database ID from config
const dbId = firebaseConfigData.firestoreDatabaseId || '(default)';
export const db: Firestore = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);

export { doc, onSnapshot, setDoc, getDoc };
