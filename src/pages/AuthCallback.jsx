import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CALLBACK_TIMEOUT_MS = 15000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let subscription = null;
    let settled = false;

    function finish(path = '/') {
      if (settled) return;
      settled = true;
      if (subscription) subscription.unsubscribe();
      navigate(path, { replace: true });
    }

    const timeout = setTimeout(() => {
      if (!settled) {
        console.error('Auth callback timed out');
        setError('Sign-in timed out. Please try again.');
        if (subscription) subscription.unsubscribe();
        settled = true;
      }
    }, CALLBACK_TIMEOUT_MS);

    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          finish('/');
          return;
        }

        // Listen for auth state change as fallback
        const { data } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_IN') {
            finish('/');
          }
        });
        subscription = data.subscription;
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Something went wrong during sign-in. Please try again.');
      }
    }

    handleCallback();

    return () => {
      clearTimeout(timeout);
      if (subscription) subscription.unsubscribe();
      settled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-cat-50">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-cat-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
