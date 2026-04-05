type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function writeLog(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };

  const payload = JSON.stringify(entry);

  if (level === 'error') {
    console.error(payload);
    return;
  }

  if (level === 'warn') {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

export function logInfo(event: string, context: LogContext = {}) {
  writeLog('info', event, context);
}

export function logWarn(event: string, context: LogContext = {}) {
  writeLog('warn', event, context);
}

export function logError(event: string, context: LogContext = {}) {
  writeLog('error', event, context);
}
