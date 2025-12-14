import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Manga } from '../types';
import { Header } from '../components/Header';
import { AddMangaForm } from '../components/AddMangaForm';
import { MangaCard } from '../components/MangaCard';
import { EmptyState } from '../components/EmptyState';
import { ReportModal } from '../components/ReportModal';

import type { User } from '@supabase/supabase-js';

export default function Home() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // State for reporting issues
  const [reportingMangaId, setReportingMangaId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Manga Tracker – Tu biblioteca de mangas';

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
      toast.error('Error al cargar la biblioteca');
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
      toast.success('¡Manga añadido a tu colección!');
      await fetchMangas(user.id);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo añadir el manga. Verifica la URL.');
      throw error; // Propagate to form to stop loading state
    }
  };

  const handleDeleteManga = async (mangaId: string) => {
    // Custom toast with confirmation could be better, but native confirm is ok for now
    if (!confirm('¿Seguro que quieres eliminar este manga de tu biblioteca?')) return;
    
    try {
      await axios.delete('/api/manga/delete', {
        data: {
          manga_id: mangaId,
          user_id: user.id
        }
      });
      // Optimistic update
      setMangas(mangas.filter(m => m.id !== mangaId));
      toast.success('Manga eliminado');
    } catch (error) {
      console.error('Error deleting manga:', error);
      toast.error('Error al eliminar el manga');
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
        toast.success('Portada actualizada');
    } catch (error) {
        console.error('Error updating cover:', error);
        toast.error('Error al actualizar la portada');
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
        toast.success('Título actualizado');
    } catch (error) {
        console.error('Error updating title:', error);
        toast.error('Error al actualizar el título');
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
        
        toast.success('Reporte enviado. Gracias por avisarnos.');
    } catch (error) {
        console.error('Error reporting issue:', error);
        toast.error('Error al enviar el reporte');
        throw error;
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    toast.message('Sesión cerrada. ¡Hasta pronto!');
  };
  
  return (
    <div className="min-h-screen pb-20 text-slate-900 transition-colors duration-200 dark:text-slate-50">
      <Header onLogout={handleLogout} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <AddMangaForm onAddManga={handleAddManga} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Cargando tu biblioteca...</p>
          </div>
        ) : mangas.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div 
            layout
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2"
          >
            <AnimatePresence mode='popLayout'>
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
            </AnimatePresence>
          </motion.div>
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
