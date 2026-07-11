import { describe, expect, it } from 'vitest';
import { goldenSnapshot, runProfitChain } from '@dstl/testkit';

describe('profit chain fixture', () => {
  it('is deterministic and earns money', () => {
    expect(runProfitChain().money).toBeGreaterThan(0);
    expect(goldenSnapshot()).toBe(goldenSnapshot());
  });
});
