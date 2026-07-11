import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { explainBlock, selectNode, type BlockReason } from '@dstl/simulation';
import type { NodeKind } from '@dstl/domain';
import { Board } from './board.js';
import {
  createGameSession,
  SPEEDS,
  type GameSession,
  type InteractionMode,
  type Point,
} from './session.js';

const GOALS = [10, 30, 50] as const;
const BUILDABLE: readonly NodeKind[] = ['processor', 'storage', 'seller'];

export function GameApp() {
  const sessionRef = useRef<GameSession | null>(null);
  if (sessionRef.current === null) sessionRef.current = createGameSession();
  const session = sessionRef.current;
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  const [buildKind, setBuildKind] = useState<NodeKind>('processor');
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  useAnimationFrame(session);

  const chooseBuild = (kind: NodeKind): void => {
    setBuildKind(kind);
    setConnectFrom(null);
    session.setMode('place');
  };
  const chooseMode = (mode: InteractionMode): void => {
    setConnectFrom(null);
    session.setMode(mode);
  };
  const place = (position: Point): void => {
    session.placeNode(buildKind, position);
  };
  const connect = (from: string, to: string): boolean => {
    const connected = session.connect(from, to);
    setConnectFrom(null);
    session.setMode('select');
    return connected;
  };
  const select = (nodeId: string): void => {
    if (snapshot.ui.mode === 'connect') {
      setConnectFrom(nodeId);
      return;
    }
    if (snapshot.ui.mode === 'demolish') {
      session.removeNode(nodeId);
      return;
    }
    session.setSelectedNode(nodeId);
  };
  const nextGoal = GOALS.find((goal) => goal > snapshot.statistics.money) ?? GOALS.at(-1) ?? 50;
  const selectedNodeId = snapshot.ui.selectedNodeId;
  const selected = selectedNodeId === null ? null : selectNode(snapshot.factory, selectedNodeId);
  const selectedState =
    selectedNodeId === null ? undefined : snapshot.factory.nodes[selectedNodeId];

  return (
    <main className="game-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">PLAYABLE P0 · DETERMINISTIC FACTORY</p>
          <h1>Don&apos;t Stop The Line</h1>
        </div>
        <div className="money">
          $ {snapshot.statistics.money}
          <small>next goal {nextGoal}</small>
        </div>
        <GoalProgress money={snapshot.statistics.money} />
      </header>
      <aside aria-label="Build drawer" className="build-drawer">
        <h2>Build</h2>
        {BUILDABLE.map((kind) => (
          <button
            className={snapshot.ui.mode === 'place' && buildKind === kind ? 'active' : ''}
            key={kind}
            onClick={() => chooseBuild(kind)}
            type="button"
          >
            Place {kind}
          </button>
        ))}
        <p>Choose a module, then click a free grid cell.</p>
      </aside>
      <section className="board-wrap">
        <Board
          connectFrom={connectFrom}
          factory={snapshot.factory}
          mode={snapshot.ui.mode}
          onConnect={connect}
          onMove={session.moveNode}
          onPlace={place}
          onSelect={select}
          ui={snapshot.ui}
        />
      </section>
      <aside aria-label="Inspector" className="inspector">
        <h2>Inspector</h2>
        {selected === null || selectedState === undefined ? (
          <p>Select a node to inspect its buffers and status.</p>
        ) : (
          <>
            <strong>{selected.id}</strong>
            <p>
              Input {selected.inputCount}/2 · Output {selected.outputCount}/2
            </p>
            <p>
              Reserved {selected.reserved} · Working {selectedState.workItem ?? 'no'}
            </p>
            {selected.block === null ? (
              <p className="status-ok">Ready to work.</p>
            ) : (
              <>
                <p className="status-blocked">
                  {selected.block}: {explainBlock(selected.block)}
                </p>
                <p>{suggestion(selected.block)}</p>
              </>
            )}
          </>
        )}
      </aside>
      <nav aria-label="Factory controls" className="control-bar">
        <button onClick={() => session.setPaused(!snapshot.paused)} type="button">
          {snapshot.paused ? 'Resume' : 'Pause'}
        </button>
        {SPEEDS.map((speed) => (
          <button
            aria-pressed={snapshot.speed === speed}
            className={snapshot.speed === speed ? 'active' : ''}
            key={speed}
            onClick={() => session.setSpeed(speed)}
            type="button"
          >
            {speed}x
          </button>
        ))}
        <button
          className={snapshot.ui.mode === 'connect' ? 'active' : ''}
          onClick={() => chooseMode('connect')}
          type="button"
        >
          Connect
        </button>
        <button
          className={snapshot.ui.mode === 'demolish' ? 'active danger' : 'danger'}
          onClick={() => chooseMode('demolish')}
          type="button"
        >
          Demolish
        </button>
        <button
          disabled={!session.getSnapshot().ui.positions}
          onClick={() => session.undo()}
          type="button"
        >
          Undo
        </button>
        <span>
          {connectFrom === null ? 'Select a mode.' : `Connect ${connectFrom} to a target.`}
        </span>
      </nav>
    </main>
  );
}

function GoalProgress({ money }: { readonly money: number }) {
  return (
    <ol aria-label="Sales goals" className="goal-progress">
      {GOALS.map((goal) => (
        <li className={money >= goal ? 'complete' : ''} key={goal}>
          {money >= goal ? '✓' : '○'} {goal}
        </li>
      ))}
    </ol>
  );
}
function suggestion(block: BlockReason): string {
  const suggestions = {
    NO_INPUT: 'Connect a compatible source or storage output.',
    OUTPUT_FULL: 'Connect a consumer or add storage.',
    WORKING: 'Wait for this work cycle to finish.',
    NO_CONSUMER: 'Connect an accepting target.',
    TARGET_FULL: 'Wait for delivery or clear target capacity.',
    LINE_FULL: 'Wait for the item in transit.',
    RECIPE_MISMATCH: 'Connect compatible item kinds.',
    SELLER_BUSY: 'Wait for the sale to finish.',
  };
  return suggestions[block];
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
