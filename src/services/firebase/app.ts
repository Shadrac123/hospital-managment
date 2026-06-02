import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
// eslint-disable-next-line import/no-unresolved
import {
  Auth,
  getAuth,
  initializeAuth,
  // `getReactNativePersistence` exists in the React Native build of firebase/auth
  // but is sometimes missing from the bundled TypeScript types. We import it and
  // fall back gracefully below.
  // @ts-expect-error -- not always present in the type declarations
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseEnv, isFirebaseConfigured } from '@/config/env';

/**
 * Firebase bootstrap for the Firebase JS SDK (works in Expo Go).
 *
 * Auth uses AsyncStorage persistence so sessions survive app reloads. Firestore
 * and Storage are initialised here and exported for use across the app
 * (role docs, bookings, doctors, and patient avatar uploads).
 */

if (!isFirebaseConfigured) {
  // Surface a clear message instead of an opaque Firebase error on first call.
  console.warn(
    '[firebase] Missing config. Copy .env.example to .env and fill in the web app values.',
  );
}

const firebaseConfig = {
  apiKey: firebaseEnv.apiKey,
  authDomain: firebaseEnv.authDomain,
  projectId: firebaseEnv.projectId,
  storageBucket: firebaseEnv.storageBucket,
  messagingSenderId: firebaseEnv.messagingSenderId,
  appId: firebaseEnv.appId,
};

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

function createAuth(app: FirebaseApp): Auth {
  // `initializeAuth` must only run once per app. On Fast Refresh the app may
  // already be initialised, so fall back to `getAuth`.
  try {
    return initializeAuth(app, {
      persistence:
        typeof getReactNativePersistence === 'function'
          ? getReactNativePersistence(AsyncStorage)
          : undefined,
    });
  } catch {
    return getAuth(app);
  }
}

export const auth: Auth = createAuth(firebaseApp);

export const db: Firestore = getFirestore(firebaseApp);

export const storage: FirebaseStorage = getStorage(firebaseApp);
