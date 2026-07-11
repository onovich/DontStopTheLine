# 研发 Roadmap

轮次指一次“明确输入 -> 实现/验证 -> 可审查交付”的 Codex 会话；估算包含返工缓冲，不等同自然日。模型名称以当前 Codex 主机可选项为准。

| Phase            | 目标与退出条件                                                           | 估算轮次 | 推荐 worker / sub-agent                      | 推荐模型                                                       |
| ---------------- | ------------------------------------------------------------------------ | -------: | -------------------------------------------- | -------------------------------------------------------------- |
| 0 基线           | monorepo、严格 TS、CI、架构门禁、测试基座、ADR；空壳 Web 可运行          |      3-5 | architect、tooling、QA                       | gpt-5.6-sol(high) 定边界；gpt-5.6-terra(medium) 配置           |
| 1 模拟内核       | 确定性 tick/事件队列、节点槽、预留、线路、售卖、金钱；黄金场景稳定       |     8-12 | simulation、domain、property-test reviewer   | gpt-5.6-sol(high/xhigh)；gpt-5.4-mini(high) 扩展测试           |
| 2 可玩 P0        | 画布相机/网格/放置/连接、4 类节点、HUD、阻塞解释；完成 10/30/50 售出目标 |    10-14 | canvas、UI、gameplay integration、QA         | gpt-5.6-terra(high) 主实现；gpt-5.3-codex-spark(medium) 小组件 |
| 3 策略 Demo P1   | 多输入、仓储、宽线、路由、升级/出售/退款、3 等级、瓶颈统计               |    12-18 | economy/content、routing、UX、balance        | gpt-5.6-sol(high) 路由与经济；gpt-5.6-terra(high) UI           |
| 4 Alpha P2       | 迷宫生产者、5 等级、20-30 节点、教程、音效、倍速、完整第一章             |    14-20 | minigame、content、tutorial、audio/UX        | gpt-5.6-sol(high) 系统整合；gpt-5.6-terra(high) 内容实现       |
| 5 存档与桌面     | 版本化存档/迁移、Electron 安全壳、Windows/macOS/Linux 构建与恢复测试     |     7-10 | persistence、Electron/platform、release QA   | gpt-5.6-sol(high) 安全/迁移；gpt-5.6-terra(medium) 打包        |
| 6 性能与发布候选 | 1,000 节点压测、LOD、对象池、无障碍、崩溃恢复、发布清单                  |     8-12 | performance、accessibility、release reviewer | gpt-5.6-sol(xhigh) 性能诊断；gpt-5.4-mini(high) 回归矩阵       |

总预算约 62-91 轮。每个 phase 至少保留 1 轮独立验收；跨域 phase 只并行处理文件边界清晰的任务，模拟协议、存档 schema 和依赖边界由 architect 单点拍板。

## Phase 执行模板

1. Planner 明确范围、不可变接口、验收场景和风险，产出 phase guide。
2. Worker 按包边界实现；并行 worker 不修改同一公共契约。
3. QA 运行单元、属性、集成、视觉 smoke 与性能基准中的适用部分。
4. Architect 运行依赖检查，审查公共 API、存档/事件兼容性和 ADR。
5. 验收通过才进入下一 phase；失败项回到原 worker，不在下阶段“顺便修”。

## 当前下一步

进入 Phase 0：补齐 `apps/web` 与各 packages 的最小可编译骨架，配置 Vitest、ESLint、Playwright 与 GitHub Actions，并建立第一个 ADR（确定性离散事件模拟）。
