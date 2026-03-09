import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

const AUTH_TIMEOUT_MS = 8000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(true);

  function finishLoading() {
    if (loadingRef.current) {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  async function ensureProfile(currentUser) {
    if (!currentUser) return;
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', currentUser.id)
      .single();

    if (!data) {
      const meta = currentUser.user_metadata || {};
      await supabase.from('profiles').upsert({
        id: currentUser.id,
        email: currentUser.email,
        full_name: meta.full_name || meta.name || '',
        avatar_url: meta.avatar_url || meta.picture || '',
      });
    }
  }

  async function checkAdmin(userId) {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    setIsAdmin(data?.is_admin === true);
  }

  useEffect(() => {
    // Safety timeout: if auth init takes too long, stop blocking the app
    const timeout = setTimeout(() => {
      if (loadingRef.current) {
        console.warn('Auth initialization timed out, proceeding without session');
        finishLoading();
      }
    }, AUTH_TIMEOUT_MS);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await ensureProfile(currentUser);
          await checkAdmin(currentUser.id);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        finishLoading();
      }
    }).catch((err) => {
      console.error('getSession failed:', err);
      finishLoading();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            await ensureProfile(currentUser);
            await checkAdmin(currentUser.id);
          } else if (!currentUser) {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signInWithGitHub = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signUp, signIn, signInWithGoogle, signInWithGitHub, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
