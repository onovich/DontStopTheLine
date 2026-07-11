# Don't Stop The Line / 产线别停

一款在有限画布中搭建节点式自动化产线的 Web 优先游戏。旧 GDD 中的“节点工厂”仅为历史项目名。

当前阶段：架构与研发基线。权威设计输入见 `docs/节点工厂_游戏设计文档_GDD_v1.pdf`，工程决策见 `docs/architecture.md`、`docs/ui-design.md` 与 `docs/roadmap.md`。

当前执行计划：[`docs/phase-3-goal-mode-execution-guide.md`](docs/phase-3-goal-mode-execution-guide.md)，预算 16 轮。

## 工程命令

- `pnpm install`：安装依赖
- `pnpm check`：格式、静态检查、类型、测试与架构边界总门禁
- `pnpm build`：构建所有工作区
- `pnpm test`：运行测试
- `pnpm smoke`：以 Chromium 无头模式验证 Web 空壳可加载且无 console error

首次安装后运行 `pnpm exec playwright install chromium` 下载本地 smoke 所需浏览器。CI 使用
`pnpm install --frozen-lockfile`，随后依次执行 `pnpm check`、`pnpm build` 和 `pnpm smoke`。

Node.js 22+，pnpm 10+。正式实现从 Phase 0 开始。

## Phase 1 simulation API

`@dstl/simulation` exposes the headless `createFactory`, `applyCommand`, `replayFactory`,
`serializeSnapshot`, and read-only selector APIs. `@dstl/testkit` provides the fixed profit-chain
fixture used for deterministic replay checks. No browser, canvas, Electron, or persistence APIs are
part of the simulation package.
