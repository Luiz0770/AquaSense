import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@/types';
import * as auth from '@/services/authService';

interface AuthValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (input: auth.SignUpInput) => Promise<User>;
  signInDemoAgent: () => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    auth
      .restoreSession()
      .then((u) => alive && setUser(u))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await auth.signIn(email, password);
    setUser(u);
    return u;
  }, []);

  const signUp = useCallback(async (input: auth.SignUpInput) => {
    const u = await auth.signUp(input);
    setUser(u);
    return u;
  }, []);

  const signInDemoAgent = useCallback(
    () => signIn(auth.DEMO_AGENT.email, auth.DEMO_AGENT.password),
    [signIn],
  );

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signInDemoAgent, signOut }),
    [user, loading, signIn, signUp, signInDemoAgent, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
