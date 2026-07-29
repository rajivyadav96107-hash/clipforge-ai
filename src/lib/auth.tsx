import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Plan, Profile } from '../types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  plan: Plan;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_PROFILE: Profile = {
  id: '',
  email: null,
  plan: 'free',
  clips_used_this_month: 0,
  month_reset_at: new Date().toISOString(),
  stripe_customer_id: null,
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;
  const plan: Plan = profile?.plan ?? 'free';

  async function refreshProfile() {
    if (!user) {
      setProfile(null);
      return;
    }
    // The handle_new_user trigger creates the profile on signup, but a
    // race with the auth state callback can mean it isn't there yet on
    // first read — retry once after a short delay.
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) return null;
      return data as Profile | null;
    };

    let data = await fetchProfile();
    if (!data) {
      await new Promise((r) => setTimeout(r, 400));
      data = await fetchProfile();
    }
    setProfile(data ?? { ...DEFAULT_PROFILE, id: user.id, email: user.email ?? null });
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        refreshProfile().finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      (async () => {
        if (newSession?.user) {
          await refreshProfile();
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ session, user, profile, loading, plan, refreshProfile, signOut }),
    [session, user, profile, loading, plan]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
