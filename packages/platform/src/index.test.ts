import { describe, expect, it } from 'vitest';
import { MemorySaveStorage } from '@dstl/platform';

describe('memory save storage', () => {
  it('stores, retrieves, and removes data behind the storage port', async () => {
    const storage = new MemorySaveStorage();
    await storage.save('slot', 'save');
    expect(await storage.load('slot')).toBe('save');
    await storage.remove('slot');
    expect(await storage.load('slot')).toBeNull();
  });
});
