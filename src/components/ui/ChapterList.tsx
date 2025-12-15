// Simple Chapter type for UI - only needs display fields
interface ChapterItem {
    number: number;
    url: string;
    release_date: string | null;
}

interface ChapterListProps {
    chapters: ChapterItem[];
}

export function ChapterList({ chapters }: ChapterListProps) {
    if (chapters.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                Aún no hay capítulos disponibles
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5">
            {chapters.map((chapter, idx) => (
                <a
                    key={idx}
                    href={chapter.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/chapter flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-gradient-to-r hover:from-indigo-500 hover:via-fuchsia-500 hover:to-amber-400 hover:text-white dark:bg-slate-800/70 dark:text-slate-200 dark:hover:from-indigo-400 dark:hover:via-fuchsia-400 dark:hover:to-amber-300"
                >
                    <span className="truncate">Ch. {chapter.number}</span>
                    <span className="text-[10px] text-slate-400 group-hover/chapter:text-slate-200 dark:group-hover/chapter:text-slate-600">
                        {chapter.release_date
                            ? new Date(chapter.release_date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric'
                            })
                            : ''
                        }
                    </span>
                </a>
            ))}
        </div>
    );
}
