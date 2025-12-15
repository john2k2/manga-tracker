/**
 * Structured Logger for Manga Tracker API
 * Provides consistent, parseable log output for debugging and monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

// Default to 'info' in production, 'debug' in development
const CURRENT_LEVEL = (process.env.LOG_LEVEL as LogLevel) ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
}

function formatEntry(entry: LogEntry): string {
    // In production, output JSON for log aggregation
    if (process.env.NODE_ENV === 'production') {
        return JSON.stringify(entry);
    }

    // In development, output human-readable format
    const levelEmoji: Record<LogLevel, string> = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
    };

    const emoji = levelEmoji[entry.level];
    const time = new Date(entry.timestamp).toLocaleTimeString();
    let output = `${emoji} [${time}] ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
        output += ` ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
        output += `\n   Error: ${entry.error.message}`;
        if (entry.error.stack && process.env.NODE_ENV !== 'production') {
            output += `\n   ${entry.error.stack.split('\n').slice(1, 4).join('\n   ')}`;
        }
    }

    return output;
}

function createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message
    };

    if (context) {
        entry.context = context;
    }

    if (error) {
        entry.error = {
            message: error.message,
            stack: error.stack,
            code: (error as NodeJS.ErrnoException).code
        };
    }

    return entry;
}

function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!shouldLog(level)) return;

    const entry = createLogEntry(level, message, context, error);
    const formatted = formatEntry(entry);

    switch (level) {
        case 'error':
            console.error(formatted);
            break;
        case 'warn':
            console.warn(formatted);
            break;
        default:
            console.log(formatted);
    }
}

// ============================================================================
// Public API
// ============================================================================

export const logger = {
    debug(message: string, context?: LogContext): void {
        log('debug', message, context);
    },

    info(message: string, context?: LogContext): void {
        log('info', message, context);
    },

    warn(message: string, context?: LogContext): void {
        log('warn', message, context);
    },

    error(message: string, error?: Error | unknown, context?: LogContext): void {
        const err = error instanceof Error ? error : new Error(String(error));
        log('error', message, context, err);
    },

    /**
     * Create a child logger with default context
     */
    child(defaultContext: LogContext) {
        return {
            debug: (message: string, context?: LogContext) =>
                logger.debug(message, { ...defaultContext, ...context }),
            info: (message: string, context?: LogContext) =>
                logger.info(message, { ...defaultContext, ...context }),
            warn: (message: string, context?: LogContext) =>
                logger.warn(message, { ...defaultContext, ...context }),
            error: (message: string, error?: Error | unknown, context?: LogContext) =>
                logger.error(message, error, { ...defaultContext, ...context })
        };
    },

    /**
     * Log HTTP request (for middleware)
     */
    request(method: string, path: string, statusCode: number, durationMs: number): void {
        const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        log(level, `${method} ${path}`, { statusCode, durationMs });
    },

    /**
     * Log scraping operations
     */
    scrape: {
        start(url: string, strategy: string): void {
            logger.info('Scrape started', { url, strategy });
        },
        success(url: string, strategy: string, chaptersFound: number): void {
            logger.info('Scrape completed', { url, strategy, chaptersFound });
        },
        fail(url: string, strategy: string, error: Error): void {
            logger.error('Scrape failed', error, { url, strategy });
        },
        fallback(url: string, from: string, to: string): void {
            logger.warn('Scrape fallback', { url, from, to });
        }
    },

    /**
     * Log scheduled jobs
     */
    scheduler: {
        start(jobName: string): void {
            logger.info('Scheduler job started', { job: jobName });
        },
        complete(jobName: string, processed: number, duration: number): void {
            logger.info('Scheduler job completed', { job: jobName, processed, durationMs: duration });
        },
        skip(mangaTitle: string, reason: string): void {
            logger.debug('Manga check skipped', { manga: mangaTitle, reason });
        },
        newChapters(mangaTitle: string, count: number): void {
            logger.info('New chapters found', { manga: mangaTitle, newChapters: count });
        }
    }
};

export default logger;
