# Phase 2 可玩 P0 验收报告

状态：PASS

## 交付

- Web composition root owns one deterministic simulation session. `requestAnimationFrame` only supplies elapsed presentation time; the session converts it into fixed 250 ms logical ticks, with pause and 1x/2x/4x controls.
- The bounded Canvas board renders its grid and camera boundary. The separate UI layer owns camera, selection, placement preview mode, drag positions, connection preview, and undo history; simulation state remains immutable and command-driven.
- Players start with a free source and seller, place processors, storage, or sellers, then create P0 single-input/single-output links. Lines project in-transit items without changing simulation state.
- The UI includes build drawer, money and 10/30/50 sale goals, inspector buffers, blocking explanations and suggested actions, connect/demolish modes, and responsive keyboard-focusable controls.

## User-flow evidence

- `apps/web/src/game/session.test.ts` constructs source → processor → seller through the public session commands and advances fixed time until at least 50 sales; this proves all 10/30/50 goals are reachable from the initial board.
- `apps/web/e2e/shell.spec.ts` covers browser placement, both links, observable revenue, console-error absence, source output blocking explanation, pause, and 4x speed control.

## Architecture check

- `apps/web` imports only public `@dstl/domain` and `@dstl/simulation` APIs.
- React components never mutate a factory entity. Board coordinates and temporary mode/camera state are UI state; placement, removal, linking, and logical time enter the simulation as commands through the session adapter.
- Canvas and SVG projection contain no economic or production rule.

## Rounds and commits

| Round | Commit    | Result                                                                              |
| ----- | --------- | ----------------------------------------------------------------------------------- |
| 1     | `84e7a6c` | deterministic session adapter and fixed tick tests                                  |
| 2     | `2813cef` | bounded grid, camera, and node projection                                           |
| 3–9   | `24fc518` | playable placement, movement, links, transport, HUD, inspector, goals, and controls |
| 10    | `4f05cd5` | Vitest goal evidence and Playwright P0 flow                                         |

## Final validation

- `CI=true pnpm install --frozen-lockfile`
- `pnpm check`
- `pnpm build`
- `CI=true pnpm smoke`
- `git diff --check`

All commands pass. `pnpm check` includes format, lint, strict type checks, tests, and dependency-cruiser; dependency-cruiser reports zero violations.

## Deferred scope

No multi-input recipes, wide belts, routers, upgrades/refunds, blueprints, saves, Electron, audio, production art, or minigames were added.
