import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  onIdTokenChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signIn: () => Promise<User | null>;
  logout: () => Promise<void>;
  getFreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          const token = await nextUser.getIdToken();
          setIdToken(token);
        } catch {
          setIdToken(null);
        }
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const token = await cred.user.getIdToken();
      setIdToken(token);
      return cred.user;
    } catch (err) {
      const code =
        typeof err === 'object' && err && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code !== 'auth/popup-closed-by-user') {
        setAuthError('Sign-in did not complete. Please allow popups and try again.');
      }
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
    setIdToken(null);
  }, []);

  const getFreshToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    const token = await auth.currentUser.getIdToken();
    setIdToken(token);
    return token;
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        authError,
        clearAuthError,
        signIn,
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
