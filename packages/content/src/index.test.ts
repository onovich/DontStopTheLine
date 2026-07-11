import { describe, expect, it } from 'vitest';
import { hasValidStarterContent, starterRecipe } from '@dstl/content';
import { isValidRecipe } from '@dstl/domain';

describe('starter content', () => {
  it('uses a valid recipe and node catalog', () => {
    expect(isValidRecipe(starterRecipe)).toBe(true);
    expect(hasValidStarterContent()).toBe(true);
  });
});
