import { Check, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

// Simple Chapter type for UI - only needs display fields
interface ChapterItem {
    number: number;
    url: string;
    release_date: string | null;
}

interface ChapterListProps {
    chapters: ChapterItem[];
    lastReadChapter?: number | null;
    onMarkRead?: (chapterNumber: number) => void;
}

export function ChapterList({ chapters, lastReadChapter = 0, onMarkRead }: ChapterListProps) {
    const lastRead = lastReadChapter || 0;

    if (chapters.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                Aún no hay capítulos disponibles
            </div>
        );
    }

    const handleChapterClick = (e: React.MouseEvent, chapter: ChapterItem) => {
        // If clicking the check button area, mark as read
        if ((e.target as HTMLElement).closest('[data-mark-read]')) {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead?.(chapter.number);
        }
        // Otherwise let the link work normally
    };

    return (
        <div className="flex flex-col gap-1.5">
            {chapters.map((chapter, idx) => {
                const isRead = chapter.number <= lastRead;

                return (
                    <div
                        key={idx}
                        className={clsx(
                            "group/chapter flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                            isRead
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "bg-slate-50 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                        )}
                    >
                        {/* Mark as Read Button */}
                        <button
                            data-mark-read
                            onClick={(e) => handleChapterClick(e, chapter)}
                            className={clsx(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                                isRead
                                    ? "border-emerald-400 bg-emerald-500 text-white dark:border-emerald-600 dark:bg-emerald-600"
                                    : "border-slate-300 hover:border-fuchsia-400 hover:bg-fuchsia-50 dark:border-slate-600 dark:hover:border-fuchsia-500 dark:hover:bg-fuchsia-950/30"
                            )}
                            title={isRead ? 'Leído' : 'Marcar como leído'}
                        >
                            {isRead && <Check size={12} strokeWidth={3} />}
                        </button>

                        {/* Chapter Link */}
                        <a
                            href={chapter.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={clsx(
                                "flex flex-1 items-center justify-between transition-colors",
                                isRead
                                    ? "hover:text-emerald-800 dark:hover:text-emerald-300"
                                    : "hover:text-fuchsia-600 dark:hover:text-fuchsia-400"
                            )}
                        >
                            <span className="flex items-center gap-1 truncate">
                                Ch. {chapter.number}
                                <ExternalLink size={10} className="opacity-0 transition-opacity group-hover/chapter:opacity-50" />
                            </span>
                            <span className={clsx(
                                "text-[10px]",
                                isRead
                                    ? "text-emerald-500 dark:text-emerald-600"
                                    : "text-slate-400"
                            )}>
                                {chapter.release_date
                                    ? new Date(chapter.release_date).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric'
                                    })
                                    : ''
                                }
                            </span>
                        </a>
                    </div>
                );
            })}
        </div>
    );
}
