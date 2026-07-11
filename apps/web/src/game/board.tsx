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
import type { BoardUiState, Point } from './session.js';

const BOARD = { height: 700, width: 1000 };

interface Camera {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

interface BoardProps {
  readonly factory: FactoryState;
  readonly ui: BoardUiState;
  readonly onSelect: (nodeId: string) => void;
}

interface PanState {
  readonly origin: Point;
  readonly pointerId: number;
}

export function Board({ factory, onSelect, ui }: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [pan, setPan] = useState<PanState | null>(null);
  useGrid(canvasRef, camera);

  const startPan = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPan({
      origin: { x: event.clientX - camera.x, y: event.clientY - camera.y },
      pointerId: event.pointerId,
    });
  };
  const panBoard = (event: PointerEvent<HTMLDivElement>): void => {
    if (pan === null || event.pointerId !== pan.pointerId) return;
    setCamera((current) => ({
      ...current,
      x: event.clientX - pan.origin.x,
      y: event.clientY - pan.origin.y,
    }));
  };
  const stopPan = (event: PointerEvent<HTMLDivElement>): void => {
    if (pan?.pointerId === event.pointerId) setPan(null);
  };
  const zoom = (event: WheelEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.1 : 0.9;
    setCamera((current) => ({ ...current, zoom: clamp(current.zoom * factor, 0.55, 1.75) }));
  };

  return (
    <div
      aria-label="Factory board"
      className="factory-board"
      onPointerCancel={stopPan}
      onPointerDown={startPan}
      onPointerMove={panBoard}
      onPointerUp={stopPan}
      onWheel={zoom}
      role="application"
    >
      <canvas aria-hidden="true" className="factory-grid" ref={canvasRef} />
      <div
        className="node-layer"
        style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}
      >
        <div className="board-boundary" style={{ height: BOARD.height, width: BOARD.width }} />
        {Object.values(factory.nodes).map((node) => {
          const position = ui.positions[node.id];
          if (position === undefined) return null;
          const selected = ui.selectedNodeId === node.id;
          return (
            <button
              aria-pressed={selected}
              className={`factory-node kind-${node.kind}${selected ? ' is-selected' : ''}`}
              key={node.id}
              onClick={() => onSelect(node.id)}
              style={{ left: position.x, top: position.y }}
              type="button"
            >
              <span className="node-kind">{node.kind}</span>
              <span className="node-name">{node.id}</span>
              <span className="node-buffers">
                IN {node.input.length + node.reserved} · WORK{' '}
                {node.workItem === null ? '—' : node.workItem} · OUT {node.output.length}
              </span>
            </button>
          );
        })}
      </div>
      <p className="camera-readout">
        {Math.round(camera.zoom * 100)}% · drag empty space to pan · scroll to zoom
      </p>
    </div>
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
    context.clearRect(0, 0, rect.width, rect.height);
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
