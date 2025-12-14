import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { issueType: string; description: string }) => Promise<void>;
}

export function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
  const [reportDescription, setReportDescription] = useState('');
  const [reportIssueType, setReportIssueType] = useState('other');
  const [isReporting, setIsReporting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription) return;

    setIsReporting(true);
    try {
      await onSubmit({
        issueType: reportIssueType,
        description: reportDescription
      });
      // Reset form on success
      setReportDescription('');
      setReportIssueType('other');
      onClose();
    } catch (error) {
      console.error(error);
      // Parent should handle alert, or we can catch here if parent throws
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/60 dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/40"
          >
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              <AlertTriangle className="text-amber-500" />
              Informar un problema
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Tipo de incidencia</label>
                <select 
                  value={reportIssueType}
                  onChange={(e) => setReportIssueType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-slate-500"
                >
                  <option value="missing_chapters">Faltan capítulos</option>
                  <option value="wrong_title">Título incorrecto</option>
                  <option value="wrong_cover">Portada incorrecta</option>
                  <option value="broken_link">Enlace roto</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Descripción</label>
                <textarea 
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe qué está fallando..."
                  className="h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-slate-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isReporting}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-50 transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {isReporting ? 'Enviando...' : 'Enviar informe'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
