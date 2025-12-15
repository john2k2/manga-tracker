import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MangaWithSettings, ReadingStatus } from '../types/index';

// UI Components
import { CardActions } from './ui/CardActions';
import { MangaCover } from './ui/MangaCover';
import { EditableTitle } from './ui/EditableTitle';
import { StatusDropdown } from './ui/StatusDropdown';
import { ChapterList } from './ui/ChapterList';

interface MangaCardProps {
  manga: MangaWithSettings;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  onUpdateCover: (id: string, newUrl: string) => Promise<void>;
  onUpdateTitle: (id: string, newTitle: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

export function MangaCard({
  manga,
  onDelete,
  onReport,
  onUpdateCover,
  onUpdateTitle,
  onUpdateStatus
}: MangaCardProps) {
  const handleUpdateCover = (newUrl: string) => onUpdateCover(manga.id, newUrl);
  const handleUpdateTitle = (newTitle: string) => onUpdateTitle(manga.id, newTitle);
  const handleUpdateStatus = (status: ReadingStatus) => onUpdateStatus(manga.id, status);

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
      {/* Hover Actions */}
      <CardActions
        onReport={() => onReport(manga.id)}
        onDelete={() => onDelete(manga.id)}
      />

      <div className="flex h-full">
        {/* Cover Image */}
        <MangaCover
          coverImage={manga.cover_image}
          title={manga.title}
          onUpdateCover={handleUpdateCover}
        />

        {/* Content */}
        <div className="relative flex flex-1 flex-col p-3 sm:p-5">
          {/* Title */}
          <div className="mb-3 pr-24">
            <EditableTitle
              title={manga.title}
              onSave={handleUpdateTitle}
            />
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

          {/* Reading Status */}
          <StatusDropdown
            currentStatus={manga.settings.reading_status || 'reading'}
            mangaId={manga.id}
            onStatusChange={handleUpdateStatus}
          />

          {/* Chapters */}
          <div className="mt-auto">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Últimos capítulos
            </h4>
            <ChapterList chapters={manga.chapters} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
