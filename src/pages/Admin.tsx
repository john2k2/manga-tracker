
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, ShieldAlert, Activity, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

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
  data: any;
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
    }
  };

  const fetchReports = async () => {
      try {
          const res = await fetch(`${API_URL}/api/admin/reports`);
          const data = await res.json();
          if (data.reports) setReports(data.reports);
      } catch (error) {
          console.error('Error fetching reports:', error);
      }
  };

  const handleValidate = async (e: React.FormEvent) => {
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
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-8 h-8" />
          System Health & Admin
        </h1>

        {/* Stats Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Site Reliability Stats (Last 7 Days)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.map((stat) => (
                  <tr key={stat.domain}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.domain}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={clsx(
                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                        stat.success_rate >= 90 ? "bg-green-100 text-green-800" :
                        stat.success_rate >= 70 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      )}>
                        {stat.success_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(stat.avg_duration_ms / 1000).toFixed(2)}s</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.total_attempts}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(stat.last_attempt_at).toLocaleString()}</td>
                  </tr>
                ))}
                {stats.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No scraping data available yet.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validation Tool */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Validate New Source
          </h2>
          <form onSubmit={handleValidate} className="flex gap-4 mb-6">
            <input
              type="url"
              placeholder="Enter full manga URL to test..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={urlToValidate}
              onChange={(e) => setUrlToValidate(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={validating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {validating ? 'Validating...' : 'Run Validation'}
            </button>
          </form>

          {validationResult && (
            <div className={clsx("p-4 rounded-md border", validationResult.isValid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
              <div className="flex items-center gap-2 mb-3">
                {validationResult.isValid ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                <span className="font-bold text-lg">{validationResult.isValid ? "Passed Validation" : "Validation Failed"}</span>
              </div>
              <ul className="space-y-1">
                {validationResult.report.map((line, i) => (
                  <li key={i} className={clsx("text-sm font-mono", line.includes("ERROR") ? "text-red-600 font-bold" : line.includes("WARNING") ? "text-yellow-700" : "text-gray-700")}>
                    {line}
                  </li>
                ))}
              </ul>
              {validationResult.data && (
                  <div className="mt-4 p-4 bg-gray-800 text-white rounded overflow-auto max-h-60 text-xs font-mono">
                      <pre>{JSON.stringify(validationResult.data, null, 2)}</pre>
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Issue Reports */}
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-red-600" />
                User Issue Reports
            </h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manga</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                            <tr key={report.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(report.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{report.issue_type?.replace('_', ' ') || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                                    <a href={report.mangas?.url} target="_blank" rel="noreferrer">{report.mangas?.title || 'Unknown Manga'}</a>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.users?.email}</td>
                                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={report.description}>{report.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={clsx("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", report.status === 'open' ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}>
                                        {report.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No issues reported yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
