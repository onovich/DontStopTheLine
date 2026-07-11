# Phase 3 策略 Demo P1 Goal 模式执行指南

状态：READY；预算 16 轮（1-12 主体、13-15 缓冲、16 验收）。

## Goal Prompt

在既有 P0 上实现策略深度：多输入配方、宽线路、分类仓、默认路由和简单路由器、3 个等级的蓝图解锁、升级/出售/退款、瓶颈统计。simulation 仍是唯一权威；UI 仅发 command/读 selector。每轮完成验证、commit、push 后才可推进，并向 planner `019f4fd6-e23f-7ce2-af6e-dbdfe9336eae` 报告。

## 必读与边界

阅读 architecture、UI design、Phase 1/2 报告。不得做存档、Electron、音频、正式美术、动态市场、迷你游戏或 Phase 4 内容；不得破坏 P0 command/event 兼容性或将经济规则放入 UI。

## 分轮

1-2：内容 schema、铁矿/煤炭/铁板/齿轮与多输入原子预留；3：宽线路容量；4-5：分类仓与默认溢出/优先/均分路由；6：路由器；7-8：等级、蓝图、目标；9：升级/出售/退款与库存损失；10：瓶颈统计/selectors；11：UI 工具/检查器/重构模式；12：场景与浏览器回归；13-15：仅修复；16：干净验收报告。

## 每轮门禁与 PASS

每轮报告目标、Debug 自检、架构自检、验证、commit/push 和缓冲使用；失败不得推进。最终必须通过 `CI=true pnpm install --frozen-lockfile`、`pnpm check`、`pnpm build`、`pnpm smoke`、`git diff --check`，dependency-cruiser 0 violation；多输入、每种路由策略、升级/出售、3 等级与瓶颈视图均有单元和 Playwright 证据。
