import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loginWithEmail, registerWithEmail } from '../lib/authApi';
import { clearStoredUser, getStoredUser, setStoredUser } from '../lib/userStorage';
import { isSupabaseConfigured } from '../lib/supabase';
import type { AppUser } from '../lib/types';

interface AuthContextValue {
  user: AppUser | null;
  displayName: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');
    const loggedIn = await loginWithEmail(email, password);
    await setStoredUser(loggedIn);
    setUser(loggedIn);
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');
    const registered = await registerWithEmail(email, password, username);
    await setStoredUser(registered);
    setUser(registered);
  }, []);

  const signOut = useCallback(async () => {
    await clearStoredUser();
    setUser(null);
  }, []);

  const displayName = user?.username ?? 'friend';

  const value = useMemo(
    () => ({
      user,
      displayName,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [user, displayName, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
