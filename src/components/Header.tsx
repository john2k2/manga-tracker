import { BookOpen, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { PushNotificationManager } from './PushNotificationManager';

interface HeaderProps {
  onLogout: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm transition-colors duration-200 dark:bg-gray-800/80 dark:border-b dark:border-gray-700">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Manga Tracker</h1>
        </div>
        <div className="flex gap-3 items-center">
          <PushNotificationManager />
          <button onClick={toggleTheme} className="rounded-full bg-gray-100 p-2.5 text-gray-600 transition-colors hover:bg-gray-200 hover:text-blue-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-blue-400" title={isDark ? "Light Mode" : "Dark Mode"}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={onLogout} className="rounded-full bg-gray-100 p-2.5 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-red-400" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
