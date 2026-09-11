import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

export type FirebaseServices = { app: FirebaseApp; auth: Auth; firestore: Firestore; ownerUid: string };

let services: FirebaseServices | null = null;
let persistencePromise: Promise<void> | null = null;

function required(value: string | undefined, name: string): string {
  if (!value || value.startsWith('your_')) throw new Error(`Missing ${name}. Add it to .env.local and restart TVBeli.`);
  return value;
}

export function getFirebaseServices(): FirebaseServices {
  if (services) return services;
  const config = {
    apiKey: required(process.env.EXPO_PUBLIC_FIREBASE_API_KEY, 'EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: required(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: required(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: required(process.env.EXPO_PUBLIC_FIREBASE_APP_ID, 'EXPO_PUBLIC_FIREBASE_APP_ID'),
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  let firestore: Firestore;
  try {
    firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    firestore = getFirestore(app);
  }
  services = { app, auth, firestore, ownerUid: required(process.env.EXPO_PUBLIC_FIREBASE_OWNER_UID, 'EXPO_PUBLIC_FIREBASE_OWNER_UID') };
  persistencePromise ??= setPersistence(auth, browserLocalPersistence);
  return services;
}

export async function prepareFirebaseAuth() {
  getFirebaseServices();
  await persistencePromise;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
