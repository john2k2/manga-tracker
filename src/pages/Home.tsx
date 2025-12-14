import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import { Manga } from '../types';
import { Header } from '../components/Header';
import { AddMangaForm } from '../components/AddMangaForm';
import { MangaCard } from '../components/MangaCard';
import { EmptyState } from '../components/EmptyState';
import { ReportModal } from '../components/ReportModal';

export default function Home() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // State for reporting issues
  const [reportingMangaId, setReportingMangaId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchMangas(user.id);
    });
  }, []);

  const fetchMangas = async (userId: string) => {
    try {
      const response = await axios.get(`/api/manga/list?user_id=${userId}`);
      setMangas(response.data.mangas);
    } catch (error) {
      console.error('Error fetching mangas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddManga = async (url: string) => {
    if (!user) return;
    try {
      await axios.post('/api/manga/add', {
        url: url,
        user_id: user.id
      });
      await fetchMangas(user.id);
    } catch (error) {
      alert('Failed to add manga. Check URL or try again.');
      console.error(error);
      throw error; // Propagate to form to stop loading state
    }
  };

  const handleDeleteManga = async (mangaId: string) => {
    if (!confirm('Are you sure you want to remove this manga from your library?')) return;
    
    try {
      await axios.delete('/api/manga/delete', {
        data: {
          manga_id: mangaId,
          user_id: user.id
        }
      });
      // Optimistic update
      setMangas(mangas.filter(m => m.id !== mangaId));
    } catch (error) {
      console.error('Error deleting manga:', error);
      alert('Failed to delete manga.');
    }
  };

  const handleUpdateCover = async (mangaId: string, newCoverUrl: string) => {
    if (!user) return;
    try {
        await axios.post('/api/manga/update-cover', {
            manga_id: mangaId,
            user_id: user.id,
            cover_url: newCoverUrl
        });
        
        // Optimistic update
        setMangas(mangas.map(m => m.id === mangaId ? { ...m, cover_image: newCoverUrl } : m));
    } catch (error) {
        console.error('Error updating cover:', error);
        alert('Failed to update cover');
        throw error;
    }
  };

  const handleUpdateTitle = async (mangaId: string, newTitle: string) => {
    if (!user) return;
    try {
        await axios.post('/api/manga/update-title', {
            manga_id: mangaId,
            user_id: user.id,
            title: newTitle
        });
        
        // Optimistic update
        setMangas(mangas.map(m => m.id === mangaId ? { ...m, title: newTitle } : m));
    } catch (error) {
        console.error('Error updating title:', error);
        alert('Failed to update title');
        throw error;
    }
  };

  const handleReportIssue = async (data: { issueType: string; description: string }) => {
    if (!reportingMangaId || !user) return;

    try {
        await axios.post('/api/admin/report-issue', {
            user_id: user.id,
            manga_id: reportingMangaId,
            description: data.description,
            issue_type: data.issueType
        });
        
        alert('Report submitted successfully. An admin will review it.');
    } catch (error) {
        console.error('Error reporting issue:', error);
        alert('Failed to submit report');
        throw error;
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20 transition-colors duration-200 dark:bg-gray-900">
      <Header onLogout={handleLogout} />

      <main className="mx-auto max-w-4xl p-6">
        <AddMangaForm onAddManga={handleAddManga} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your library...</p>
          </div>
        ) : mangas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {mangas.map((manga) => (
              <MangaCard 
                key={manga.id} 
                manga={manga}
                onDelete={handleDeleteManga}
                onReport={(id) => setReportingMangaId(id)}
                onUpdateCover={handleUpdateCover}
                onUpdateTitle={handleUpdateTitle}
              />
            ))}
          </div>
        )}
      </main>

      <ReportModal 
        isOpen={!!reportingMangaId} 
        onClose={() => setReportingMangaId(null)} 
        onSubmit={handleReportIssue} 
      />
    </div>
  );
}
