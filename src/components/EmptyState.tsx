import { BookOpen } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center shadow-sm dark:bg-gray-800 dark:text-white">
      <div className="mb-6 rounded-full bg-blue-50 p-6 dark:bg-blue-900/20">
        <BookOpen size={64} className="text-blue-500 dark:text-blue-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your library is empty</h3>
      <p className="mt-2 max-w-sm text-gray-500 dark:text-gray-400">Start building your collection by adding a URL from your favorite manga site.</p>
    </div>
  );
}
