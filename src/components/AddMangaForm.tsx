import { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddMangaFormProps {
  onAddManga: (url: string) => Promise<void>;
}

export function AddMangaForm({ onAddManga }: AddMangaFormProps) {
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setAdding(true);
    try {
      await onAddManga(newUrl);
      setNewUrl('');
    } catch (error) {
      // Error handling is likely done in the parent or we can let it bubble
      console.error(error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mb-10 rounded-3xl border border-slate-200/70 bg-white/80 p-3 shadow-sm shadow-slate-200/60 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/40">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Pega la URL del manga, manhwa o webtoon..."
          className="flex-1 rounded-2xl border-none bg-slate-50/80 px-5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-indigo-400/70 dark:bg-slate-800/70 dark:text-slate-50 dark:placeholder-slate-500 dark:focus:bg-slate-900"
          required
        />
        <button
          type="submit"
          disabled={adding}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-fuchsia-400/40 transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          <Plus size={20} />
          {adding ? 'Añadiendo...' : 'Añadir serie'}
        </button>
      </form>
    </div>
  );
}
