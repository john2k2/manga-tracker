import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mb-10 rounded-3xl border border-slate-200/70 bg-white/80 p-3 shadow-sm shadow-slate-200/60 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/40"
    >
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Pega la URL de algo que quieras leer con calma..."
          className="flex-1 rounded-2xl border-none bg-slate-50/80 px-5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-teal-400/50 dark:bg-slate-800/70 dark:text-slate-50 dark:placeholder-slate-500 dark:focus:bg-slate-900"
          required
        />
        <motion.button
          type="submit"
          disabled={adding}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-slate-50 shadow-sm shadow-slate-200/50 transition-colors hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:shadow-none dark:hover:bg-slate-200"
        >
          <Plus size={18} />
          {adding ? 'Guardando...' : 'Guardar en mi biblioteca'}
        </motion.button>
      </form>
    </motion.div>
  );
}
