# Phase 2 可玩 P0 Goal 模式执行指南

状态：READY。轮次预算：12（1-10 实现，11 缓冲，12 最终验收）。

## 0. Goal Prompt

将已验收的确定性模拟内核接入 Web，交付可玩的 P0：有限网格画布上放置、移动、连接源点生产者/加工器/储存器/售卖器，观察货物流、阻塞解释与资金，并完成 10/30/50 售出目标。权威状态仍只在 simulation；UI 只发送 command、订阅快照/selectors。每轮验证、commit、push 后再继续，最终回传 planner `019f4fd6-e23f-7ce2-af6e-dbdfe9336eae`。

## 1. 必读

`docs/architecture.md`、`docs/ui-design.md`、`docs/phase-1-validation-report.md`、`packages/domain`、`packages/simulation`、`packages/testkit` 公共 API。

## 2. 范围

- Web 组合根拥有 simulation session 和 requestAnimationFrame 表现循环；逻辑 tick 固定、可暂停、可 1x/2x/4x，不得由 React render 推进。
- Canvas 画布实现边界、网格、缩放/平移、节点选择、放置预览、拖拽移动、端口连线预览和撤销最后一次 UI 命令。
- 节点表现输入/工作/输出状态；线路表现运输点；近/中/远景 LOD；不让动画修改模拟。
- 左侧构建抽屉、顶栏资金/目标、右侧检查器、底部连接/拆除模式；展示与 Phase 1 状态枚举一致的阻塞原因及建议。
- 首局初始化含赠送源点和售卖器；实现加工器、储存器、售卖器的可放置链路与 10/30/50 售出目标。
- 覆盖关键用户流的 Vitest 和 Playwright：放置、连接、货物流、阻塞说明、目标完成、暂停/倍速与控制台无错。

## 3. 非范围

不改写 simulation 规则语义；不做多输入配方、宽履带、路由器、升级/退款、蓝图、存档、Electron、音频、正式美术或高级小游戏。

## 4. 固定门禁

每轮报告目标、完成、Debug 自检、架构自检、命令结果、commit/push、下一轮和缓冲使用。失败不可推进。Debug 以最小用户路径复现，覆盖空/满/错误/暂停状态；架构自检确认 UI 不写权威实体、canvas 不含经济规则、无平台泄漏、无延期范围。精确暂存本 phase 文件。

## 5. 分轮

1. session adapter、固定 tick 与 UI 状态边界；2. 网格/相机/节点渲染；3. 放置与移动 command；4. 端口连接与线路表现；5. 运输动画和 LOD；6. HUD、构建抽屉、检查器；7. 阻塞解释与建议；8. 初局/目标/进度；9. 暂停倍速撤销和触控/键盘基础；10. 浏览器测试与视觉 smoke；11. 仅修复；12. 干净完整验收与报告。

## 6. PASS

`CI=true pnpm install --frozen-lockfile`、`pnpm check`、`pnpm build`、`pnpm smoke`、`git diff --check` 通过；Playwright 覆盖 P0 主链和关键阻塞；simulation/domain 仍纯净且 dependency-cruiser 0 violation；用户可从首局完成 10/30/50 售出目标；每轮已 push。

## 7. 最终报告

报告完成轮次/缓冲、用户流程证据、UI/模拟边界、自检、验证命令、commit/push、未做事项和 Phase 2 风险。
