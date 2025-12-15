import { useEffect, useState, type FormEvent } from 'react';
import { ShieldCheck, ShieldAlert, Activity, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SiteStats {
  domain: string;
  total_attempts: number;
  success_count: number;
  error_count: number;
  avg_duration_ms: number;
  last_attempt_at: string;
  success_rate: number;
}

interface ValidationResult {
  isValid: boolean;
  report: string[];
  data: Record<string, unknown>;
}

interface IssueReport {
  id: string;
  description: string;
  issue_type: string;
  status: string;
  created_at: string;
  mangas: { title: string; url: string };
  users: { email: string };
}

export default function Admin() {
  const [stats, setStats] = useState<SiteStats[]>([]);
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [urlToValidate, setUrlToValidate] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    document.title = 'Manga Tracker – Panel de administración';

    fetchStats();
    fetchReports();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`);
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error cargando estadísticas');
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports`);
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Error cargando reportes');
    }
  };

  const handleValidate = async (e: FormEvent) => {
    e.preventDefault();
    if (!urlToValidate) return;

    setValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToValidate })
      });
      const result = await res.json();
      setValidationResult(result);
      if (result.isValid) {
        toast.success('Validación exitosa');
      } else {
        toast.warning('Validación con errores');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Error en la validación');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent px-4 py-10 text-slate-900 dark:text-slate-50 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl"
        >
          <Activity className="h-7 w-7 text-slate-500 dark:text-slate-400" />
          Panel de administración
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm shadow-slate-200/60 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-black/40"
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Salud de scraping (últimos 7 días)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Dominio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Éxito</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Duración media</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Intentos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Última actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/60 dark:divide-slate-800 dark:bg-transparent">
                {stats.map((stat) => (
                  <tr key={stat.domain}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-50">{stat.domain}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      <span className={clsx(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        stat.success_rate >= 90 ? "bg-emerald-100 text-emerald-800" :
                          stat.success_rate >= 70 ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                      )}>
                        {stat.success_rate}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{(stat.avg_duration_ms / 1000).toFixed(2)}s</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{stat.total_attempts}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{new Date(stat.last_attempt_at).toLocaleString()}</td>
                  </tr>
                ))}
                {stats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">Todavía no hay datos de scraping.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm shadow-slate-200/60 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-black/40"
        >
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            Validar nueva fuente
          </h2>
          <form onSubmit={handleValidate} className="mb-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              placeholder="Pega la URL completa del manga a validar..."
              className="flex-1 rounded-2xl border border-slate-300 bg-white/80 px-4 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-50 dark:focus:ring-slate-500"
              value={urlToValidate}
              onChange={(e) => setUrlToValidate(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={validating}
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {validating ? 'Validando...' : 'Validar'}
            </button>
          </form>

          {validationResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={clsx("rounded-2xl border p-4", validationResult.isValid ? "border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-950/40" : "border-red-200/70 bg-red-50/70 dark:border-red-500/30 dark:bg-red-950/40")}
            >
              <div className="mb-3 flex items-center gap-2">
                {validationResult.isValid ? <CheckCircle className="text-emerald-600" /> : <XCircle className="text-red-600" />}
                <span className="text-sm font-semibold">
                  {validationResult.isValid ? "Validación correcta" : "Validación con errores"}
                </span>
              </div>
              <ul className="space-y-1">
                {validationResult.report.map((line, i) => (
                  <li
                    key={i}
                    className={clsx(
                      "text-xs font-mono",
                      line.includes("ERROR")
                        ? "text-red-700 dark:text-red-300"
                        : line.includes("WARNING")
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-slate-700 dark:text-slate-200"
                    )}
                  >
                    {line}
                  </li>
                ))}
              </ul>
              {validationResult.data && (
                <div className="mt-4 max-h-60 overflow-auto rounded-2xl bg-slate-900 px-4 py-3 text-xs font-mono text-slate-50">
                  <pre>{JSON.stringify(validationResult.data, null, 2)}</pre>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm shadow-slate-200/60 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-black/40"
        >
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Reportes de usuarios
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Manga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/60 dark:divide-slate-800 dark:bg-transparent">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-300">{new Date(report.created_at).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium capitalize text-slate-900 dark:text-slate-50">{report.issue_type?.replace('_', ' ') || 'Unknown'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700 hover:underline dark:text-slate-200">
                      <a href={report.mangas?.url} target="_blank" rel="noreferrer">{report.mangas?.title || 'Unknown Manga'}</a>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-300">{report.users?.email}</td>
                    <td className="max-w-xs px-6 py-4 text-sm text-slate-700 truncate dark:text-slate-200" title={report.description}>{report.description}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                      <span className={clsx("inline-flex px-2 text-xs leading-5 font-semibold rounded-full", report.status === 'open' ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800")}>
                        {report.status === 'open' ? 'Abierto' : 'Cerrado'}
                      </span>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">Todavía no hay reportes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
