# 📚 Manga Tracker & Scraper

Una aplicación web moderna (PWA) para rastrear tus mangas favoritos, recibir notificaciones de nuevos capítulos y mantener tu biblioteca organizada automáticamente mediante Inteligencia Artificial.

![Manga Tracker Preview](public/favicon.svg) <!-- Puedes reemplazar esto con una captura de pantalla real más tarde -->

## ✨ Características

-   **Scraping Inteligente Híbrido:**
    -   **Nivel 1 (Rápido & Gratis):** Intenta obtener datos directamente del HTML usando Axios + Google Gemini.
    -   **Nivel 2 (Robusto):** Si falla (por bloqueos o SPAs complejas), usa automáticamente **Firecrawl** para navegar como un humano.
    -   **Smart Cache:** "Aprende" qué estrategia funciona mejor para cada sitio y la recuerda para la próxima vez.
-   **Gestión de Biblioteca:** Agrega mangas desde cualquier URL compatible (MangaPlus, LectorManga, Webtoons, etc.).
-   **IA Powered:** Utiliza **Gemini 2.0 Flash** para analizar y extraer información (Título, Portada, Capítulos) de cualquier estructura web, sin selectores CSS frágiles.
-   **Notificaciones Push:** Recibe alertas cuando salen nuevos capítulos (Soporte PWA).
-   **Personalización:**
    -   Modo Oscuro / Claro.
    -   Edición personalizada de Títulos y Portadas (sin afectar a otros usuarios).
-   **Stack Moderno:** React 18, Vite, TailwindCSS, Supabase (Auth & DB), Node.js Express.

## 🛠️ Tecnologías

-   **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons, PWA.
-   **Backend:** Node.js, Express (Serverless ready para Vercel).
-   **Base de Datos & Auth:** Supabase.
-   **IA & Scraping:** Google Gemini AI, Firecrawl.

## 🚀 Instalación y Configuración

### Prerrequisitos
-   Node.js 18+
-   Cuenta en [Supabase](https://supabase.com)
-   API Key de [Google Gemini](https://ai.google.dev/)
-   API Key de [Firecrawl](https://firecrawl.dev) (Opcional, recomendado para sitios difíciles)

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/john2k2/manga-tracker.git
    cd manga-tracker
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Copia el archivo de ejemplo y rellénalo con tus claves:
    ```bash
    cp .env.example .env
    ```
    *(No olvides configurar la autenticación de Google y Email en tu panel de Supabase)*

4.  **Base de Datos:**
    Ejecuta el script SQL ubicado en `supabase/migrations/` en el SQL Editor de tu proyecto de Supabase para crear las tablas necesarias.

5.  **Correr en desarrollo:**
    ```bash
    npm run dev
    ```
    Esto iniciará tanto el Frontend (Vite) como el Backend (Express) concurrentemente.

## 📦 Despliegue en Vercel

Este proyecto está configurado para desplegarse fácilmente en Vercel.

1.  Importa el repo en Vercel.
2.  Configura las **Environment Variables** (copia las de tu `.env`).
3.  ¡Deploy! 🚀

El archivo `vercel.json` se encarga de redirigir las peticiones `/api/*` al servidor Express.

## 🔒 Seguridad

El proyecto utiliza un modelo de seguridad donde:
-   Las claves sensibles (`SERVICE_ROLE`, `GEMINI_KEY`) nunca se exponen al cliente.
-   La edición de datos sensibles de mangas es personal (`user_manga_settings`) para evitar vandalismo.

## 📝 Licencia

MIT
