import type {
  PluginContext,
} from '@generacy-ai/latency';
import type {
  HealthCheck,
  HealthCheckResult,
  HealthContributor,
  HealthStatus,
  HealthStatusLevel,
} from '@generacy-ai/latency';

const VERSION = '0.1.0';
const DEFAULT_TIMEOUT_MS = 5_000;
const startTime = Date.now();

/**
 * Status severity order for "worst wins" aggregation.
 */
const STATUS_SEVERITY: Record<HealthStatusLevel, number> = {
  healthy: 0,
  degraded: 1,
  unhealthy: 2,
};

/**
 * Default implementation of the HealthCheck facet.
 *
 * Aggregates results from registered contributors and returns
 * composite health status. Each contributor runs with a timeout
 * to prevent hanging checks from blocking the health response.
 */
export class HealthCheckPlugin implements HealthCheck {
  private readonly contributors = new Map<string, HealthContributor>();
  private readonly timeoutMs: number;

  constructor(options?: { timeoutMs?: number }) {
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async getHealth(): Promise<HealthStatus> {
    const checks = await this.runContributors();
    const status = this.aggregateStatus(checks);

    return {
      status,
      uptime: Math.floor((Date.now() - startTime) / 1_000),
      version: VERSION,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  registerContributor(name: string, contributor: HealthContributor): void {
    this.contributors.set(name, contributor);
  }

  private async runContributors(): Promise<HealthCheckResult[]> {
    const entries = Array.from(this.contributors.entries());
    if (entries.length === 0) {
      return [];
    }

    return Promise.all(
      entries.map(([name, contributor]) => this.runWithTimeout(name, contributor)),
    );
  }

  private async runWithTimeout(
    name: string,
    contributor: HealthContributor,
  ): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const result = await Promise.race([
        contributor(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timed out')), this.timeoutMs),
        ),
      ]);
      return {
        ...result,
        name,
        duration: Date.now() - start,
      };
    } catch (err) {
      return {
        name,
        status: 'unhealthy',
        message: err instanceof Error ? err.message : String(err),
        duration: Date.now() - start,
      };
    }
  }

  private aggregateStatus(checks: HealthCheckResult[]): HealthStatusLevel {
    if (checks.length === 0) {
      return 'healthy';
    }

    let worst: HealthStatusLevel = 'healthy';
    for (const check of checks) {
      if (STATUS_SEVERITY[check.status] > STATUS_SEVERITY[worst]) {
        worst = check.status;
      }
    }
    return worst;
  }
}

/**
 * Plugin activation function.
 * Registers the HealthCheckPlugin as the HealthCheck facet provider.
 */
export function activate(ctx: PluginContext): void {
  const plugin = new HealthCheckPlugin();
  ctx.provide<HealthCheck>('HealthCheck', plugin);
  ctx.logger.info('Health check plugin activated');
}
