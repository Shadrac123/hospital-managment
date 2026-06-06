/**
 * Centralised access to public runtime config.
 *
 * Expo inlines variables prefixed with `EXPO_PUBLIC_` into the client bundle at
 * build time, so they are read here from `process.env`. These are PUBLIC client
 * keys (Firebase web config) — security is enforced by Firebase Rules, not secrecy.
 */
export const firebaseEnv = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? '',
} as const;

/** Auth needs at minimum apiKey + authDomain + projectId. appId is optional for Auth. */
export const isFirebaseConfigured =
  !!firebaseEnv.apiKey && !!firebaseEnv.authDomain && !!firebaseEnv.projectId;

/**
 * MVP admin signup code. Admin registration must present this exact value.
 *
 * NOTE: This is an MVP convenience only — because it ships in the client bundle
 * it is not a real security boundary. Treat it as a gate to discourage casual
 * admin signups; move admin provisioning server-side (Cloud Function / custom
 * claims) before production.
 */
export const ADMIN_SIGNUP_CODE = process.env.EXPO_PUBLIC_ADMIN_SIGNUP_CODE ?? '';
