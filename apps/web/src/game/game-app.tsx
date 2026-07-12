import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { selectNode, type BlockReason } from '@dstl/simulation';
import type { ItemKind, NodeKind, RoutingStrategy } from '@dstl/domain';
import { Board } from './board.js';
import { GameHud } from './game-hud.js';
import {
  createGameSession,
  type GameSession,
  type InteractionMode,
  type Point,
} from './session.js';

interface BuildOption {
  readonly kind: NodeKind;
  readonly label: string;
  readonly outputKind?: ItemKind;
  readonly recipeId?: string;
}
const BUILDABLE: readonly BuildOption[] = [
  { kind: 'source', label: '铁矿源' },
  { kind: 'processor', label: '基础加工器' },
  { kind: 'seller', label: '售卖站' },
  { kind: 'storage', label: '缓冲仓' },
  { kind: 'warehouse', label: '大型仓库' },
  { kind: 'router', label: '分流器' },
  { kind: 'source', label: '煤矿源', outputKind: 'coal' },
  { kind: 'processor', label: '齿轮装配器', recipeId: 'assemble-gear' },
  { kind: 'advanced-producer', label: '迷宫生产机' },
];

export function GameApp() {
  const sessionRef = useRef<GameSession | null>(null);
  const buildDrawerCloseRef = useRef<HTMLButtonElement | null>(null);
  const buildToggleRef = useRef<HTMLButtonElement | null>(null);
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
  const [isBuildDrawerOpen, setBuildDrawerOpen] = useState(false);
  useAnimationFrame(session);
  useEffect(() => {
    if (!isBuildDrawerOpen) return;
    buildDrawerCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      setBuildDrawerOpen(false);
      requestAnimationFrame(() => buildToggleRef.current?.focus());
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isBuildDrawerOpen]);

  const chooseBuild = (option: BuildOption): void => {
    setBuildOption(option);
    setConnectFrom(null);
    setBuildDrawerOpen(false);
    session.setMode('place');
  };
  const chooseMode = (mode: InteractionMode): void => {
    setConnectFrom(null);
    session.setMode(mode);
  };
  const closeBuildDrawer = (): void => {
    setBuildDrawerOpen(false);
    requestAnimationFrame(() => buildToggleRef.current?.focus());
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
  const selectedNodeId = snapshot.ui.selectedNodeId;
  const selected = selectedNodeId === null ? null : selectNode(snapshot.factory, selectedNodeId);
  const selectedState =
    selectedNodeId === null ? undefined : snapshot.factory.nodes[selectedNodeId];
  const unlockedBuildOptions = BUILDABLE.filter((option) =>
    isBuildUnlocked(option, snapshot.statistics.money),
  );

  return (
    <main className={reducedMotion ? 'game-shell reduced-motion' : 'game-shell'}>
      <GameHud
        money={snapshot.statistics.money}
        onSetPaused={session.setPaused}
        onReducedMotionChange={setReducedMotion}
        onSetSpeed={session.setSpeed}
        paused={snapshot.paused}
        reducedMotion={reducedMotion}
        speed={snapshot.speed}
      />
      <aside aria-label="Chapter tutorial" className="chapter-tutorial">
        <strong>先让货物持续出售</strong>
        <p>从原料设备的输出端连到加工器，再接到售卖设备。</p>
      </aside>
      {isBuildDrawerOpen ? (
        <button
          aria-label="关闭建造目录"
          className="build-drawer-backdrop"
          onClick={closeBuildDrawer}
          type="button"
        />
      ) : null}
      <aside
        aria-label="建造目录"
        aria-modal="true"
        className={isBuildDrawerOpen ? 'build-drawer is-open' : 'build-drawer'}
        id="build-catalog"
        role="dialog"
      >
        <div className="drawer-heading">
          <div>
            <p className="eyebrow">建造</p>
            <h2>设备目录</h2>
          </div>
          <button
            className="drawer-close"
            onClick={closeBuildDrawer}
            ref={buildDrawerCloseRef}
            type="button"
          >
            收起
          </button>
        </div>
        {unlockedBuildOptions.map((option) => (
          <button
            className={
              snapshot.ui.mode === 'place' && buildOption.label === option.label ? 'active' : ''
            }
            key={option.label}
            onClick={() => chooseBuild(option)}
            type="button"
          >
            <strong>{option.label}</strong>
            <span>{buildDescription(option)}</span>
          </button>
        ))}
        <p>选择设备后，在画布空白网格中放置。完成一次出售会逐步开放更多设备。</p>
        <p className="locked-unlocks">
          解锁预告：$10 开放缓冲仓与煤矿；$30 开放仓库与分流；$50 开放齿轮与迷宫生产机。
        </p>
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
      {selected === null || selectedState === undefined ? null : (
        <aside aria-label="设备检查器" className="inspector">
          <h2>设备检查器</h2>
          <>
            <strong>{displayNodeName(selectedState.kind)}</strong>
            <p>
              输入 {selected.inputCount}/2 · 输出 {selected.outputCount}/2
            </p>
            <p>
              预留 {selected.reserved} · {selectedState.workItem === null ? '等待工作' : '正在加工'}
            </p>
            {selected.block === null ? (
              <p className="status-ok">状态正常，等待下一步。</p>
            ) : (
              <>
                <p className="status-blocked">{blockMessage(selected.block)}</p>
                <p>{suggestion(selected.block)}</p>
              </>
            )}
          </>
        </aside>
      )}
      <nav aria-label="Factory controls" className="control-bar">
        <button
          className={snapshot.ui.mode === 'connect' ? 'active' : ''}
          onClick={() => chooseMode('connect')}
          type="button"
        >
          连线
        </button>
        <button
          aria-pressed={wideLine}
          className={wideLine ? 'active' : ''}
          onClick={() => setWideLine(!wideLine)}
          type="button"
        >
          宽线路
        </button>
        <button
          className={snapshot.ui.mode === 'demolish' ? 'active danger' : 'danger'}
          onClick={() => chooseMode('demolish')}
          type="button"
        >
          拆除
        </button>
        <button
          disabled={!session.getSnapshot().ui.positions}
          onClick={() => session.undo()}
          type="button"
        >
          撤销
        </button>
        <button
          aria-expanded={isBuildDrawerOpen}
          aria-controls="build-catalog"
          className="build-drawer-toggle"
          onClick={() => setBuildDrawerOpen((open) => !open)}
          ref={buildToggleRef}
          type="button"
        >
          建造设备
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
          {connectFrom === null ? '从设备输出端拖到接收端，或选择连线工具。' : '选择一个接收设备。'}
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
        升级设备
      </button>
      <button onClick={() => onSell(nodeId)} type="button">
        出售并退款
      </button>
      {(['overflow', 'priority', 'even'] as const).map((strategy) => (
        <button key={strategy} onClick={() => onRoute(nodeId, strategy)} type="button">
          {routingLabel(strategy)}
        </button>
      ))}
    </>
  );
}

function suggestion(block: BlockReason): string {
  const suggestions = {
    NO_INPUT: '连接能提供所需原料的设备。',
    OUTPUT_FULL: '连接售卖站或加建缓冲仓。',
    WORKING: '等待本次加工完成。',
    NO_CONSUMER: '连接一个可以接收货物的设备。',
    TARGET_FULL: '等待目标腾出空间，或增加缓冲。',
    LINE_FULL: '线路正在运输，稍候再试。',
    RECIPE_MISMATCH: '这两个端口不能传递同一种货物。',
    SELLER_BUSY: '售卖站正在结算，稍候再试。',
  };
  return suggestions[block];
}
function blockMessage(block: BlockReason): string {
  const messages: Record<BlockReason, string> = {
    LINE_FULL: '线路已满：货物正在运输。',
    NO_CONSUMER: '没有接收设备：输出端尚未连线。',
    NO_INPUT: '缺少原料：输入端尚未收到货物。',
    OUTPUT_FULL: '无法继续输出：请连接售卖站或缓冲仓。',
    RECIPE_MISMATCH: '连接不匹配：两端的货物类型不同。',
    SELLER_BUSY: '售卖站忙碌：正在结算上一批货物。',
    TARGET_FULL: '目标已满：等待它腾出空间。',
    WORKING: '正在加工：本轮结束后会继续传递。',
  };
  return messages[block];
}
function routingLabel(strategy: RoutingStrategy): string {
  const labels: Record<RoutingStrategy, string> = {
    even: '平均分流',
    overflow: '优先溢出分流',
    priority: '优先方向分流',
  };
  return labels[strategy];
}

function isBuildUnlocked(option: BuildOption, money: number): boolean {
  if (option.kind === 'source' && option.outputKind === 'coal') return money >= 10;
  if (option.kind === 'storage') return money >= 10;
  if (option.kind === 'warehouse' || option.kind === 'router') return money >= 30;
  if (option.kind === 'advanced-producer' || option.recipeId === 'assemble-gear')
    return money >= 50;
  return true;
}

function buildDescription(option: BuildOption): string {
  const descriptions: Record<NodeKind, string> = {
    'advanced-producer': '高级产出 · 解锁后可用',
    processor: option.recipeId === undefined ? '接收原料，输出加工品' : '组合材料，输出齿轮',
    router: '将货物分配到多个方向',
    seller: '出售货物，获得现金',
    source: option.outputKind === 'coal' ? '持续输出煤矿' : '持续输出铁矿',
    storage: '暂存货物，缓冲堵塞',
    warehouse: '更大的货物缓冲区',
  };
  return descriptions[option.kind];
}

function displayNodeName(kind: NodeKind): string {
  const names: Record<NodeKind, string> = {
    'advanced-producer': '迷宫生产机',
    processor: '加工器',
    router: '分流器',
    seller: '售卖站',
    source: '原料源',
    storage: '缓冲仓',
    warehouse: '大型仓库',
  };
  return names[kind];
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
