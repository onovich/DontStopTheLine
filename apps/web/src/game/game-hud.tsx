import { SPEEDS, type SimulationSpeed } from './session.js';

const GOALS = [10, 30, 50] as const;

export function GameHud({
  money,
  onSetPaused,
  onSetSpeed,
  paused,
  reducedMotion,
  onReducedMotionChange,
  speed,
}: {
  readonly money: number;
  readonly onSetPaused: (paused: boolean) => void;
  readonly onReducedMotionChange: (reduced: boolean) => void;
  readonly onSetSpeed: (speed: SimulationSpeed) => void;
  readonly paused: boolean;
  readonly reducedMotion: boolean;
  readonly speed: SimulationSpeed;
}) {
  const nextGoal = GOALS.find((goal) => goal > money) ?? GOALS.at(-1) ?? 50;
  return (
    <header className="game-hud">
      <div className="hud-title">
        <p className="eyebrow">LINE CONTROL / 01</p>
        <h1>Don&apos;t Stop The Line</h1>
      </div>
      <dl className="hud-readouts">
        <div>
          <dt>现金</dt>
          <dd className="money">$ {money}</dd>
        </div>
        <div>
          <dt>当前目标</dt>
          <dd>持续出售 · {nextGoal}</dd>
        </div>
      </dl>
      <div aria-label="模拟速度" className="hud-controls">
        <button onClick={() => onSetPaused(!paused)} type="button">
          {paused ? '继续' : '暂停'}
        </button>
        {SPEEDS.map((option) => (
          <button
            aria-pressed={speed === option}
            className={speed === option ? 'active' : ''}
            key={option}
            onClick={() => onSetSpeed(option)}
            type="button"
          >
            {option}×
          </button>
        ))}
        <label className="hud-motion">
          <input
            checked={reducedMotion}
            onChange={(event) => onReducedMotionChange(event.target.checked)}
            type="checkbox"
          />
          减少动画
        </label>
      </div>
    </header>
  );
}
