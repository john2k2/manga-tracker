
# Guía de Integración y Mantenimiento de Fuentes de Manga

Esta guía establece los estándares y procedimientos para agregar, validar y mantener fuentes de manga en el sistema.

## 1. Verificación Automática (Validation Tool)

El sistema incluye una herramienta de validación automática accesible en `/admin`. 
Antes de considerar una fuente como "soportada", debe pasar la validación con la siguiente URL de prueba.

### Criterios de Validación
El script valida automáticamente:
- **Título**: Debe extraerse correctamente.
- **Portada**: Debe ser una URL absoluta y accesible (status 200).
- **Capítulos**:
  - Debe encontrar al menos 1 capítulo.
  - Los números de capítulo deben ser numéricos (no -1).
  - El orden debe ser descendente.
  - Las URLs de los capítulos deben ser absolutas.

## 2. Mecanismo de Detección de Errores

El sistema registra automáticamente cada intento de scraping en la base de datos (`scrape_logs`).
El panel de administración (`/admin`) muestra métricas de salud por dominio:
- **Success Rate**: Debe mantenerse sobre 90%.
- **Avg Duration**: Idealmente bajo 10s.

### Alertas
- **Error Crítico**: Si un dominio cae por debajo del 50% de éxito en 24h.
- **Error de Contenido**: Si se detectan múltiples capítulos con número `-1`.

## 3. Protocolo de Corrección de Errores

Cuando se detecta un error o un usuario reporta un problema:

1. **Reproducción**: Usar la herramienta de Validación en `/admin` con la URL reportada.
2. **Diagnóstico**:
   - **403/401**: Bloqueo de bot. Solución: Revisar Firecrawl settings o rotar IPs.
   - **Data Faltante**: La estructura HTML cambió. Solución: Ajustar `scraper.ts` y posiblemente agregar una "Acción" de Firecrawl (click/scroll).
   - **Orden Incorrecto**: El sitio usa orden ascendente por defecto. Solución: Agregar acción de click en botón de ordenamiento (ver ejemplo `manhwaweb.com` en código).

### Tiempos de Respuesta (SLA)
- **Bloqueo Total del Sitio**: < 4 horas.
- **Capítulos Faltantes**: < 24 horas.
- **Metadatos Incorrectos (Portada/Título)**: < 48 horas.

## 4. Guía para Agregar Nuevas Fuentes

Al agregar soporte específico para un nuevo dominio (si requiere lógica custom):

1. **Analizar el Sitio**:
   - ¿Carga contenido dinámicamente? -> Requiere `actions` (wait/click).
   - ¿Tiene botón de "Mostrar más" o "Invertir orden"? -> Agregar a `getScrapeOptions` en `scraper.ts`.

2. **Implementación**:
   - Modificar `api/services/scraper.ts`.
   - Agregar condición `if (domain.includes('new-site.com'))`.
   - Definir selectores CSS para acciones si es necesario.

3. **Testing**:
   - Ejecutar validación manual en `/admin`.
   - Verificar que `cleanMarkdown` no elimine contenido vital.

## 5. Prevención

- **Tests Periódicos**: El sistema ejecuta validaciones aleatorias diariamente (TODO).
- **Control de Cambios**: Cualquier cambio en `scraper.ts` debe ser validado contra los 3 sitios principales antes de deploy.
