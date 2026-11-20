import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  getRedirectResult,
  onIdTokenChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { syncUserProfile } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  signingIn: boolean;
  authError: string | null;
  authFailureCode: string | null;
  signInModalOpen: boolean;
  openSignInModal: () => void;
  closeSignInModal: () => void;
  clearAuthError: () => void;
  signIn: () => Promise<User | null>;
  signInWithRedirectFlow: () => Promise<void>;
  logout: () => Promise<void>;
  getFreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function formatAuthError(code: string, rawMessage?: string): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  switch (code) {
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser or embedded frame. Use "Continue with Redirect" or open the app in a new tab.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Popup sign-in is restricted in this embedded frame. Use "Continue with Redirect" or open in a new tab.';
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in window was closed before completing sign-in.';
    case 'auth/cancelled-popup-request':
      return 'Previous sign-in request was canceled. Please try once more.';
    case 'auth/unauthorized-domain':
      return `Domain "${host}" is not authorized for Firebase sign-in. Open the hosted preview URL or authorize this domain in Firebase Console.`;
    case 'auth/operation-not-allowed':
      return 'Google Sign-In is not enabled for this Firebase project.';
    case 'auth/network-request-failed':
      return 'Network error communicating with Google authentication servers. Check your connection and try again.';
    default:
      return rawMessage || 'Sign-in did not complete. Try popup retry, redirect sign-in, or opening in a new tab.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authFailureCode, setAuthFailureCode] = useState<string | null>(null);
  const [signInModalOpen, setSignInModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    getRedirectResult(auth)
      .then(async (cred) => {
        if (!active || !cred?.user) return;
        const token = await cred.user.getIdToken();
        if (!active) return;
        setUser(cred.user);
        setIdToken(token);
        setAuthError(null);
        setAuthFailureCode(null);
        setSignInModalOpen(false);
        await syncUserProfile(token).catch(() => {});
      })
      .catch((err) => {
        if (!active) return;
        const code =
          typeof err === 'object' && err && 'code' in err
            ? String((err as { code?: unknown }).code)
            : '';
        if (code && code !== 'auth/no-current-user') {
          const msg =
            err instanceof Error ? err.message : undefined;
          setAuthFailureCode(code);
          setAuthError(formatAuthError(code, msg));
          setSignInModalOpen(true);
        }
      });

    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      if (nextUser) {
        try {
          const token = await nextUser.getIdToken();
          if (!active) return;
          setIdToken(token);
          setAuthError(null);
          setAuthFailureCode(null);
          setSignInModalOpen(false);
          await syncUserProfile(token).catch(() => {});
        } catch {
          if (active) setIdToken(null);
        }
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    setAuthFailureCode(null);
    setSigningIn(true);
    try {
      // Invoke signInWithPopup immediately inside the click event to preserve browser user-activation
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const token = await cred.user.getIdToken();
      setUser(cred.user);
      setIdToken(token);
      setSignInModalOpen(false);
      await syncUserProfile(token).catch(() => {});
      return cred.user;
    } catch (err) {
      const code =
        typeof err === 'object' && err && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      const rawMessage = err instanceof Error ? err.message : undefined;
      setAuthFailureCode(code || 'auth/unknown');
      setAuthError(formatAuthError(code, rawMessage));
      setSignInModalOpen(true);
      return null;
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signInWithRedirectFlow = useCallback(async () => {
    setAuthError(null);
    setAuthFailureCode(null);
    setSigningIn(true);
    try {
      await signInWithRedirect(auth, googleAuthProvider);
    } catch (err) {
      const code =
        typeof err === 'object' && err && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      const rawMessage = err instanceof Error ? err.message : undefined;
      setAuthFailureCode(code || 'auth/unknown');
      setAuthError(formatAuthError(code, rawMessage));
      setSigningIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    setAuthFailureCode(null);
    await signOut(auth);
    setUser(null);
    setIdToken(null);
  }, []);

  const getFreshToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      const token = await auth.currentUser.getIdToken();
      setIdToken(token);
      return token;
    } catch {
      return null;
    }
  }, []);

  const openSignInModal = useCallback(() => setSignInModalOpen(true), []);
  const closeSignInModal = useCallback(() => setSignInModalOpen(false), []);
  const clearAuthError = useCallback(() => {
    setAuthError(null);
    setAuthFailureCode(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        signingIn,
        authError,
        authFailureCode,
        signInModalOpen,
        openSignInModal,
        closeSignInModal,
        clearAuthError,
        signIn,
        signInWithRedirectFlow,
        logout,
        getFreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return ctx;
}
