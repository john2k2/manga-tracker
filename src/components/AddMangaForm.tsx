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
    <div className="mb-10 rounded-2xl bg-white p-2 shadow-sm dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Paste manga URL here to track..."
          className="flex-1 rounded-xl border-none bg-gray-50 px-6 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700/50 dark:text-white dark:placeholder-gray-500"
          required
        />
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/40 disabled:opacity-50 disabled:hover:scale-100"
        >
          <Plus size={20} />
          {adding ? 'Adding...' : 'Add Manga'}
        </button>
      </form>
    </div>
  );
}
