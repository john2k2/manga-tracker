
import dotenv from 'dotenv';
import { scrapeManga } from '../api/services/scraper';

// Load env vars
dotenv.config();

async function test() {
  // URL de prueba: One Piece en MangaPlus (o similar, usaré una genérica conocida si falla)
  // Intentemos con una URL que sepamos que tiene contenido.
  // Nota: Firecrawl funciona mejor con URLs reales.
  const testUrl = 'https://mangaplus.shueisha.co.jp/titles/100020'; // One Piece

  console.log('🧪 Iniciando prueba de scraper optimizado...');
  console.log(`Target: ${testUrl}`);

  try {
    const startTime = Date.now();
    const result = await scrapeManga(testUrl);
    const endTime = Date.now();

    console.log('\n✅ Scraping Exitoso!');
    console.log(`⏱️ Tiempo total: ${(endTime - startTime) / 1000}s`);
    console.log('------------------------------------------------');
    console.log(`📚 Título: ${result.title}`);
    console.log(`🖼️ Portada: ${result.cover_url}`);
    console.log(`📑 Capítulos encontrados: ${result.chapters.length}`);
    
    if (result.chapters.length > 0) {
      console.log('\nÚltimos 3 capítulos:');
      result.chapters.slice(0, 3).forEach(c => {
        console.log(`- #${c.number}: ${c.title || 'Sin título'} (${c.release_date || 'Sin fecha'})`);
      });
    } else {
        console.log('\n⚠️ ADVERTENCIA: No se encontraron capítulos.');
    }

  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null) {
      const maybeError = error as { message?: string; response?: { data?: unknown } };
      console.error('\n❌ Error en la prueba:', maybeError.message || 'Unknown error');
      if (maybeError.response) {
        console.error('Detalles API:', maybeError.response.data);
      }
    } else {
      console.error('\n❌ Error en la prueba:', error);
    }
  }
}

test();
