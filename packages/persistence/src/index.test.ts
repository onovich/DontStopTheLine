import { describe, expect, it } from 'vitest';
import { createFactory } from '@dstl/simulation';
import { createSave, exportSave, importSave } from '@dstl/persistence';

describe('versioned save', () => {
  it('round-trips a simulation snapshot and preferences', () => {
    const save = createSave(createFactory(9), { reducedMotion: true, speed: 2 });
    expect(importSave(exportSave(save))).toEqual({ ok: true, save });
  });

  it('rejects damaged and unsupported saves', () => {
    expect(importSave('{bad')).toEqual({ ok: false, reason: 'CORRUPT' });
    expect(importSave(JSON.stringify({ schemaVersion: 99, factory: {}, ui: {} }))).toEqual({
      ok: false,
      reason: 'UNSUPPORTED_VERSION',
    });
  });
});
