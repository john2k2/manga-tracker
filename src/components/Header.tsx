import { useState } from 'react';
import { BookOpen, LogOut, Moon, Sun, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';
import { PushNotificationManager } from './PushNotificationManager';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface HeaderProps {
  onLogout: () => void;
  onRefreshComplete?: () => void; // Optional callback when refresh completes
}

export function Header({ onLogout, onRefreshComplete }: HeaderProps) {
  const { toggleTheme, isDark } = useTheme();
  const [updating, setUpdating] = useState(false);

  const handleManualUpdate = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/cron/manual-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          toast.warning(data.message || 'Esperá un poco antes de intentar de nuevo.');
        } else {
          throw new Error(data.error || 'Error al actualizar');
        }
      } else {
        toast.success(data.message || '¡Actualización completada!');
        onRefreshComplete?.();
      }
    } catch (err) {
      console.error('Manual update error:', err);
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setUpdating(false);
    }
  };

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
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Manual Update Button */}
          <button
            onClick={handleManualUpdate}
            disabled={updating}
            className={clsx(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-2 text-xs font-medium transition-all sm:px-3",
              updating
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                : "border-indigo-200 bg-indigo-50 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/60"
            )}
            title={updating ? 'Actualizando...' : 'Buscar nuevos capítulos'}
          >
            <RefreshCw size={14} className={clsx(updating && "animate-spin")} />
            <span className="hidden sm:inline">{updating ? 'Buscando...' : 'Actualizar'}</span>
          </button>
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
