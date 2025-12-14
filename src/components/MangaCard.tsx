import { useState, useRef, useEffect } from 'react';
import { BookOpen, Edit2, ExternalLink, Flag, Trash2, Calendar, CheckCircle2, PauseCircle, XCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Manga } from '../types';

interface MangaCardProps {
  manga: Manga;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  onUpdateCover: (id: string, newUrl: string) => Promise<void>;
  onUpdateTitle: (id: string, newTitle: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

const STATUS_CONFIG = {
  reading: { 
    label: 'Leyendo', 
    icon: BookOpen, 
    bg: 'bg-blue-500 dark:bg-blue-600', 
    text: 'text-white',
    hover: 'hover:bg-blue-600 dark:hover:bg-blue-700'
  },
  plan_to_read: { 
    label: 'Por leer', 
    icon: Calendar, 
    bg: 'bg-slate-500 dark:bg-slate-600', 
    text: 'text-white',
    hover: 'hover:bg-slate-600 dark:hover:bg-slate-700'
  },
  completed: { 
    label: 'Completado', 
    icon: CheckCircle2, 
    bg: 'bg-emerald-500 dark:bg-emerald-600', 
    text: 'text-white',
    hover: 'hover:bg-emerald-600 dark:hover:bg-emerald-700'
  },
  on_hold: { 
    label: 'En pausa', 
    icon: PauseCircle, 
    bg: 'bg-amber-500 dark:bg-amber-600', 
    text: 'text-white',
    hover: 'hover:bg-amber-600 dark:hover:bg-amber-700'
  },
  dropped: { 
    label: 'Dropeado', 
    icon: XCircle, 
    bg: 'bg-red-500 dark:bg-red-600', 
    text: 'text-white',
    hover: 'hover:bg-red-600 dark:hover:bg-red-700'
  },
};

export function MangaCard({ manga, onDelete, onReport, onUpdateCover, onUpdateTitle, onUpdateStatus }: MangaCardProps) {
  const [editingCover, setEditingCover] = useState(false);
  const [newCoverUrl, setNewCoverUrl] = useState('');
  
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [statusRef]);

  const handleSaveCover = async () => {
    if (!newCoverUrl) return;
    await onUpdateCover(manga.id, newCoverUrl);
    setEditingCover(false);
    setNewCoverUrl('');
  };

  const handleSaveTitle = async () => {
    if (!newTitle) return;
    await onUpdateTitle(manga.id, newTitle);
    setEditingTitle(false);
    setNewTitle('');
  };


  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm shadow-slate-200/60 transition-colors hover:border-fuchsia-300/80 hover:shadow-lg hover:shadow-fuchsia-300/30 dark:border-slate-700/70 dark:bg-slate-900/70 dark:hover:border-fuchsia-400/80 dark:shadow-black/40"
    >
      <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <button 
          onClick={() => onReport(manga.id)}
          className="rounded-full bg-white/90 p-2 text-slate-500 shadow-sm backdrop-blur-md transition-colors hover:bg-yellow-50 hover:text-yellow-600 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-yellow-950/40 dark:hover:text-yellow-300"
          title="Report Issue"
        >
          <Flag size={18} />
        </button>
        <button 
          onClick={() => onDelete(manga.id)}
          className="rounded-full bg-white/90 p-2 text-slate-500 shadow-sm backdrop-blur-md transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
          title="Remove Manga"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex h-full">
        <div className="relative w-2/5 overflow-hidden rounded-l-3xl bg-slate-100 group/cover dark:bg-slate-800">
          {manga.cover_image ? (
            <img 
              src={manga.cover_image} 
              alt={manga.title} 
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          <div className={`flex h-full flex-col items-center justify-center p-4 text-center text-slate-400 dark:text-slate-500 ${manga.cover_image ? 'hidden' : ''}`}>
            <BookOpen size={32} className="mb-2 opacity-60" />
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Sin portada</span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-150 group-hover/cover:opacity-100">
            <button 
              onClick={() => {
                setEditingCover(true);
                setNewCoverUrl(manga.cover_image || '');
              }}
              className="rounded-full bg-fuchsia-500/90 p-3 text-white shadow-sm shadow-fuchsia-400/60 backdrop-blur-sm transition-transform hover:scale-105 hover:bg-fuchsia-400/90"
              title="Change Cover Image"
            >
              <Edit2 size={20} />
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col p-3 sm:p-5 group/title">
          <div className="mb-3 pr-24">
            {editingTitle ? (
              <div>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 outline-none ring-1 ring-transparent transition focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-slate-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                />
                <div className="mt-2 flex justify-end gap-2 text-xs">
                  <button onClick={() => setEditingTitle(false)} className="rounded-full px-3 py-1 font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800">Cancelar</button>
                  <button onClick={handleSaveTitle} className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-slate-50 transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">Guardar</button>
                </div>
              </div>
            ) : (
              <div className="group/text relative cursor-pointer" onClick={() => {
                setEditingTitle(true);
                setNewTitle(manga.title);
              }}>
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover/text:text-slate-900 dark:text-slate-50 dark:group-hover/text:text-slate-50" title={manga.title}>
                  {manga.title}
                </h3>
                <Edit2 size={12} className="absolute -right-4 top-1 text-fuchsia-400 opacity-0 transition-opacity group-hover/text:opacity-90" />
              </div>
            )}
          </div>

          {/* Source Link */}
          <a 
            href={manga.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="mb-4 inline-flex items-center text-xs font-medium text-slate-500 hover:text-fuchsia-600 dark:text-slate-400 dark:hover:text-fuchsia-300"
          >
            <ExternalLink size={12} className="mr-1" />
            {new URL(manga.url).hostname.replace('www.', '')}
          </a>

          {/* Reading Status Selector */}
          <div className="mb-4" ref={statusRef}>
             <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${
                    STATUS_CONFIG[(manga.settings.reading_status || 'reading') as keyof typeof STATUS_CONFIG].bg
                  } ${STATUS_CONFIG[(manga.settings.reading_status || 'reading') as keyof typeof STATUS_CONFIG].text}`}
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = STATUS_CONFIG[(manga.settings.reading_status || 'reading') as keyof typeof STATUS_CONFIG].icon;
                      return <Icon size={14} />;
                    })()}
                    <span>{STATUS_CONFIG[(manga.settings.reading_status || 'reading') as keyof typeof STATUS_CONFIG].label}</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isStatusOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {isStatusOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 p-1 shadow-xl backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95"
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        const isSelected = (manga.settings.reading_status || 'reading') === key;
                        
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              onUpdateStatus(manga.id, key);
                              setIsStatusOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                              isSelected 
                                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100' 
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                            }`}
                          >
                            <Icon size={14} className={isSelected ? config.text.replace('text-white', 'text-indigo-500') : ''} />
                            <span>{config.label}</span>
                            {isSelected && <motion.div layoutId={`activeStatus-${manga.id}`} className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
          
          <div className="mt-auto">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Últimos capítulos
            </h4>
            <div className="flex flex-col gap-1.5">
              {manga.chapters.length > 0 ? (
                manga.chapters.map((chapter, idx) => (
                  <a 
                    key={idx}
                    href={chapter.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/chapter flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-gradient-to-r hover:from-indigo-500 hover:via-fuchsia-500 hover:to-amber-400 hover:text-white dark:bg-slate-800/70 dark:text-slate-200 dark:hover:from-indigo-400 dark:hover:via-fuchsia-400 dark:hover:to-amber-300"
                  >
                    <span className="truncate">Ch. {chapter.number}</span>
                    <span className="text-[10px] text-slate-400 group-hover/chapter:text-slate-200 dark:group-hover/chapter:text-slate-600">
                      {chapter.release_date ? new Date(chapter.release_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </a>
              ))
            ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  Aún no hay capítulos disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingCover && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 p-6 backdrop-blur-md dark:bg-slate-950/95">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Actualizar portada</h4>
          <input 
            type="text" 
            value={newCoverUrl}
            onChange={(e) => setNewCoverUrl(e.target.value)}
            placeholder="Pega la URL de la imagen..."
            className="mb-4 w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-50 dark:focus:ring-slate-500"
            autoFocus
          />
          <div className="flex w-full gap-3">
            <button
              onClick={() => setEditingCover(false)}
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveCover}
              className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-50 transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
