# Phase 1 确定性模拟内核 Goal 模式执行指南

状态：READY；轮次预算：10（1-8 主体，9 缓冲，10 最终验收）。

## 0. Goal Prompt

实现产线别停的 headless、确定性离散事件模拟内核。所有权威状态在 `packages/simulation`，基础类型/不可变规则在 `packages/domain`；以命令驱动、稳定有序事件和可重放快照证明生产、运输、售卖与阻塞闭环。完成每轮验证、提交、推送，最终报告回传 planner `019f4fd6-e23f-7ce2-af6e-dbdfe9336eae`。

## 1. 必读

`docs/architecture.md`、`docs/adr/0001-deterministic-discrete-event-simulation.md`、`docs/roadmap.md`、Phase 0 指南与验收报告、各 workspace 的公开入口。

## 2. 范围

- 定义版本化 `GameState`、`Command`、`DomainEvent`、逻辑 tick、稳定 sequence、可序列化 seed PRNG 和 snapshot。
- 实现放置/移除节点、连接/断开线路、生产完成、线路到达、售卖完成等命令和事件；非法命令返回明确拒绝结果且不改状态。
- 只实现 P0 的源点生产者、基础加工器、储存器、售卖器；输入/工作/输出缓冲与线路在途容量必须是独立状态。
- 路由必须先原子预留目标槽，再创建在途物；涵盖 `NO_INPUT`、`OUTPUT_FULL`、`NO_CONSUMER`、`TARGET_FULL`、`LINE_FULL`、`SELLER_BUSY`、`RECIPE_MISMATCH`、`WORKING`。
- 提供固定场景构造器与黄金事件序列：相同 seed + command 序列产出字节等价 snapshot；生产→运输→售卖增加资金；每种关键阻塞均可重现。
- 为未来 UI 提供只读 selectors/统计 API，不引入 DOM、React、Canvas、存储或 Electron。

## 3. 非范围

不实现画布交互、真实渲染、升级/解锁、退款、复杂多输入、路由器、存档迁移、小游戏生产者或 Electron。不要修改 UI 以伪造模拟结果。

## 4. 每轮硬门禁

每轮报告目标、完成内容、Debug 自检、架构自检、验证结果、commit/push、下一轮、缓冲消耗。验证失败、提交失败或 push 失败均不得进入下一轮。每次只暂存本 phase 文件。

Debug：用最小 fixture 定位 command、队列、路由、计时或断言错误；覆盖成功、非法、空、满载、重放和不兼容状态。架构：domain/simulation 保持唯一权威；不泄漏平台/UI；事件而非表现层修改状态；不提前引入延期系统。

## 5. 分轮计划

1. 领域 discriminated unions、内容定义和纯校验；严格类型与导出边界。
2. state、seed PRNG、命令结果、事件队列与稳定 tick/replay 骨架。
3. 节点缓冲/工作槽和源点/加工生产事件，含 NO_INPUT、OUTPUT_FULL、WORKING。
4. 线路、在途容量、原子目标预留和到达事件，含消费者/目标/线路/配方阻塞。
5. 储存器与售卖器，资金事件和 SELLER_BUSY；完成最短盈利链。
6. selectors、状态解释和统计；禁止 selector 改写 state。
7. 黄金场景与属性/重放测试；补全每个阻塞枚举的测试。
8. 公共 API、ADR/README/测试文档、性能小基准（无 UI）。
9. 仅修复本 phase 缺陷；无缺陷则记录未消耗。
10. 干净安装后完整验证、diff/status 审查、发布 Phase 1 验收报告。

## 6. PASS 标准

`CI=true pnpm install --frozen-lockfile`、`pnpm check`、`pnpm build`、`pnpm smoke`、`git diff --check` 全通过；新增 simulation/domain 测试不使用 passWithNoTests 掩盖；重放字节等价；每个核心阻塞有测试；dependency-cruiser 0 violation；无 UI/平台依赖或延期功能；所有轮次已 commit 并 push。

## 7. 最终报告

列出状态、各轮 commit/push、交付 API、黄金场景/阻塞覆盖、Debug/架构自检、完整命令结果、缓冲使用和仅限 Phase 1 的剩余风险。
