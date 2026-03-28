import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log, info, warn, error } from '../../src/utils/logger.js';

describe('Logger utils', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages to console.log', () => {
    info('test info message');
    expect(console.log).toHaveBeenCalledWith('[fdk:info] test info message');
  });

  it('should log warn messages to console.warn', () => {
    warn('test warn message');
    expect(console.warn).toHaveBeenCalledWith('[fdk:warn] test warn message');
  });

  it('should log error messages to console.error', () => {
    error('test error message');
    expect(console.error).toHaveBeenCalledWith('[fdk:error] test error message');
  });

  it('should prefix all log messages with level', () => {
    log('debug', 'debug message');
    expect(console.log).toHaveBeenCalledWith('[fdk:debug] debug message');
  });
});
