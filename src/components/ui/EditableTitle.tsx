import { Edit2 } from 'lucide-react';
import { useEditableField } from '../../hooks/useMangaCard';

interface EditableTitleProps {
    title: string;
    onSave: (newTitle: string) => Promise<void>;
}

export function EditableTitle({ title, onSave }: EditableTitleProps) {
    const {
        isEditing,
        value,
        setValue,
        isSaving,
        startEditing,
        cancelEditing,
        save
    } = useEditableField({ initialValue: title, onSave });

    if (isEditing) {
        return (
            <div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 outline-none ring-1 ring-transparent transition focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-slate-500"
                    autoFocus
                    disabled={isSaving}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') save();
                        if (e.key === 'Escape') cancelEditing();
                    }}
                />
                <div className="mt-2 flex justify-end gap-2 text-xs">
                    <button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="rounded-full px-3 py-1 font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={save}
                        disabled={isSaving}
                        className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-slate-50 transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="group/text relative cursor-pointer"
            onClick={startEditing}
        >
            <h3
                className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover/text:text-slate-900 dark:text-slate-50 dark:group-hover/text:text-slate-50"
                title={title}
            >
                {title}
            </h3>
            <Edit2
                size={12}
                className="absolute -right-4 top-1 text-fuchsia-400 opacity-0 transition-opacity group-hover/text:opacity-90"
            />
        </div>
    );
}
