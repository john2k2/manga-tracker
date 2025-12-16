# 🚀 Mejoras Arquitectónicas - Manga Tracker

> **Fecha de creación:** 2025-12-16  
> **Estado:** Pendiente de implementación  
> **Objetivo:** Escalar el proyecto a una arquitectura más mantenible y testeable

---

## 📊 Estado Actual

El proyecto tiene una arquitectura **Cliente-Servidor monorepo** funcional:

| Capa | Stack Actual |
|------|--------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind |
| Backend | Express.js + TypeScript |
| Base de Datos | Supabase (PostgreSQL + Auth + RLS) |
| IA | Google Gemini + Firecrawl |
| PWA | Service Workers + Web Push |

**Rating actual: 7/10** — Sólida para MVP, pero necesita mejoras para escalar.

---

## 🔴 Prioridad Alta

### 1. Repository Layer — Separar acceso a datos

**Problema:**  
En `server/routes/manga.ts` hay lógica de base de datos mezclada directamente con los route handlers. Esto viola Single Responsibility y dificulta testing.

**Solución:**  
Crear capa de repositorios que encapsule todo acceso a Supabase.

**Estructura propuesta:**

```
server/
├── repositories/
│   ├── manga.repository.ts
│   ├── chapter.repository.ts
│   └── user-settings.repository.ts
├── services/
│   ├── manga.service.ts         # Usa repositories
│   └── scraper.ts
└── routes/
    └── manga.ts                 # Solo validación + llamar services
```

**Ejemplo de implementación:**

```typescript
// server/repositories/manga.repository.ts
import { supabase } from '../lib/supabase';
import type { Manga, UpsertMangaInput } from '../types';

export class MangaRepository {
  async findByUrl(url: string): Promise<Manga | null> {
    const { data, error } = await supabase
      .from('mangas')
      .select('*')
      .eq('url', url)
      .single();
    
    if (error?.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }
  
  async findById(id: string): Promise<Manga | null> {
    const { data, error } = await supabase
      .from('mangas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error?.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }
  
  async upsert(manga: UpsertMangaInput): Promise<Manga> {
    const { data, error } = await supabase
      .from('mangas')
      .upsert(manga, { onConflict: 'url' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('mangas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export const mangaRepository = new MangaRepository();
```

**Beneficios:**

- ✅ Testeable con mocks
- ✅ Reutilizable entre services
- ✅ Si cambiás de Supabase a otra DB, solo tocás repositories

**Esfuerzo:** Medio (4-6 horas)  
**Impacto:** Alto

---

### 2. Error Handler Global — Centralizar manejo de errores

**Problema:**  
Cada route tiene su propio try/catch con formato repetido:

```typescript
// Se repite en CADA route handler
} catch (error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  log.error('Add manga failed', err, { url });
  res.status(500).json({ error: err.message });
}
```

**Solución:**  
Middleware global de errores + clase AppError.

**Implementación:**

```typescript
// server/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;
  
  logger.error('Request failed', err, {
    path: req.path,
    method: req.method,
    statusCode,
    isOperational
  });
  
  res.status(statusCode).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      isOperational 
    })
  });
};

// Wrapper para async handlers
export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

**Uso en routes:**

```typescript
// Antes (verbose)
router.post('/add', async (req, res) => {
  try {
    // ... lógica
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Add manga failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Después (limpio)
router.post('/add', asyncHandler(async (req, res) => {
  const manga = await mangaService.add(url, userId);
  if (!manga) throw new NotFoundError('Manga');
  res.json({ success: true, manga });
}));
```

**Beneficios:**

- ✅ Código más limpio en routes
- ✅ Logging consistente
- ✅ Errores tipados (404, 400, 401, 500)

**Esfuerzo:** Bajo (1-2 horas)  
**Impacto:** Alto

---

## 🟡 Prioridad Media

### 3. API Client Layer (Frontend)

**Problema:**  
Llamadas a la API dispersas por componentes sin centralizar.

**Solución:**  
Crear cliente HTTP con interceptors.

**Estructura:**

```
src/
├── services/
│   └── api/
│       ├── client.ts           # Axios instance
│       ├── manga.api.ts        # Endpoints de manga
│       ├── notifications.api.ts
│       └── types.ts            # Response types
```

**Implementación:**

```typescript
// src/services/api/client.ts
import axios, { AxiosError } from 'axios';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Auto-inject auth token
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string }>) => {
    const message = error.response?.data?.error || 'Something went wrong';
    
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    
    toast.error(message);
    return Promise.reject(error);
  }
);
```

```typescript
// src/services/api/manga.api.ts
import { apiClient } from './client';
import type { Manga, AddMangaResponse, ListMangasResponse } from './types';

export const mangaApi = {
  add: (url: string, userId: string) => 
    apiClient.post<AddMangaResponse>('/manga/add', { url, user_id: userId }),
  
  list: (userId: string) => 
    apiClient.get<ListMangasResponse>('/manga/list', { 
      params: { user_id: userId } 
    }),
  
  delete: (mangaId: string, userId: string) =>
    apiClient.delete('/manga/delete', { 
      data: { manga_id: mangaId, user_id: userId } 
    }),
  
  updateTitle: (mangaId: string, userId: string, title: string) =>
    apiClient.post('/manga/update-title', { 
      manga_id: mangaId, 
      user_id: userId, 
      title 
    }),
  
  updateCover: (mangaId: string, userId: string, coverUrl: string) =>
    apiClient.post('/manga/update-cover', { 
      manga_id: mangaId, 
      user_id: userId, 
      cover_url: coverUrl 
    }),
  
  markRead: (mangaId: string, userId: string, chapterNumber: number) =>
    apiClient.post('/manga/mark-read', { 
      manga_id: mangaId, 
      user_id: userId, 
      chapter_number: chapterNumber 
    }),
};
```

**Esfuerzo:** Bajo (2-3 horas)  
**Impacto:** Medio

---

### 4. Environment Validation — Fail Fast

**Problema:**  
Variables de entorno se validan on-demand, puede fallar en runtime.

**Solución:**  
Validar TODO en startup con Zod.

**Implementación:**

```typescript
// server/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required'),
  
  // AI & Scraping
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  FIRECRAWL_API_KEY: z.string().min(1, 'FIRECRAWL_API_KEY is required'),
  
  // Push Notifications (optional)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_EMAIL: z.string().email().optional(),
  
  // Server
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  
  return result.data;
}

export const env = validateEnv();
```

**Uso:**

```typescript
// Antes
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing');

// Después
import { env } from './config/env';
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY); // Siempre existe
```

**Esfuerzo:** Bajo (1 hora)  
**Impacto:** Medio

---

### 5. Consolidar Types

**Problema:**  
Types dispersos en:

- `src/types/` (carpeta)
- `src/types.ts` (archivo suelto)
- Inline en `server/routes/manga.ts`

**Solución:**  
Una estructura clara con re-exports.

**Estructura:**

```
src/
├── types/
│   ├── index.ts              # Re-exports todo
│   ├── manga.types.ts        # Manga, Chapter, etc.
│   ├── user.types.ts         # User, Settings
│   ├── api.types.ts          # API responses
│   └── database.types.ts     # Generado por Supabase CLI
```

**Comando para generar types de Supabase:**

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

**Esfuerzo:** Bajo (1-2 horas)  
**Impacto:** Medio

---

## 🟢 Prioridad Baja (Futuro)

### 6. TanStack Query — Cache y estado de servidor

**Problema:**  
Probablemente usando `useState` + `useEffect` para fetching sin cache.

**Solución:**  
Adoptar TanStack Query para manejo de servidor state.

**Ejemplo:**

```typescript
// hooks/queries/useMangaList.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mangaApi } from '../services/api/manga.api';

export const mangaKeys = {
  all: ['mangas'] as const,
  list: (userId: string) => [...mangaKeys.all, 'list', userId] as const,
  detail: (id: string) => [...mangaKeys.all, 'detail', id] as const,
};

export const useMangaList = (userId: string) => {
  return useQuery({
    queryKey: mangaKeys.list(userId),
    queryFn: () => mangaApi.list(userId).then(r => r.data.mangas),
    staleTime: 1000 * 60 * 5, // 5 min cache
    refetchOnWindowFocus: false,
  });
};

export const useAddManga = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ url, userId }: { url: string; userId: string }) =>
      mangaApi.add(url, userId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.list(userId) });
    },
  });
};

export const useDeleteManga = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ mangaId, userId }: { mangaId: string; userId: string }) =>
      mangaApi.delete(mangaId, userId),
    onMutate: async ({ mangaId, userId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: mangaKeys.list(userId) });
      
      const previous = queryClient.getQueryData(mangaKeys.list(userId));
      
      queryClient.setQueryData(mangaKeys.list(userId), (old: Manga[]) =>
        old?.filter(m => m.id !== mangaId)
      );
      
      return { previous };
    },
    onError: (_, { userId }, context) => {
      // Rollback on error
      queryClient.setQueryData(mangaKeys.list(userId), context?.previous);
    },
  });
};
```

**Esfuerzo:** Alto (refactor grande)  
**Impacto:** Alto

---

## 📋 Checklist de Implementación

| # | Mejora | Prioridad | Esfuerzo | Status |
|---|--------|-----------|----------|--------|
| 1 | Repository Layer | 🔴 Alta | Medio | ⬜ Pendiente |
| 2 | Error Handler Global | 🔴 Alta | Bajo | ⬜ Pendiente |
| 3 | API Client Layer | 🟡 Media | Bajo | ⬜ Pendiente |
| 4 | Environment Validation | 🟡 Media | Bajo | ⬜ Pendiente |
| 5 | Consolidar Types | 🟡 Media | Bajo | ⬜ Pendiente |
| 6 | TanStack Query | 🟢 Baja | Alto | ⬜ Pendiente |

---

## 🎯 Próximos Pasos Recomendados

1. **Empezar por #2 (Error Handler)** — Bajo esfuerzo, alto impacto inmediato
2. **Luego #4 (Env Validation)** — Previene errores en producción
3. **Después #1 (Repository Layer)** — Fundación para tests
4. **Finalmente #3 y #6** — Mejoras de frontend

---

> **Nota:** Este documento se actualizará a medida que se implementen las mejoras.
