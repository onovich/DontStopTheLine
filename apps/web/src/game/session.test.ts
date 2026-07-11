import { describe, expect, it } from 'vitest';
import { createGameSession, LOGIC_TICK_MS } from './session.js';

describe('game session', () => {
  it('advances the authoritative simulation only through the fixed-step adapter', () => {
    const session = createGameSession(7);

    session.advanceFrame(LOGIC_TICK_MS - 1);
    expect(session.getSnapshot().factory.tick).toBe(0);

    session.advanceFrame(1);
    expect(session.getSnapshot().factory.tick).toBe(1);

    session.setPaused(true);
    session.advanceFrame(LOGIC_TICK_MS * 4);
    expect(session.getSnapshot().factory.tick).toBe(1);

    session.setPaused(false);
    session.setSpeed(2);
    session.advanceFrame(LOGIC_TICK_MS);
    expect(session.getSnapshot().factory.tick).toBe(3);
  });

  it('keeps layout interactions separate and makes them undoable', () => {
    const session = createGameSession();
    const processorId = session.placeNode('processor', { x: 480, y: 360 });

    expect(processorId).toBe('processor-3');
    expect(session.connect('source-1', processorId ?? '')).toBe(true);
    expect(session.getSnapshot().factory.lines['line-1']).toBeDefined();

    expect(session.undo()).toBe(true);
    expect(session.getSnapshot().factory.lines['line-1']).toBeUndefined();
    expect(session.undo()).toBe(true);
    expect(session.getSnapshot().factory.nodes['processor-3']).toBeUndefined();
  });
});
