import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
  type WheelEvent,
} from 'react';
import type { FactoryState } from '@dstl/simulation';
import type { BoardUiState, InteractionMode, Point } from './session.js';

const BOARD = { height: 700, width: 1000 };
const NODE = { height: 110, width: 142 };

interface Camera {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}
interface DragState {
  readonly nodeId: string;
  readonly pointerId: number;
  readonly start: Point;
  readonly origin: Point;
}
interface PanState {
  readonly origin: Point;
  readonly pointerId: number;
}
interface BoardProps {
  readonly factory: FactoryState;
  readonly mode: InteractionMode;
  readonly connectFrom: string | null;
  readonly ui: BoardUiState;
  readonly onConnect: (from: string, to: string) => boolean;
  readonly onMove: (nodeId: string, position: Point) => void;
  readonly onPlace: (position: Point) => void;
  readonly onSelect: (nodeId: string) => void;
}

export function Board({
  connectFrom,
  factory,
  mode,
  onConnect,
  onMove,
  onPlace,
  onSelect,
  ui,
}: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<Camera>(() => initialCamera(window.innerWidth));
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pan, setPan] = useState<PanState | null>(null);
  const [pointer, setPointer] = useState<Point | null>(null);
  useGrid(canvasRef, camera);

  const toWorld = (event: PointerEvent<HTMLDivElement>): Point =>
    screenToWorld(event.clientX, event.clientY, boardRef, camera);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('button') !== null) return;
    const world = toWorld(event);
    if (mode === 'place') {
      onPlace(snap(world));
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setPan({
      origin: { x: event.clientX - camera.x, y: event.clientY - camera.y },
      pointerId: event.pointerId,
    });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const world = toWorld(event);
    setPointer(world);
    if (drag !== null && event.pointerId === drag.pointerId) return;
    if (pan === null || event.pointerId !== pan.pointerId) return;
    setCamera((current) => ({
      ...current,
      x: event.clientX - pan.origin.x,
      y: event.clientY - pan.origin.y,
    }));
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (drag !== null && event.pointerId === drag.pointerId) {
      onMove(drag.nodeId, snap(toWorld(event)));
      setDrag(null);
    }
    if (pan?.pointerId === event.pointerId) setPan(null);
  };
  const startDrag = (event: PointerEvent<HTMLButtonElement>, nodeId: string): void => {
    if (mode !== 'select') return;
    const position = ui.positions[nodeId];
    if (position === undefined) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      nodeId,
      origin: position,
      pointerId: event.pointerId,
      start: screenToWorld(event.clientX, event.clientY, boardRef, camera),
    });
  };
  const selectNode = (nodeId: string): void => {
    if (mode === 'connect') {
      if (connectFrom !== null && connectFrom !== nodeId) onConnect(connectFrom, nodeId);
      else onSelect(nodeId);
      return;
    }
    onSelect(nodeId);
  };
  const zoom = (event: WheelEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.1 : 0.9;
    setCamera((current) => ({ ...current, zoom: clamp(current.zoom * factor, 0.4, 1.75) }));
  };
  const dragPosition =
    drag === null || pointer === null
      ? null
      : {
          x: drag.origin.x + pointer.x - drag.start.x,
          y: drag.origin.y + pointer.y - drag.start.y,
        };

  return (
    <div
      aria-label="Factory board"
      className={`factory-board mode-${mode}`}
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={zoom}
      ref={boardRef}
      role="application"
    >
      <canvas aria-hidden="true" className="factory-grid" ref={canvasRef} />
      <div
        className="node-layer"
        style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}
      >
        <div className="board-boundary" style={{ height: BOARD.height, width: BOARD.width }} />
        <LineLayer
          connectFrom={connectFrom}
          factory={factory}
          pointer={pointer}
          positions={ui.positions}
        />
        {Object.values(factory.nodes).map((node) => {
          const savedPosition = ui.positions[node.id];
          if (savedPosition === undefined) return null;
          const position =
            drag?.nodeId === node.id && dragPosition !== null ? dragPosition : savedPosition;
          const selected = ui.selectedNodeId === node.id;
          return (
            <button
              aria-label={nodeLabel(node.kind)}
              aria-pressed={selected}
              className={`factory-node kind-${node.kind}${selected ? ' is-selected' : ''}`}
              key={node.id}
              onClick={() => selectNode(node.id)}
              onPointerDown={(event) => startDrag(event, node.id)}
              style={{ left: position.x, top: position.y }}
              type="button"
            >
              <span aria-hidden="true" className="node-icon">
                {nodeIcon(node.kind)}
              </span>
              <span className="node-kind">{nodeLabel(node.kind)}</span>
              <span className="node-name">{nodeStatus(node)}</span>
              <span className="node-buffers">
                输入 {node.input.length + node.reserved} · 输出 {node.output.length}
              </span>
            </button>
          );
        })}
      </div>
      <p className="camera-readout">
        缩放 {Math.round(camera.zoom * 100)}% · 拖动画布平移 · 滚轮缩放
      </p>
    </div>
  );
}

function LineLayer({
  connectFrom,
  factory,
  pointer,
  positions,
}: Pick<BoardProps, 'connectFrom' | 'factory'> & {
  readonly pointer: Point | null;
  readonly positions: Readonly<Record<string, Point>>;
}) {
  const previewStart = connectFrom === null ? undefined : positions[connectFrom];
  return (
    <svg
      aria-hidden="true"
      className="line-layer"
      height={BOARD.height}
      viewBox={`0 0 ${BOARD.width} ${BOARD.height}`}
      width={BOARD.width}
    >
      {Object.values(factory.lines).map((line) => (
        <Line
          key={line.id}
          from={positions[line.from]}
          inTransit={line.items.length > 0}
          to={positions[line.to]}
        />
      ))}
      {previewStart !== undefined && pointer !== null ? (
        <line
          className="line-preview"
          x1={previewStart.x + NODE.width}
          x2={pointer.x}
          y1={previewStart.y + NODE.height / 2}
          y2={pointer.y}
        />
      ) : null}
    </svg>
  );
}

function Line({
  from,
  inTransit,
  to,
}: {
  readonly from: Point | undefined;
  readonly inTransit: boolean;
  readonly to: Point | undefined;
}) {
  if (from === undefined || to === undefined) return null;
  const start = { x: from.x + NODE.width, y: from.y + NODE.height / 2 };
  const end = { x: to.x, y: to.y + NODE.height / 2 };
  return (
    <g className="factory-line">
      <line x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
      {inTransit ? (
        <circle
          className="transit-dot"
          cx={(start.x + end.x) / 2}
          cy={(start.y + end.y) / 2}
          r="7"
        />
      ) : null}
    </g>
  );
}

function useGrid(canvasRef: RefObject<HTMLCanvasElement | null>, camera: Camera): void {
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const context = canvas.getContext('2d');
    if (context === null) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    context.scale(ratio, ratio);
    context.fillStyle = '#10191f';
    context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = '#23333c';
    const step = 40 * camera.zoom;
    for (let x = modulo(camera.x, step); x < rect.width; x += step)
      line(context, x, 0, x, rect.height);
    for (let y = modulo(camera.y, step); y < rect.height; y += step)
      line(context, 0, y, rect.width, y);
    context.strokeStyle = '#47616e';
    context.lineWidth = 2;
    context.strokeRect(camera.x, camera.y, BOARD.width * camera.zoom, BOARD.height * camera.zoom);
  }, [camera, canvasRef]);
  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    const canvas = canvasRef.current;
    if (canvas !== null) observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, draw]);
}

function screenToWorld(
  clientX: number,
  clientY: number,
  boardRef: RefObject<HTMLDivElement | null>,
  camera: Camera,
): Point {
  const rect = boardRef.current?.getBoundingClientRect();
  return {
    x: (clientX - (rect?.left ?? 0) - camera.x) / camera.zoom,
    y: (clientY - (rect?.top ?? 0) - camera.y) / camera.zoom,
  };
}
function snap(point: Point): Point {
  return {
    x: clamp(Math.round(point.x / 20) * 20, 0, BOARD.width - NODE.width),
    y: clamp(Math.round(point.y / 20) * 20, 0, BOARD.height - NODE.height),
  };
}
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
function line(
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): void {
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
}
function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
function initialCamera(viewportWidth: number): Camera {
  if (viewportWidth <= 700) return { x: 0, y: 0, zoom: 0.4 };
  if (viewportWidth <= 1100) return { x: 0, y: 0, zoom: 0.5 };
  return { x: 0, y: 0, zoom: 0.8 };
}
function nodeLabel(kind: string): string {
  const labels: Record<string, string> = {
    'advanced-producer': '迷宫生产机',
    processor: '加工器',
    router: '分流器',
    seller: '售卖站',
    source: '原料源',
    storage: '缓冲仓',
    warehouse: '大型仓库',
  };
  return labels[kind] ?? '设备';
}
function nodeStatus(node: FactoryState['nodes'][string]): string {
  if (node.workItem !== null) return '正在加工';
  if (node.output.length > 0) return '等待输出';
  if (node.input.length + node.reserved > 0) return '准备加工';
  return '等待货物';
}
function nodeIcon(kind: string): string {
  const icons: Record<string, string> = {
    'advanced-producer': '◇',
    processor: '⚙',
    router: '↗',
    seller: '¤',
    source: '●',
    storage: '▣',
    warehouse: '▤',
  };
  return icons[kind] ?? '●';
}
