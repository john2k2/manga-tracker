import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { issueType: string; description: string }) => Promise<void>;
}

export function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
  const [reportDescription, setReportDescription] = useState('');
  const [reportIssueType, setReportIssueType] = useState('other');
  const [isReporting, setIsReporting] = useState(false);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-bold text-gray-900 flex items-center gap-2 dark:text-white">
          <AlertTriangle className="text-yellow-500" />
          Report Issue
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Type</label>
            <select 
              value={reportIssueType}
              onChange={(e) => setReportIssueType(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="missing_chapters">Missing Chapters</option>
              <option value="wrong_title">Title Incorrect</option>
              <option value="wrong_cover">Cover Image Incorrect</option>
              <option value="broken_link">Broken Link</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea 
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Describe the problem..."
              className="w-full rounded-md border border-gray-300 p-2 h-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isReporting}
              className="rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              {isReporting ? 'Sending...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
