import { BookOpen, LogOut, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { PushNotificationManager } from './PushNotificationManager';

interface HeaderProps {
  onLogout: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-950/70"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-amber-400 text-white shadow-sm shadow-fuchsia-400/40"
          >
            <BookOpen size={18} />
          </motion.div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
              Manga Tracker
            </h1>
            <div className="hidden items-center gap-2 sm:flex">
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 lg:block">
                Tu rincón tranquilo de lectura.
              </p>
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="hidden rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-medium tracking-wider text-teal-700 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300 sm:inline-flex"
              >
                Chill mode
              </motion.span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PushNotificationManager />
          <button
            onClick={toggleTheme}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:inline-flex"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={onLogout}
            className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 px-2 text-xs font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-red-400/60 dark:hover:bg-red-950/40 dark:hover:text-red-300 sm:px-3"
            title="Cerrar sesión"
          >
            <LogOut size={16} className="sm:mr-1" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
