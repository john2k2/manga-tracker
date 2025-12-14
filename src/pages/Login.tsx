import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';

export default function Login() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    document.title = 'Manga Tracker – Iniciar sesión';

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-xl shadow-fuchsia-200/40 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/85 dark:shadow-fuchsia-500/30">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-amber-400 text-white shadow-sm shadow-fuchsia-400/40">
            <span className="text-lg font-semibold">MT</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Manga Tracker</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Inicia sesión y lleva el control de tus mangas, manhwas y webtoons.
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          theme={theme}
        />
      </div>
    </div>
  );
}
