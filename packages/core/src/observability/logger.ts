export type LogMeta = Record<string, unknown>;

export interface AuthLogger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}

/* eslint-disable no-console -- the default logger writes to the console */
export const consoleLogger: AuthLogger = {
  debug: (message, meta) => console.debug(`[keychain] ${message}`, meta ?? ''),
  info: (message, meta) => console.info(`[keychain] ${message}`, meta ?? ''),
  warn: (message, meta) => console.warn(`[keychain] ${message}`, meta ?? ''),
  error: (message, meta) => console.error(`[keychain] ${message}`, meta ?? ''),
};
/* eslint-enable no-console */

const SENSITIVE_KEY =
  /pass(word)?|token|secret|hash|code|link|cookie|authorization|payload|verifier/i;
const REDACTED = '[REDACTED]';

function serializeError(error: Error, depth: number): LogMeta {
  const errorCode = (error as { code?: unknown }).code;
  return {
    name: error.name,
    message: error.message,
    ...(typeof errorCode === 'string' && { errorCode }),
    ...(error.stack && { stack: error.stack }),
    ...(error.cause !== undefined && {
      cause: redactValue(error.cause, depth + 1),
    }),
  };
}

function redactValue(value: unknown, depth: number = 0): unknown {
  if (depth > 5) return '[Truncated]';
  if (value instanceof Error) return serializeError(value, depth);
  if (Array.isArray(value)) {
    return value.map(item => redactValue(item, depth + 1));
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? REDACTED : redactValue(item, depth + 1),
      ])
    );
  }
  return value;
}

export function redact(meta: LogMeta): LogMeta {
  return redactValue(meta) as LogMeta;
}

/** Wraps a host logger so secrets and tokens never reach it. */
export function createLogger(logger: AuthLogger = consoleLogger): AuthLogger {
  const wrap =
    (level: keyof AuthLogger) =>
    (message: string, meta?: LogMeta): void => {
      try {
        logger[level](message, meta && redact(meta));
      } catch {
        // A failing logger must never break authentication flows.
      }
    };
  return {
    debug: wrap('debug'),
    info: wrap('info'),
    warn: wrap('warn'),
    error: wrap('error'),
  };
}
