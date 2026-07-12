import type { FactoryState } from '@dstl/simulation';

export const SAVE_SCHEMA_VERSION = 1;

export interface UiPreferences {
  readonly reducedMotion: boolean;
  readonly speed: 1 | 2 | 4;
}

export interface SaveGame {
  readonly contentVersion: string;
  readonly factory: FactoryState;
  readonly schemaVersion: typeof SAVE_SCHEMA_VERSION;
  readonly ui: UiPreferences;
}

export type LoadResult =
  | { readonly ok: true; readonly save: SaveGame }
  | { readonly ok: false; readonly reason: 'CORRUPT' | 'UNSUPPORTED_VERSION' };

export function createSave(
  factory: FactoryState,
  ui: UiPreferences,
  contentVersion = 'phase-5',
): SaveGame {
  return { contentVersion, factory, schemaVersion: SAVE_SCHEMA_VERSION, ui };
}

export function exportSave(save: SaveGame): string {
  return JSON.stringify(save);
}

export function importSave(serialized: string): LoadResult {
  try {
    const value: unknown = JSON.parse(serialized);
    return validateSave(value);
  } catch {
    return { ok: false, reason: 'CORRUPT' };
  }
}

export function validateSave(value: unknown): LoadResult {
  if (!isRecord(value) || !isRecord(value['factory']) || !isRecord(value['ui']))
    return { ok: false, reason: 'CORRUPT' };
  if (value['schemaVersion'] !== SAVE_SCHEMA_VERSION)
    return { ok: false, reason: 'UNSUPPORTED_VERSION' };
  if (typeof value['contentVersion'] !== 'string' || typeof value['factory']['tick'] !== 'number')
    return { ok: false, reason: 'CORRUPT' };
  if (
    typeof value['ui']['reducedMotion'] !== 'boolean' ||
    ![1, 2, 4].includes(value['ui']['speed'] as number)
  )
    return { ok: false, reason: 'CORRUPT' };
  return { ok: true, save: value as unknown as SaveGame };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
