import { BookOpen, Calendar, CheckCircle2, PauseCircle, XCircle } from 'lucide-react';
import type { ReadingStatus, StatusConfig, StatusConfigMap } from '../types/index';

export const STATUS_CONFIG: StatusConfigMap = {
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

export function getStatusConfig(status: ReadingStatus | undefined): StatusConfig {
    return STATUS_CONFIG[status || 'reading'];
}

export function getStatusLabel(status: ReadingStatus | undefined): string {
    return getStatusConfig(status).label;
}

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ReadingStatus[];
