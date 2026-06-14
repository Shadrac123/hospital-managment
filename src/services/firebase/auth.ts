import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './app';
import { AppUser, UserRole } from '@/types/models';
import { ADMIN_SIGNUP_CODE } from '@/config/env';

const USERS_COLLECTION = 'users';

/** Thrown when admin signup is attempted with a missing/incorrect admin code. */
export class InvalidAdminCodeError extends Error {
  constructor() {
    super('invalid-admin-code');
    this.name = 'InvalidAdminCodeError';
  }
}

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  /** Required when role === 'admin'. Validated against ADMIN_SIGNUP_CODE. */
  adminCode?: string;
}

/** Subscribe to Firebase auth state. Returns the unsubscribe function. */
export function subscribeToAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

/** Read the role/profile document at `users/{uid}`. Returns null if absent. */
export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return snap.data() as AppUser;
}

export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signUp({
  email,
  password,
  displayName,
  role,
  adminCode,
}: SignUpInput): Promise<AppUser> {
  // Gate admin registration behind the MVP admin code BEFORE creating the user,
  // so a failed code never leaves an orphaned Auth account.
  if (role === 'admin') {
    if (!ADMIN_SIGNUP_CODE || adminCode?.trim() !== ADMIN_SIGNUP_CODE) {
      throw new InvalidAdminCodeError();
    }
  }

  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName });

  // Kick off email verification immediately so the user lands on the
  // "Verify your email" screen with a message already in their inbox.
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // Non-fatal: the Verify screen exposes a "Resend" action as a fallback.
  }

  const profile: AppUser = {
    uid: cred.user.uid,
    email: cred.user.email ?? email.trim(),
    displayName,
    role,
    photoURL: cred.user.photoURL ?? null,
  };

  // Create the role document so subsequent logins route correctly.
  await setDoc(doc(db, USERS_COLLECTION, cred.user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });

  return profile;
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

/** (Re)send a verification email to the currently signed-in user. */
export async function sendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('You are signed out. Please sign in again.');
  }
  await sendEmailVerification(auth.currentUser);
}

/**
 * Refresh the current user from Firebase and report whether their email is now
 * verified. Backs the "I've verified — check again" button.
 */
export async function refreshEmailVerified(): Promise<boolean> {
  if (!auth.currentUser) return false;
  await reload(auth.currentUser);
  return auth.currentUser.emailVerified;
}

/** Send a password-reset email. Used by the Forgot Password flow. */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/** Persist a new avatar URL on both the Firebase Auth profile and the user doc. */
export async function updateUserAvatar(uid: string, photoURL: string): Promise<void> {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { photoURL });
  }
  await setDoc(
    doc(db, USERS_COLLECTION, uid),
    { photoURL, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Maps Firebase auth error codes to human-friendly copy for the UI.
 */
export function authErrorMessage(error: unknown): string {
  if (error instanceof InvalidAdminCodeError) {
    return 'Invalid admin code. Please check and try again.';
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters with letters, numbers, and a symbol.';
    case 'auth/operation-not-allowed':
      return 'Email sign-in is currently unavailable. Please try again later.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
