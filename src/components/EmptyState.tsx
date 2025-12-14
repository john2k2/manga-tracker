import { BookOpen } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/80 px-6 py-16 text-center shadow-sm shadow-slate-200/60 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-50 dark:shadow-black/40">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-amber-400 text-slate-50 shadow-sm shadow-fuchsia-400/40">
        <BookOpen size={32} className="drop-shadow" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Tu biblioteca está vacía</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Empieza añadiendo tu primer manga, manhwa o webtoon y llena la estantería.
      </p>
    </div>
  );
}
