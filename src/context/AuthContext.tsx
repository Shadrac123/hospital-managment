import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);

  useEffect(() => {
    // Tracks the inner Firestore profile subscription so we can tear it down on
    // logout / user switch.
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = subscribeToAuth((fbUser) => {
      setUser(fbUser);

      // Clean up any previous profile listener.
      unsubscribeProfile?.();
      unsubscribeProfile = null;

      if (!fbUser) {
        setProfile(null);
        setInitializing(false);
        return;
      }

      // Real-time profile so avatar/role changes reflect immediately.
      unsubscribeProfile = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as AppUser);
          } else {
            // Fall back to a patient profile if the role doc is missing, so a
            // signed-in user is never stranded without a role.
            setProfile({
              uid: fbUser.uid,
              email: fbUser.email ?? '',
              displayName: fbUser.displayName ?? 'Patient',
              role: 'patient',
              photoURL: fbUser.photoURL,
            });
          }
          setInitializing(false);
        },
        () => {
          setProfile(null);
          setInitializing(false);
        },
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await svcSignIn(email, password);
    // Profile is loaded by the auth-state listener above.
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    await svcSignUp(input);
  }, []);

  const signOut = useCallback(async () => {
    await svcSignOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      user,
      profile,
      role: profile?.role ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [initializing, user, profile, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
