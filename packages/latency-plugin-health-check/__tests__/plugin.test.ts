import { describe, it, expect, beforeEach } from 'vitest';
import { HealthCheckPlugin } from '../src/plugin.js';

describe('HealthCheckPlugin', () => {
  let plugin: HealthCheckPlugin;

  beforeEach(() => {
    plugin = new HealthCheckPlugin({ timeoutMs: 1_000 });
  });

  describe('getHealth()', () => {
    it('returns healthy with no contributors', async () => {
      const result = await plugin.getHealth();

      expect(result.status).toBe('healthy');
      expect(result.checks).toEqual([]);
      expect(result.version).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('returns healthy when all contributors are healthy', async () => {
      plugin.registerContributor('db', async () => ({
        name: 'db',
        status: 'healthy',
        message: 'Connected',
      }));
      plugin.registerContributor('cache', async () => ({
        name: 'cache',
        status: 'healthy',
        message: 'Ready',
      }));

      const result = await plugin.getHealth();

      expect(result.status).toBe('healthy');
      expect(result.checks).toHaveLength(2);
      expect(result.checks.every((c) => c.status === 'healthy')).toBe(true);
    });

    it('returns degraded when a contributor is degraded', async () => {
      plugin.registerContributor('db', async () => ({
        name: 'db',
        status: 'healthy',
      }));
      plugin.registerContributor('cache', async () => ({
        name: 'cache',
        status: 'degraded',
        message: 'High latency',
      }));

      const result = await plugin.getHealth();

      expect(result.status).toBe('degraded');
    });

    it('returns unhealthy when any contributor is unhealthy', async () => {
      plugin.registerContributor('db', async () => ({
        name: 'db',
        status: 'healthy',
      }));
      plugin.registerContributor('cache', async () => ({
        name: 'cache',
        status: 'degraded',
      }));
      plugin.registerContributor('api', async () => ({
        name: 'api',
        status: 'unhealthy',
        message: 'Connection refused',
      }));

      const result = await plugin.getHealth();

      expect(result.status).toBe('unhealthy');
    });

    it('includes duration for each check', async () => {
      plugin.registerContributor('fast', async () => ({
        name: 'fast',
        status: 'healthy',
      }));

      const result = await plugin.getHealth();

      expect(result.checks[0].duration).toBeDefined();
      expect(result.checks[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('includes version and timestamp', async () => {
      const result = await plugin.getHealth();

      expect(result.version).toBe('0.1.0');
      expect(() => new Date(result.timestamp)).not.toThrow();
    });
  });

  describe('timeout handling', () => {
    it('marks timed-out contributors as unhealthy', async () => {
      const shortTimeoutPlugin = new HealthCheckPlugin({ timeoutMs: 50 });

      shortTimeoutPlugin.registerContributor('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { name: 'slow', status: 'healthy' };
      });

      const result = await shortTimeoutPlugin.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.checks[0].status).toBe('unhealthy');
      expect(result.checks[0].message).toContain('timed out');
    });

    it('marks throwing contributors as unhealthy', async () => {
      plugin.registerContributor('broken', async () => {
        throw new Error('Connection failed');
      });

      const result = await plugin.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.checks[0].status).toBe('unhealthy');
      expect(result.checks[0].message).toBe('Connection failed');
    });
  });

  describe('registerContributor()', () => {
    it('replaces contributor with same name', async () => {
      plugin.registerContributor('db', async () => ({
        name: 'db',
        status: 'unhealthy',
      }));
      plugin.registerContributor('db', async () => ({
        name: 'db',
        status: 'healthy',
      }));

      const result = await plugin.getHealth();

      expect(result.checks).toHaveLength(1);
      expect(result.checks[0].status).toBe('healthy');
    });
  });
});
