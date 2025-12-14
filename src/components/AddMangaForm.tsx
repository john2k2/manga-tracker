import { useState } from 'react';
import { Plus, Search, Link as LinkIcon, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface AddMangaFormProps {
  onAddManga: (url: string) => Promise<void>;
}

interface SearchResult {
  title: string;
  url: string;
  description?: string;
}

export function AddMangaForm({ onAddManga }: AddMangaFormProps) {
  const [mode, setMode] = useState<'link' | 'search'>('search'); // Default to search as requested
  const [newUrl, setNewUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedUrls, setAddedUrls] = useState<Set<string>>(new Set());

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    await addManga(newUrl);
    setNewUrl('');
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]);
    try {
      const { data } = await axios.post('/api/manga/search', { query: searchQuery });
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addManga = async (url: string) => {
    setAdding(true);
    try {
      await onAddManga(url);
      setAddedUrls(prev => new Set(prev).add(url));
    } catch (error) {
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
      className="mb-10 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-sm shadow-slate-200/60 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/40"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200/50 dark:border-slate-700/50">
        <button
          onClick={() => setMode('search')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            mode === 'search'
              ? 'bg-slate-50 text-teal-600 dark:bg-slate-800/50 dark:text-teal-400'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-slate-200'
          }`}
        >
          <Search size={16} />
          Buscar Manga
        </button>
        <button
          onClick={() => setMode('link')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            mode === 'link'
              ? 'bg-slate-50 text-teal-600 dark:bg-slate-800/50 dark:text-teal-400'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-slate-200'
          }`}
        >
          <LinkIcon size={16} />
          Pegar Link
        </button>
      </div>

      <div className="p-3">
        {mode === 'link' ? (
          <form onSubmit={handleLinkSubmit} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Pega la URL de algo que quieras leer..."
              className="flex-1 rounded-2xl border-none bg-slate-50/80 px-5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-teal-400/50 dark:bg-slate-800/70 dark:text-slate-50 dark:placeholder-slate-500 dark:focus:bg-slate-900"
              required
            />
            <motion.button
              type="submit"
              disabled={adding}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-slate-50 shadow-sm shadow-slate-200/50 transition-colors hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:shadow-none dark:hover:bg-slate-200"
            >
              {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              <span>Guardar</span>
            </motion.button>
          </form>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escribe el nombre del manga (ej: One Piece)"
                className="flex-1 rounded-2xl border-none bg-slate-50/80 px-5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-teal-400/50 dark:bg-slate-800/70 dark:text-slate-50 dark:placeholder-slate-500 dark:focus:bg-slate-900"
                autoFocus
              />
              <motion.button
                type="submit"
                disabled={isSearching}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-teal-200/50 transition-colors hover:bg-teal-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-teal-500 dark:shadow-none dark:hover:bg-teal-600"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                <span>Buscar</span>
              </motion.button>
            </form>

            {/* Results Area */}
            <AnimatePresence>
              {hasSearched && !isSearching && searchResults.length === 0 ? (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-2 text-sm text-slate-500 dark:text-slate-400"
                 >
                    No se encontraron resultados. Intenta con otro nombre.
                 </motion.div>
              ) : searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <p className="px-2 text-xs font-medium text-slate-500 dark:text-slate-400">Resultados encontrados:</p>
                  {searchResults.map((result, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex-1 overflow-hidden">
                        <h4 className="truncate font-medium text-slate-900 dark:text-slate-100">{result.title}</h4>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{result.url}</p>
                      </div>
                      <button
                        onClick={() => addManga(result.url)}
                        disabled={adding || addedUrls.has(result.url)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                          addedUrls.has(result.url)
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {addedUrls.has(result.url) ? (
                          <Check size={18} />
                        ) : adding ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Plus size={18} />
                        )}
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
