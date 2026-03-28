export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function log(level: LogLevel, message: string): void {
  const prefix = `[fdk:${level}]`;
  if (level === 'error') {
    console.error(`${prefix} ${message}`);
  } else if (level === 'warn') {
    console.warn(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export function info(message: string): void {
  log('info', message);
}

export function warn(message: string): void {
  log('warn', message);
}

export function error(message: string): void {
  log('error', message);
}
