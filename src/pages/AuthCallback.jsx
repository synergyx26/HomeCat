import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      // Handle PKCE code exchange
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // Check if session exists after exchange
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
        return;
      }

      // Listen for auth state change as fallback
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          navigate('/', { replace: true });
        }
      });

      return () => subscription.unsubscribe();
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-cat-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
