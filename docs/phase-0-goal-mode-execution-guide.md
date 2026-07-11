# Phase 0 工程基线 Goal 模式执行指南

日期：2026-07-11  
状态：READY  
轮次预算：5 轮（1-3 主体实现，4 缓冲修复，5 最终验证）

## 0. 直接给执行者的 Goal Prompt

在 `D:\WebProjects\DontStopTheLine` 执行 Phase 0：建立可运行的 pnpm TypeScript monorepo 基线，包括 Web 空壳、共享包边界、测试工具链、CI 和第一份 ADR。严格遵守本文每轮验证、架构自检、提交和推送门禁。不要实现实际生产物流玩法，不要引入 Electron，不要改写 GDD。完成后把最终报告发送回 planner thread `019f4fd6-e23f-7ce2-af6e-dbdfe9336eae`。

## 1. 必读上下文

- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/ui-design.md`
- `docs/roadmap.md`
- `.codex/project-git-workflow.json`
- `.codex/project-ops-workflow.json`
- `.dependency-cruiser.cjs`

共识：项目正式名称为“产线别停 / Don't Stop The Line”；GDD 内“节点工厂”为旧名。Web-first、Electron-later；领域和模拟层保持纯 TypeScript、确定性、无 DOM/平台依赖。

## 2. 本阶段要完成什么

1. 建立 `apps/web`：Vite + React + TypeScript，可启动并显示正式中英文名、Phase 0 状态与基础视觉 token。
2. 建立 `packages/domain`、`simulation`、`content`、`ui`、`canvas`、`persistence`、`platform`、`testkit` 的最小包；每包有公开入口、build/typecheck/test/lint 脚本，不允许深层跨包导入。
3. 建立共享严格 TypeScript 配置、ESLint flat config、Vitest；测试至少证明领域包为纯函数、simulation 的确定性种子/时钟边界可注入，其他空包可编译。
4. 建立 Playwright Web smoke：页面可加载，正式名称可见，无控制台 error；配置可在 CI 无头运行。
5. 建立 GitHub Actions：安装锁文件依赖并执行 `pnpm check`、build、Playwright smoke；启用依赖缓存。
6. 建立 `docs/adr/0001-deterministic-discrete-event-simulation.md`，明确 Command/Event、逻辑 tick、稳定排序、PRNG 注入和表现层不反写权威状态。
7. 更新 README 的实际启动/验证命令，并使 ops workflow 与真实脚本一致。

## 3. 本阶段不做什么

- 不实现节点、配方、运输、预留槽、经济、存档或小游戏的业务逻辑。
- 不接入 PixiJS、Electron、音频、PWA、后端或在线服务。
- 不制作正式美术，不扩展 GDD，不提前进入 Phase 1。
- 不为了测试方便破坏依赖方向；不添加 `any`、非空断言或跨包 `src` 深导入。

## 4. 每轮固定工作流

每轮回复必须包含：本轮目标、完成内容、Debug 自检、架构自检、验证命令与结果、commit hash、push 结果、下一轮目标、是否消耗缓冲轮。

推进门禁：验证失败不得提交；提交失败不得推送；推送失败不得进入下一轮。优先使用项目 `GitFlow` wrapper，仅 stage 本阶段相关文件。

Debug 自检：用最小 fixture/用户路径解释改动；失败能定位到 tooling/build/test/browser 层；覆盖 success/failure/empty/incompatible 中适用状态；UI 改动必须有可重复 smoke；状态边界必须可注入、可验证。

架构自检：`domain` 与 `simulation` 保持 source of truth；UI 不复制规则；配置、运行态和平台适配保持分离；不拉入延期范围；不触碰无关用户文件；运行 dependency-cruiser 并检查无循环和平台泄漏。

## 5. 每轮通过后的提交推送

每轮执行相关验证后运行：状态检查、精确暂存、语义化提交、普通 push、再次状态检查。建议提交前缀：`chore(phase-0)`、`test(phase-0)`、`ci(phase-0)`、`docs(phase-0)`。禁止 force-push、reset --hard、clean -fd。

## 6. 分轮安排

### Round 1：工作区和 Web 空壳

建立共享配置、所有 package manifests/公开入口与 Web 空壳；保证 install、typecheck、build、lint 通过。避免空聚合命令报告“无项目”。

### Round 2：自动测试和架构门禁

配置 Vitest、最小确定性/纯函数测试、dependency-cruiser 完整路径规则；加入 Playwright smoke 并验证本地无头运行。测试失败必须能明确归属层级。

### Round 3：CI、ADR 与入口文档

建立 GitHub Actions，完成 ADR 0001；同步 README、ops 配置和 lockfile。验证 CI 使用的命令在本地同样成立。

### Round 4：缓冲修复

仅处理前 3 轮暴露的跨平台、版本、缓存、浏览器安装或边界规则问题。若无需使用，报告“未消耗”，不得趁机扩 scope。

### Round 5：最终验证

从干净依赖状态执行 install、format check、lint、typecheck、unit tests、architecture check、build、Playwright smoke；审查 git diff/status、包依赖方向、README 命令和 CI 一致性。不得在本轮新增功能。

## 7. 验证矩阵与 PASS 标准

| 范围      | 最低验证                                                    |
| --------- | ----------------------------------------------------------- |
| 格式/静态 | `pnpm format:check`, `pnpm lint`, `pnpm typecheck`          |
| 单元测试  | `pnpm test`，至少包含 domain 纯函数和 simulation 确定性边界 |
| 架构      | `pnpm arch:check`，0 violation、0 cycle、无平台反向依赖     |
| 构建      | `pnpm build`，所有工作区成功                                |
| Web smoke | Playwright 加载正式名称、无 console error                   |
| CI        | workflow YAML 可解析，命令与本地一致                        |
| Git       | 每轮 commit 已推送，最终 `main...origin/main` clean         |

只有矩阵全绿、空聚合检查已消失、ADR/README/ops 同步且没有 Phase 1 业务实现时判定 PASS。

## 8. 最终报告模板

- 状态：PASS / BLOCKED
- 完成轮次及缓冲消耗
- 交付的 apps/packages/tooling/CI/ADR
- Debug 自检结论
- 架构自检结论
- 完整验证命令与结果
- 各轮 commit hash 与 push 证据
- 剩余风险（只列 Phase 0）
- 建议 planner 验收事项
