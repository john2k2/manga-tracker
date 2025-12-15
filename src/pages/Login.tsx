import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';

export default function Login() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    document.title = 'Manga Tracker – Iniciar sesión';

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/85 dark:shadow-black/20"
      >
        <div className="mb-6 text-center">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
          >
            <span className="text-lg font-semibold">MT</span>
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50"
          >
            Manga Tracker
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-1 text-sm text-slate-500 dark:text-slate-400"
          >
            Tu rincón tranquilo para seguir mangas, manhwas y webtoons.
          </motion.p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          theme={theme}
        />
      </motion.div>
    </div>
  );
}
