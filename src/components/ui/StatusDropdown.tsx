import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { STATUS_CONFIG, ALL_STATUSES } from '../../config/statusConfig';
import { useDropdown } from '../../hooks/useMangaCard';
import type { ReadingStatus } from '../../types/index';

interface StatusDropdownProps {
    currentStatus: ReadingStatus;
    mangaId: string;
    onStatusChange: (status: ReadingStatus) => void;
}

export function StatusDropdown({ currentStatus, mangaId, onStatusChange }: StatusDropdownProps) {
    const { isOpen, toggle, select, ref } = useDropdown<HTMLDivElement>({
        onSelect: (value) => onStatusChange(value as ReadingStatus)
    });

    const config = STATUS_CONFIG[currentStatus || 'reading'];
    const Icon = config.icon;

    return (
        <div className="mb-4" ref={ref}>
            <div className="relative">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggle}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${config.bg} ${config.text}`}
                >
                    <div className="flex items-center gap-2">
                        <Icon size={14} />
                        <span>{config.label}</span>
                    </div>
                    <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </motion.button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 p-1 shadow-xl backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95"
                        >
                            {ALL_STATUSES.map((statusKey) => {
                                const statusConfig = STATUS_CONFIG[statusKey];
                                const StatusIcon = statusConfig.icon;
                                const isSelected = currentStatus === statusKey;

                                return (
                                    <button
                                        key={statusKey}
                                        onClick={() => select(statusKey)}
                                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isSelected
                                            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        <StatusIcon
                                            size={14}
                                            className={isSelected ? 'text-indigo-500' : ''}
                                        />
                                        <span>{statusConfig.label}</span>
                                        {isSelected && (
                                            <motion.div
                                                layoutId={`activeStatus-${mangaId}`}
                                                className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
