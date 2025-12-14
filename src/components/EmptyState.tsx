import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export function EmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/80 px-6 py-16 text-center shadow-sm shadow-slate-200/60 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-50 dark:shadow-black/40"
    >
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
      >
        <BookOpen size={28} />
      </motion.div>
      <motion.h3 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-xl font-medium tracking-tight text-slate-900 dark:text-slate-50"
      >
        Tu estantería está esperando
      </motion.h3>
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400"
      >
        Añade tu primera serie y deja que nosotros nos ocupemos de seguirla.
      </motion.p>
    </motion.div>
  );
}
