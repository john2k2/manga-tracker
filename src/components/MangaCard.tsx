import { useState } from 'react';
import { BookOpen, Edit2, ExternalLink, Flag, Trash2 } from 'lucide-react';
import { Manga } from '../types';

interface MangaCardProps {
  manga: Manga;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  onUpdateCover: (id: string, newUrl: string) => Promise<void>;
  onUpdateTitle: (id: string, newTitle: string) => Promise<void>;
}

export function MangaCard({ manga, onDelete, onReport, onUpdateCover, onUpdateTitle }: MangaCardProps) {
  const [editingCover, setEditingCover] = useState(false);
  const [newCoverUrl, setNewCoverUrl] = useState('');
  
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');

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
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
      
      {/* Card Actions Overlay */}
      <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button 
          onClick={() => onReport(manga.id)}
          className="rounded-full bg-white/90 p-2 text-gray-500 shadow-sm backdrop-blur-md transition-colors hover:bg-yellow-50 hover:text-yellow-600 dark:bg-gray-800/90 dark:text-gray-400 dark:hover:bg-yellow-900/50 dark:hover:text-yellow-400"
          title="Report Issue"
        >
          <Flag size={18} />
        </button>
        <button 
          onClick={() => onDelete(manga.id)}
          className="rounded-full bg-white/90 p-2 text-gray-500 shadow-sm backdrop-blur-md transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-gray-800/90 dark:text-gray-400 dark:hover:bg-red-900/50 dark:hover:text-red-400"
          title="Remove Manga"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex h-full">
        {/* Cover Image Section */}
        <div className="relative w-2/5 group/cover overflow-hidden bg-gray-100 dark:bg-gray-700">
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
          
          {/* Fallback Placeholder */}
          <div className={`flex h-full flex-col items-center justify-center p-4 text-center text-gray-400 dark:text-gray-500 ${manga.cover_image ? 'hidden' : ''}`}>
            <BookOpen size={32} className="mb-2 opacity-50" />
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">No Cover</span>
          </div>

          {/* Edit Cover Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover/cover:opacity-100">
            <button 
              onClick={() => {
                setEditingCover(true);
                setNewCoverUrl(manga.cover_image || '');
              }}
              className="rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-transform hover:scale-110 hover:bg-white/30"
              title="Change Cover Image"
            >
              <Edit2 size={20} />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-5 relative group/title">
          {/* Title & Edit */}
          <div className="mb-3">
            {editingTitle ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border-2 border-blue-500 p-1.5 text-sm font-bold dark:bg-gray-700 dark:border-blue-400 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button onClick={() => setEditingTitle(false)} className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
                  <button onClick={handleSaveTitle} className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-blue-700">Save</button>
                </div>
              </div>
            ) : (
              <div className="group/text relative cursor-pointer" onClick={() => {
                setEditingTitle(true);
                setNewTitle(manga.title);
              }}>
                <h3 className="line-clamp-2 text-lg font-bold leading-tight text-gray-900 transition-colors group-hover/text:text-blue-600 dark:text-white dark:group-hover/text:text-blue-400" title={manga.title}>
                  {manga.title}
                </h3>
                <Edit2 size={12} className="absolute -right-4 top-1 opacity-0 transition-opacity group-hover/text:opacity-50 text-gray-500" />
              </div>
            )}
          </div>

          {/* Source Link */}
          <a 
            href={manga.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="mb-4 inline-flex items-center text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          >
            <ExternalLink size={12} className="mr-1" />
            {new URL(manga.url).hostname.replace('www.', '')}
          </a>
          
          {/* Chapters List */}
          <div className="mt-auto">
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Latest Updates</h4>
            <div className="flex flex-col gap-1.5">
              {manga.chapters.length > 0 ? (
                manga.chapters.map((chapter, idx) => (
                  <a 
                    key={idx}
                    href={chapter.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/chapter flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                  >
                    <span className="truncate">Ch. {chapter.number}</span>
                    <span className="text-[10px] text-gray-400 group-hover/chapter:text-blue-400/70">
                      {chapter.release_date ? new Date(chapter.release_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </a>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
                  No chapters found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Cover Modal Overlay (Local to Card) */}
      {editingCover && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 p-6 backdrop-blur-sm dark:bg-gray-900/95">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Update Cover Image</h4>
          <input 
            type="text" 
            value={newCoverUrl}
            onChange={(e) => setNewCoverUrl(e.target.value)}
            placeholder="Paste image URL..."
            className="mb-4 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            autoFocus
          />
          <div className="flex w-full gap-3">
            <button 
              onClick={() => setEditingCover(false)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveCover}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
