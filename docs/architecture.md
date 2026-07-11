# 技术架构

## 目标与原则

“产线别停 / Don't Stop The Line”采用 Web-first、Electron-later 的同核架构。确定性模拟是产品核心，渲染器、存档介质和桌面壳均为可替换适配器。禁止把 DOM、Canvas、Electron、文件系统或系统时间带入领域与模拟层。

## 工作区边界

```text
apps/web          Web 入口、路由、PWA、组合根
apps/desktop      Electron main/preload，仅通过窄 IPC 契约调用共享能力
packages/domain   品类、配方、节点、端口、货币、解锁等纯类型与规则
packages/simulation 确定性离散事件引擎、命令、事件、快照、统计
packages/content  数据驱动配方/节点/章节，含 schema 校验
packages/ui       React HUD、面板、教程与无平台状态组件
packages/canvas   相机、网格、节点/连线渲染、拾取与 LOD
packages/persistence 版本化存档、迁移、校验；依赖抽象存储端口
packages/platform Web/Electron 的存储、音频、生命周期适配器接口
packages/testkit  固定种子、场景构造器、模拟断言与性能基准
```

依赖方向为 `apps -> adapters/ui/canvas -> simulation -> domain`；`content -> domain`。领域层不反向依赖。跨包只能从包的公开入口导入，不得使用 `../../src` 深层导入。

## 核心模型

- 模拟只接受 `Command`，只产生有序 `DomainEvent`；事件队列用逻辑 tick 与稳定序号排序。
- 所有随机行为注入可序列化 PRNG seed；禁止在模拟层使用 `Math.random()`、`Date.now()`。
- 生产完成、运输到达、售卖完成是离散事件；视觉插值、粒子和小游戏动画是逐帧表现，不反写权威状态。
- 输入槽、工作槽、输出缓冲、线路在途物、目标预留槽分别建模。路由必须先原子预留，再发运，避免竞态和货物丢失。
- 存档包含 schemaVersion、contentVersion、tick、seed、快照和必要队列；每个版本提供单向迁移。
- 高级小游戏节点通过 `MiniGameProducer` 端口接入，只输出确定性的生产结果事件；其内部渲染可降级或暂停。

## 前端与多平台

React + TypeScript 负责 UI；画布首选 PixiJS/WebGL，并保留 Canvas2D 降级边界。UI 状态与模拟状态分离：Zustand 仅保存选择、面板、相机等交互状态，模拟状态由引擎快照/选择器读取。Web 使用 IndexedDB；Electron 使用 preload 暴露的安全存储接口，启用 contextIsolation，禁用 nodeIntegration。

## 性能预算

目标 60 FPS，主线程每帧表现预算 8 ms；模拟批次预算 4 ms。P0 以 200 节点/400 线路稳定运行，P2 以 1,000 节点进行压力基准。运输点采用实例化/对象池；离屏节点停止表现更新但模拟不停；远景按 LOD 合并动画。

## 质量门禁与架构防漂移

每个功能必须按“规格/验收例 -> 领域测试 -> 实现 -> UI/集成测试 -> 架构检查 -> 构建”完成。合并前必须通过 `pnpm check`。CI 与本地同命令，不允许 CI 专属修补。

- TypeScript `strict`，禁止 `any`、非空断言和未解释的类型强转。
- 公共 API 必须有显式类型；领域枚举使用判别联合并做 exhaustive check。
- 单文件建议不超过 300 行，函数不超过 50 行；超限需在 PR 中解释并附拆分计划。
- 业务状态变更只能经 Command；React 组件不得直接改模拟实体。
- 新跨层依赖必须先写 ADR。`dependency-cruiser` 阻止反向依赖、循环依赖和平台泄漏。
- 领域/模拟变更要求单元与场景测试；修复 bug 必须先补回归测试；存档变更必须补迁移测试。
- 关键场景保存黄金事件序列；相同 seed + commands 必须得到字节等价快照。

## 决策记录

重大决策写入 `docs/adr/NNNN-title.md`，含 Context、Decision、Consequences、Alternatives。架构图和本文是边界权威；GDD 是玩法权威，冲突时先 ADR 再改代码。
