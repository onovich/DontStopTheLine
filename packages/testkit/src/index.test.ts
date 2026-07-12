import { describe, expect, it } from 'vitest';
import { goldenSnapshot, runProfitChain, runThousandNodeBenchmark } from '@dstl/testkit';

describe('profit chain fixture', () => {
  it('is deterministic and earns money', () => {
    expect(runProfitChain().money).toBeGreaterThan(0);
    expect(goldenSnapshot()).toBe(goldenSnapshot());
  });
});

describe('performance baseline', () => {
  it('replays a fixed 1,000-node scenario', () => {
    const report = runThousandNodeBenchmark();
    expect(report.nodeCount).toBe(1000);
    expect(report.tick).toBe(20);
  });
});
