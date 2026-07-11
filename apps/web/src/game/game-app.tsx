import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Board } from './board.js';
import { createGameSession, type GameSession } from './session.js';

export function GameApp() {
  const sessionRef = useRef<GameSession | null>(null);
  if (sessionRef.current === null) sessionRef.current = createGameSession();
  const session = sessionRef.current;
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  useAnimationFrame(session);

  return (
    <main className="game-shell">
      <header className="game-heading">
        <p className="eyebrow">PLAYABLE P0 · DETERMINISTIC FACTORY</p>
        <h1>Don&apos;t Stop The Line</h1>
        <p>Place a processor between the free source and seller, then connect the ports.</p>
      </header>
      <Board factory={snapshot.factory} onSelect={session.setSelectedNode} ui={snapshot.ui} />
    </main>
  );
}

function useAnimationFrame(session: GameSession): void {
  useEffect(() => {
    let frameId = 0;
    let previous = performance.now();
    const frame = (now: number): void => {
      session.advanceFrame(Math.min(now - previous, 1000));
      previous = now;
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [session]);
}
