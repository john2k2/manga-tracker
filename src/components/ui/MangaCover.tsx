import { Edit2, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface MangaCoverProps {
    coverImage: string | null;
    title: string;
    onUpdateCover: (newUrl: string) => Promise<void>;
}

export function MangaCover({ coverImage, title, onUpdateCover }: MangaCoverProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newCoverUrl, setNewCoverUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!newCoverUrl) return;

        setIsSaving(true);
        try {
            await onUpdateCover(newCoverUrl);
            setIsEditing(false);
            setNewCoverUrl('');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = () => {
        setNewCoverUrl(coverImage || '');
        setIsEditing(true);
    };

    return (
        <>
            <div className="relative w-2/5 overflow-hidden rounded-l-3xl bg-slate-100 group/cover dark:bg-slate-800">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}

                <div className={`flex h-full flex-col items-center justify-center p-4 text-center text-slate-400 dark:text-slate-500 ${coverImage ? 'hidden' : ''}`}>
                    <BookOpen size={32} className="mb-2 opacity-60" />
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Sin portada</span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-150 group-hover/cover:opacity-100">
                    <button
                        onClick={handleEdit}
                        className="rounded-full bg-fuchsia-500/90 p-3 text-white shadow-sm shadow-fuchsia-400/60 backdrop-blur-sm transition-transform hover:scale-105 hover:bg-fuchsia-400/90"
                        title="Change Cover Image"
                    >
                        <Edit2 size={20} />
                    </button>
                </div>
            </div>

            {isEditing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 p-6 backdrop-blur-md dark:bg-slate-950/95">
                    <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Actualizar portada
                    </h4>
                    <input
                        type="text"
                        value={newCoverUrl}
                        onChange={(e) => setNewCoverUrl(e.target.value)}
                        placeholder="Pega la URL de la imagen..."
                        className="mb-4 w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-50 dark:focus:ring-slate-500"
                        autoFocus
                        disabled={isSaving}
                    />
                    <div className="flex w-full gap-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving}
                            className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-50 transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
