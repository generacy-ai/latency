import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCacheEntry, isCacheExpired } from '../src/caching.js';

describe('createCacheEntry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('wraps value with current timestamp', () => {
    vi.setSystemTime(1000);
    const entry = createCacheEntry('hello');
    expect(entry.value).toBe('hello');
    expect(entry.cachedAt).toBe(1000);
  });

  it('works with object values', () => {
    const obj = { id: '1', name: 'test' };
    const entry = createCacheEntry(obj);
    expect(entry.value).toBe(obj);
  });
});

describe('isCacheExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false within TTL', () => {
    vi.setSystemTime(1000);
    const entry = createCacheEntry('value');

    vi.setSystemTime(1000 + 59999); // Just under 60s
    expect(isCacheExpired(entry, 60000)).toBe(false);
  });

  it('returns false at exactly TTL boundary', () => {
    vi.setSystemTime(1000);
    const entry = createCacheEntry('value');

    vi.setSystemTime(1000 + 60000); // Exactly 60s
    expect(isCacheExpired(entry, 60000)).toBe(false);
  });

  it('returns true after TTL expires', () => {
    vi.setSystemTime(1000);
    const entry = createCacheEntry('value');

    vi.setSystemTime(1000 + 60001); // Just over 60s
    expect(isCacheExpired(entry, 60000)).toBe(true);
  });

  it('works with custom timeout values', () => {
    vi.setSystemTime(0);
    const entry = createCacheEntry('value');

    vi.setSystemTime(5001);
    expect(isCacheExpired(entry, 5000)).toBe(true);
  });
});
