# Phase 7 UI/UX 基线与界面边界

## Before 截图索引

- `artifacts/visual/phase-7-before-verified-1440x900.png`
- `artifacts/visual/phase-7-before-verified-1024x768.png`
- `artifacts/visual/phase-7-before-verified-768x1024.png`
- `artifacts/visual/phase-7-before-verified-390x844.png`

截图通过 Vite 的独占 `http://127.0.0.1:4173` 实例生成。采集前由
`visual-baseline.spec.ts` 在浏览器水合后断言标题 `Don't Stop The Line` 和
`Factory board`；任一元素缺失即不写入截图。5173 的 Suitweave 监听进程
（PID 22424，命令行位于 `D:\WebProjects\Suitweave`）已在采集前确认并停止。

## Before / after 强制断言

After 截图必须满足下列可复核结论：

- 1440x900 和 1024x768 的首屏中，工厂画布可见且占据主要面积；教程不能把画布推到首屏之外。
- 标题和眉标压缩为功能性 HUD，资金、当前目标与速度仍在首屏。
- 初局只露出原料、加工、售卖和连接；高级生产、煤、仓储、宽线路和路由在满足需要后才揭示。
- 未选择设备时检查器不占用桌面宽度。
- 390x844 的首屏持续显示当前目标、可玩的画布和初始原料/售卖设备；完整建造目录收在紧凑的底部抽屉或分类入口中。

## 设计令牌

| 角色     | 令牌               | 用途                 |
| -------- | ------------------ | -------------------- |
| 石墨台面 | `--surface-deck`   | 页面与面板底层       |
| 搪瓷模块 | `--surface-module` | 设备、抽屉、检查器   |
| 蚀刻网格 | `--surface-grid`   | 工厂画布             |
| 琥珀灯   | `--signal-amber`   | 工作、钱数与警告     |
| 青色流   | `--signal-flow`    | 物流、有效连接与焦点 |
| 朱红故障 | `--signal-fault`   | 阻塞和危险动作       |
| 工业显示 | `--font-display`   | 设备名和分区标题     |
| 中性说明 | `--font-body`      | 教程与操作说明       |
| 表格数字 | `--font-data`      | 资金、吞吐、容量     |

统一使用 4px 间距阶梯与 2px / 6px 圆角。状态会同时显示文字、图形和颜色，
动画仅表现权威快照而不会写回 simulation。

## 目标结构

```text
GameApp (session 订阅和 command adapter)
├─ GameHud (资金、吞吐、目标、速度)
├─ BuildCatalog (渐进解锁、建造选项)
├─ FactoryBoard (位置、端口交互、视觉 projection)
├─ Inspector (选中设备的玩家语言说明)
├─ ToolDock (撤销、当前工具和键盘提示)
└─ TutorialCoach (画布锚定的第一步引导)
```

这些组件只读取快照或调用 `GameSession` 的 command adapter；节点、线路、经济和
解锁规则仍由 domain/simulation 决定。
