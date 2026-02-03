import { describe, it, expect, vi } from 'vitest';
import { LogStream } from '../src/log-stream.js';
import type { LogLine } from '../src/log-stream.js';

function makeLine(message: string): LogLine {
  return { timestamp: new Date(), message };
}

class MockLogStream extends LogStream {
  private batches: LogLine[][];
  private callIndex = 0;

  constructor(batches: LogLine[][]) {
    super();
    this.batches = batches;
  }

  protected async fetchNextLines(): Promise<LogLine[]> {
    if (this.callIndex >= this.batches.length) return [];
    return this.batches[this.callIndex++];
  }
}

describe('LogStream', () => {
  it('yields all log lines from fetchNextLines', async () => {
    const lines = [makeLine('line 1'), makeLine('line 2'), makeLine('line 3')];
    const stream = new MockLogStream([lines]);

    const collected: LogLine[] = [];
    for await (const line of stream) {
      collected.push(line);
    }

    expect(collected).toEqual(lines);
  });

  it('handles multiple batches of lines', async () => {
    const batch1 = [makeLine('batch1-a'), makeLine('batch1-b')];
    const batch2 = [makeLine('batch2-a')];
    const stream = new MockLogStream([batch1, batch2]);

    const collected: LogLine[] = [];
    for await (const line of stream) {
      collected.push(line);
    }

    expect(collected).toEqual([...batch1, ...batch2]);
  });

  it('close() stops iteration', async () => {
    // Stream that always returns lines — would iterate forever without close()
    const repeatingLine = makeLine('repeating');
    let fetchCount = 0;

    class InfiniteLogStream extends LogStream {
      protected async fetchNextLines(): Promise<LogLine[]> {
        fetchCount++;
        return [repeatingLine];
      }
    }

    const stream = new InfiniteLogStream();

    const collected: LogLine[] = [];
    for await (const line of stream) {
      collected.push(line);
      if (collected.length >= 3) {
        stream.close();
      }
    }

    expect(collected.length).toBe(3);
    expect(stream.isClosed).toBe(true);
  });

  it('isClosed returns false initially and true after close()', () => {
    const stream = new MockLogStream([]);

    expect(stream.isClosed).toBe(false);

    stream.close();

    expect(stream.isClosed).toBe(true);
  });

  it('stops iteration when fetchNextLines returns empty after previously returning lines', async () => {
    vi.useFakeTimers();

    const batch = [makeLine('only batch')];
    // First call returns lines, second call returns empty → should stop
    const stream = new MockLogStream([batch]);

    const collected: LogLine[] = [];
    for await (const line of stream) {
      collected.push(line);
    }

    expect(collected).toEqual(batch);

    vi.useRealTimers();
  });
});
