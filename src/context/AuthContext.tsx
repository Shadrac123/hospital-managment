import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  subscribeToAuth,
  signIn as svcSignIn,
  signUp as svcSignUp,
  signOut as svcSignOut,
  sendVerificationEmail as svcSendVerification,
  refreshEmailVerified as svcRefreshEmailVerified,
  sendPasswordReset as svcSendPasswordReset,
  SignUpInput,
  db,
} from '@/services/firebase';
import { AppUser, UserRole } from '@/types/models';

interface AuthContextValue {
  /** True while restoring the persisted session on launch. */
  initializing: boolean;
  user: User | null;
  profile: AppUser | null;
  role: UserRole | null;
  /** Whether the signed-in user's email address has been verified. */
  emailVerified: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  /** Resend the verification email to the current user. */
  resendVerification: () => Promise<void>;
  /** Reload the user and return whether their email is now verified. */
  refreshEmailVerified: () => Promise<boolean>;
  /** Send a password-reset email to the given address. */
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  // During signup, onAuthStateChanged fires BEFORE the users/{uid} doc is
  // written. We stash the just-created profile here so the listener can route on
  // the correct role immediately instead of falling back to "patient".
  const pendingSignupProfile = useRef<AppUser | null>(null);

  useEffect(() => {
    // Tracks the inner Firestore profile subscription so we can tear it down on
    // logout / user switch.
    let unsubscribeProfile: (() => void) | null = null;
    // Delays the "missing doc -> patient" fallback so the signup write can land.
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const clearFallback = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const unsubscribeAuth = subscribeToAuth((fbUser) => {
      setUser(fbUser);
      setEmailVerified(fbUser?.emailVerified ?? false);

      // Clean up any previous profile listener / pending fallback.
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      clearFallback();

      if (!fbUser) {
        pendingSignupProfile.current = null;
        setProfile(null);
        setInitializing(false);
        return;
      }

      // If this auth event is the result of a signup we just performed, route on
      // the known profile right away (the Firestore doc may not exist yet).
      const pending = pendingSignupProfile.current;
      if (pending && pending.uid === fbUser.uid) {
        setProfile(pending);
        setInitializing(false);
      }

      // Real-time profile so role/avatar changes reflect immediately.
      unsubscribeProfile = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => {
          if (snap.exists()) {
            // Authoritative profile from Firestore.
            clearFallback();
            pendingSignupProfile.current = null;
            setProfile(snap.data() as AppUser);
            setInitializing(false);
            return;
          }

          // Doc missing. If we have an optimistic signup profile, keep it.
          if (pendingSignupProfile.current?.uid === fbUser.uid) {
            setProfile(pendingSignupProfile.current);
            setInitializing(false);
            return;
          }

          // Otherwise the doc may simply not have replicated yet (signup write
          // racing the listener). Wait briefly before downgrading to patient so
          // a real admin is never misrouted into the patient app.
          if (!fallbackTimer) {
            fallbackTimer = setTimeout(() => {
              fallbackTimer = null;
              setProfile((prev) =>
                prev && prev.uid === fbUser.uid
                  ? prev
                  : {
                      uid: fbUser.uid,
                      email: fbUser.email ?? '',
                      displayName: fbUser.displayName ?? 'Patient',
                      role: 'patient',
                      photoURL: fbUser.photoURL,
                    },
              );
              setInitializing(false);
            }, 2500);
          }
        },
        () => {
          // Permission/connectivity error — preserve any known profile rather
          // than wiping it (which would bounce the user out of their stack).
          clearFallback();
          if (pendingSignupProfile.current?.uid === fbUser.uid) {
            setProfile(pendingSignupProfile.current);
          }
          setInitializing(false);
        },
      );
    });

    return () => {
      clearFallback();
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await svcSignIn(email, password);
    // Profile is loaded by the auth-state listener above.
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const created = await svcSignUp(input);
    // Seed the optimistic profile so routing uses the correct role immediately,
    // even before the auth listener / Firestore snapshot settle.
    pendingSignupProfile.current = created;
    setProfile(created);
  }, []);

  const signOut = useCallback(async () => {
    await svcSignOut();
  }, []);

  const resendVerification = useCallback(async () => {
    await svcSendVerification();
  }, []);

  const refreshEmailVerified = useCallback(async () => {
    const verified = await svcRefreshEmailVerified();
    setEmailVerified(verified);
    return verified;
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await svcSendPasswordReset(email);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      user,
      profile,
      role: profile?.role ?? null,
      emailVerified,
      signIn,
      signUp,
      signOut,
      resendVerification,
      refreshEmailVerified,
      sendPasswordReset,
    }),
    [
      initializing,
      user,
      profile,
      emailVerified,
      signIn,
      signUp,
      signOut,
      resendVerification,
      refreshEmailVerified,
      sendPasswordReset,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
