# Phase 7 内测可玩性与视觉重构 Goal 模式执行指南

日期：2026-07-13  
状态：READY  
轮次预算：16（1-12 主体、13-15 缓冲、16 最终验收）

## 0. 直接给执行者的 Goal Prompt

使用 `$dont-stop-the-line-ui`、`$frontend-design` 和 `$frontend-ui-engineering`，将当前技术演示界面重构为“工业信号台”风格的内测游戏。新玩家须在 10 秒理解目标、60 秒完成首条盈利产线、3 分钟理解一次阻塞。保持 simulation/domain 为唯一权威，逐轮验证、精确提交并推送，最终向 planner `019f4fd6-e23f-7ce2-af6e-dbdfe9336eae` 回报。

## 1. 必读上下文

- `docs/ui-ux-inner-test-brief.md`
- `docs/ui-design.md`
- `docs/architecture.md`
- `docs/phase-6-validation-report.md`
- `apps/web/src/game/*` 与 `apps/web/src/styles.css`
- 全局 skills：`dont-stop-the-line-ui`、`frontend-design`、`frontend-ui-engineering`

## 2. 本阶段要完成什么

1. 截取 1440x900、1024x768、768x1024 和 390x844 的 before 基准；建立可重复截图命令和视觉回归目录。
2. 建立语义 design tokens：材质表面、文字、边界、状态、间距、圆角、字体角色、层级和动效时长；清除散落 raw hex 与任意间距。
3. 拆分当前 monolithic `GameApp` 为 HUD、Objective、BuildCatalog、FactoryBoard、Inspector、ToolDock、TutorialCoach 等专注组件；不移动 simulation 语义。
4. 首局渐进披露：只展示源点、加工器、售卖器、连线；用画布锚点引导第一条链，再按需求揭示仓储/宽线/路由/迷宫。
5. 将全局“两次点击 Connect”替换为输出端口拖拽到输入端口；悬停预演兼容、费用、容量和无效原因，保留键盘可完成的替代路径。
6. 建造卡显示玩家名称、图标、成本、占地、输入/输出、锁定原因；放置时显示吸附幽灵、合法性与余额变化。
7. 节点从开发按钮改为设备模块：端口、进度、产物、状态灯；默认隐藏实体 ID 与 `IN/WORK/OUT` 原始诊断。
8. 线路具有方向、货物流动和容量压力；拥堵与阻塞在画布可见并能高亮问题链。
9. 检查器只在选中时展开，使用玩家语言展示配方、缓冲、原因、建议、升级、出售及损失确认。
10. 视觉重做遵循“工业信号台”，高级迷宫节点成为唯一视觉奇观；动效支持 reduced motion。
11. 完成 320/390/768/1024/1440 响应式布局、键盘焦点、对比度和非颜色状态提示。
12. Playwright 覆盖首局 60 秒路径、端口连接、非法连接、一次阻塞解决、逐步解锁、键盘路径与截图回归。

## 3. 本阶段不做什么

不增加新配方、章节、经济系统、第二个小游戏、联网或云功能；不以重写模拟层解决 UI 问题；不使用付费 SaaS；不引入大型 UI 组件库覆盖项目视觉。

## 4. 每轮固定门禁

每轮必须报告目标、完成内容、before/after 或交互证据、Debug 自检、架构自检、验证命令、commit hash、push 结果、下一轮和缓冲消耗。验证/提交/推送任一失败都不得进入下一轮。

Debug 自检必须定位到 tutorial、interaction、projection、layout、style 或 simulation adapter 层。架构自检必须确认 UI 只发 command/读 snapshot，视觉状态不复制经济或生产规则。

## 5. 分轮安排

1. 截图基准、token 与组件边界；2. HUD/布局骨架；3. 构建目录与渐进披露；4. 放置幽灵和合法反馈；5-6. 端口拖拽连线与键盘替代；7. 设备节点视觉/状态；8. 线路货物/压力；9. 检查器和危险操作；10. 画布锚定教程；11. 迷宫节点表现；12. 响应式/可访问性/完整自动测试；13-15 仅修复；16 独立内测验收报告。

## 6. 验证矩阵

- `CI=true pnpm install --frozen-lockfile`
- `pnpm check`, `pnpm build`, `CI=true pnpm smoke`, `git diff --check`
- 视觉截图：1440x900、1024x768、768x1024、390x844
- Playwright 首局：不读取外部说明完成盈利链；发现并解决一个阻塞
- dependency-cruiser 0 violation；控制台 0 error；关键文本 WCAG AA

## 7. PASS 标准

- 10 秒、60 秒、3 分钟体验指标均有自动或可复核证据。
- 玩家默认界面无内部 ID、裸枚举和开发者槽位术语。
- 端口、目标与非法原因无需阅读文档即可发现。
- 画布是第一视觉焦点；界面无法被误认为 SaaS Dashboard。
- 所有状态不只依赖颜色；键盘、触控、窄屏和 reduced motion 可用。
- 原有玩法、存档、安全、性能和架构门禁无回归。

## 8. 最终报告模板

状态、轮次/缓冲、before/after 截图索引、首局路径计时、交互/阻塞/响应式/无障碍证据、架构结论、完整验证、各轮 commit/push、剩余内测风险。
