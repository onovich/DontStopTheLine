# Phase 3 策略 Demo P1 验收报告

状态：PASS

## 交付

- 内容和领域契约扩展为 ore、coal、plate、gear，并保留既有 P0 单输入 `Recipe.input` 的兼容入口；新配方支持 `inputs` 多输入数组。
- simulation 保持唯一权威，新增煤炭源、齿轮多输入加工、宽线路容量、仓库/路由节点、overflow/priority/even 路由策略、节点等级、升级成本、出售退款和瓶颈统计。
- Web session 将策略操作转为 public `Command`；UI 提供煤炭源、齿轮装配器、仓库、路由器、宽线路、升级、出售退款和路由策略控制。

## Evidence

- simulation 单元测试覆盖多输入齿轮配方及既有 P0 回归。
- Playwright 覆盖 P0 获利链、阻塞/暂停/倍速，以及 P1 建造/宽线路/路由/升级控制的可达性。
- dependency-cruiser 保持 0 violations；UI 未直接写入 simulation 实体。

## Commits

- `4344b43` — P1 strategy simulation primitives.
- `a4c9e1b` — P1 strategy controls in Web session/UI.

## Final validation

- `CI=true pnpm install --frozen-lockfile`
- `pnpm check`
- `pnpm build`
- `CI=true pnpm smoke`
- `git diff --check`

All commands pass. Deferred scope remains persistence, Electron, audio, production art, dynamic market, and minigames.

## Smoke repair

- Playwright now starts Vite from the explicit `apps/web` working directory, uses a fixed strict port, URL health probe, and a 120-second startup budget.
- The session now caches its `getSnapshot()` value until an authoritative or UI state publish. This prevents React `useSyncExternalStore` from entering an update loop during the browser smoke path.
- `CI=true pnpm smoke` passes from a cleared port with all three browser tests.
