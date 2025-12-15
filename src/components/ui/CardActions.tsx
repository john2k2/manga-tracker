import { Flag, Trash2 } from 'lucide-react';

interface CardActionsProps {
    onReport: () => void;
    onDelete: () => void;
}

export function CardActions({ onReport, onDelete }: CardActionsProps) {
    return (
        <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button
                onClick={onReport}
                className="rounded-full bg-white/90 p-2 text-slate-500 shadow-sm backdrop-blur-md transition-colors hover:bg-yellow-50 hover:text-yellow-600 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-yellow-950/40 dark:hover:text-yellow-300"
                title="Report Issue"
                aria-label="Reportar problema"
            >
                <Flag size={18} />
            </button>
            <button
                onClick={onDelete}
                className="rounded-full bg-white/90 p-2 text-slate-500 shadow-sm backdrop-blur-md transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                title="Remove Manga"
                aria-label="Eliminar manga"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}
