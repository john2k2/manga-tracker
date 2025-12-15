# 📚 Manga Tracker & Scraper

Una aplicación web moderna (PWA) para rastrear tus mangas favoritos, recibir notificaciones de nuevos capítulos y mantener tu biblioteca organizada automáticamente mediante Inteligencia Artificial.

## ✨ Características

- **Scraping Inteligente Híbrido:**
  - **Nivel 1 (Rápido & Gratis):** Intenta obtener datos directamente del HTML usando Axios + Google Gemini.
  - **Nivel 2 (Robusto):** Si falla (por bloqueos o SPAs complejas), usa automáticamente **Firecrawl** para navegar como un humano.
  - **Smart Cache:** "Aprende" qué estrategia funciona mejor para cada sitio y la recuerda para la próxima vez.
- **Gestión de Biblioteca:** Agrega mangas desde cualquier URL compatible (MangaPlus, LectorManga, Webtoons, etc.).
- **IA Powered:** Utiliza **Gemini 2.0 Flash** para analizar y extraer información (Título, Portada, Capítulos) de cualquier estructura web, sin selectores CSS frágiles.
- **Notificaciones Push:** Recibe alertas cuando salen nuevos capítulos (Soporte PWA).
- **Personalización:**
  - Modo Oscuro / Claro.
  - Edición personalizada de Títulos y Portadas (sin afectar a otros usuarios).
- **Stack Moderno:** React 18, Vite, TailwindCSS, Supabase (Auth & DB), Node.js Express.

## 🛠️ Tecnologías

| Categoría | Stack |
|-----------|-------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express, Zod (validation) |
| **Base de Datos** | Supabase (PostgreSQL + Auth + RLS) |
| **IA & Scraping** | Google Gemini AI, Firecrawl |
| **Testing** | Vitest, React Testing Library |
| **PWA** | Vite PWA Plugin, Service Workers, Web Push |

## 📁 Estructura del Proyecto

```
mangascraper/
├── api/                      # Backend Express
│   ├── lib/
│   │   ├── logger.ts         # Logger estructurado
│   │   └── supabase.ts       # Cliente Supabase
│   ├── routes/               # Rutas API
│   │   ├── manga.ts          # CRUD de mangas
│   │   ├── admin.ts          # Panel de administración
│   │   └── ...
│   ├── services/
│   │   ├── scraper.ts        # Scraping híbrido + AI
│   │   └── scheduler.ts      # Cron job de actualizaciones
│   └── validators/           # Validación Zod
│       └── schemas.ts
├── src/                      # Frontend React
│   ├── components/
│   │   ├── ui/               # Componentes UI reutilizables
│   │   ├── __tests__/        # Tests de componentes
│   │   └── MangaCard.tsx
│   ├── hooks/                # Custom hooks
│   ├── pages/                # Páginas principales
│   ├── types/                # Tipos TypeScript
│   └── config/               # Configuraciones
├── supabase/
│   └── migrations/           # Schema de base de datos
└── vitest.config.ts          # Configuración de tests
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- API Key de [Google Gemini](https://ai.google.dev/)
- API Key de [Firecrawl](https://firecrawl.dev) (Opcional, recomendado para sitios difíciles)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/john2k2/manga-tracker.git
   cd manga-tracker
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno:**
   ```bash
   cp .env.example .env
   ```
   Rellena con tus claves de Supabase, Gemini y Firecrawl.

4. **Base de Datos:**
   Ejecuta el script SQL en `supabase/migrations/` en el SQL Editor de Supabase.

5. **Desarrollo:**
   ```bash
   npm run dev
   ```

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Frontend + Backend en desarrollo |
| `npm run build` | Build de producción |
| `npm run check` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm test` | Ejecutar tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con cobertura |

## 🧪 Testing

El proyecto usa **Vitest** + **React Testing Library**:

```bash
# Correr todos los tests
npm test

# Con coverage
npm run test:coverage

# Modo watch
npm run test:watch
```

**Cobertura actual:**
- Componentes UI (CardActions, ChapterList, EditableTitle)
- Custom Hooks (useEditableField)
- Validadores API (Zod schemas)

## 📦 Despliegue en Vercel

1. Importa el repo en Vercel.
2. Configura las **Environment Variables**.
3. ¡Deploy! 🚀

El archivo `vercel.json` maneja el routing de `/api/*` al backend.

## 🔒 Seguridad

- **Row Level Security (RLS):** Cada usuario solo ve sus propios datos.
- **Claves sensibles:** Nunca se exponen al cliente.
- **Validación con Zod:** Todos los inputs de API se validan.
- **Personalización segura:** Los cambios de título/portada son por usuario.

## 🔧 Arquitectura

### Sistema de Scraping

```
URL → Direct Fetch (Axios) → Gemini AI Parser
         ↓ (si falla)
    Firecrawl → Gemini AI Parser
         ↓
    domain_configs (cache de estrategia)
```

### Scheduler de Actualizaciones

- Cron job cada 6 horas
- **Optimizaciones:**
  - Salta mangas que nadie lee activamente
  - Regla de 7 días: no chequea si no pasaron 7 días desde el último capítulo
- Envía notificaciones push a usuarios suscritos

### Logger Estructurado

- JSON en producción (para log aggregation)
- Formato legible en desarrollo
- Helpers específicos para scraping y scheduler

## 📝 Licencia

MIT
