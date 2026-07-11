import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { explainBlock, selectNode, type BlockReason } from '@dstl/simulation';
import type { ItemKind, NodeKind, RoutingStrategy } from '@dstl/domain';
import { Board } from './board.js';
import {
  createGameSession,
  SPEEDS,
  type GameSession,
  type InteractionMode,
  type Point,
} from './session.js';

const GOALS = [10, 30, 50] as const;
interface BuildOption {
  readonly kind: NodeKind;
  readonly label: string;
  readonly outputKind?: ItemKind;
  readonly recipeId?: string;
}
const BUILDABLE: readonly BuildOption[] = [
  { kind: 'source', label: 'Place ore source' },
  { kind: 'advanced-producer', label: 'Place maze producer' },
  { kind: 'source', label: 'Place coal source', outputKind: 'coal' },
  { kind: 'processor', label: 'Place processor' },
  { kind: 'processor', label: 'Place gear assembler', recipeId: 'assemble-gear' },
  { kind: 'storage', label: 'Place storage' },
  { kind: 'warehouse', label: 'Place warehouse' },
  { kind: 'router', label: 'Place router' },
  { kind: 'seller', label: 'Place seller' },
];

export function GameApp() {
  const sessionRef = useRef<GameSession | null>(null);
  if (sessionRef.current === null) sessionRef.current = createGameSession();
  const session = sessionRef.current;
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  const [buildOption, setBuildOption] = useState<BuildOption>(
    BUILDABLE[2] ?? { kind: 'processor', label: 'Place processor' },
  );
  const [wideLine, setWideLine] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  useAnimationFrame(session);

  const chooseBuild = (option: BuildOption): void => {
    setBuildOption(option);
    setConnectFrom(null);
    session.setMode('place');
  };
  const chooseMode = (mode: InteractionMode): void => {
    setConnectFrom(null);
    session.setMode(mode);
  };
  const place = (position: Point): void => {
    session.placeNode(buildOption.kind, position, buildOption.outputKind, buildOption.recipeId);
  };
  const connect = (from: string, to: string): boolean => {
    const connected = session.connect(from, to, wideLine ? 3 : 1);
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
    <main className={reducedMotion ? 'game-shell reduced-motion' : 'game-shell'}>
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
        <label className="motion-setting">
          <input
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
            type="checkbox"
          />
          Reduce motion
        </label>
      </header>
      <aside aria-label="Chapter tutorial" className="chapter-tutorial">
        <strong>Chapter 1 · First maze line</strong>
        <p>
          Place a maze producer, connect it to a processor, then observe its deterministic output.
        </p>
      </aside>
      <aside aria-label="Build drawer" className="build-drawer">
        <h2>Build</h2>
        {BUILDABLE.map((option) => (
          <button
            className={
              snapshot.ui.mode === 'place' && buildOption.label === option.label ? 'active' : ''
            }
            key={option.label}
            onClick={() => chooseBuild(option)}
            type="button"
          >
            {option.label}
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
          aria-pressed={wideLine}
          className={wideLine ? 'active' : ''}
          onClick={() => setWideLine(!wideLine)}
          type="button"
        >
          Wide line
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
        {selectedNodeId === null ? null : (
          <StrategyControls
            nodeId={selectedNodeId}
            onRoute={session.setRouting}
            onSell={session.sellNode}
            onUpgrade={session.upgradeNode}
          />
        )}
        <span>
          {connectFrom === null ? 'Select a mode.' : `Connect ${connectFrom} to a target.`}
        </span>
      </nav>
    </main>
  );
}

function StrategyControls({
  nodeId,
  onRoute,
  onSell,
  onUpgrade,
}: {
  readonly nodeId: string;
  readonly onRoute: (id: string, strategy: RoutingStrategy) => boolean;
  readonly onSell: (id: string) => boolean;
  readonly onUpgrade: (id: string) => boolean;
}) {
  return (
    <>
      <button onClick={() => onUpgrade(nodeId)} type="button">
        Upgrade
      </button>
      <button onClick={() => onSell(nodeId)} type="button">
        Sell / refund
      </button>
      {(['overflow', 'priority', 'even'] as const).map((strategy) => (
        <button key={strategy} onClick={() => onRoute(nodeId, strategy)} type="button">
          Route {strategy}
        </button>
      ))}
    </>
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
