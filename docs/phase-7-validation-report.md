# Phase 7 内测可玩性与视觉重构报告

状态：READY_FOR_CHECK

## 交互与可玩性证据

- 首局路径由 Playwright 覆盖：放置基础加工器，再用原料源输出端拖到加工器输入端、加工器输出端拖到售卖站输入端；精确断言两条线路且现金增长。
- 端口在 390px 视口中经 `boundingBox` 断言有效命中区不小于 44×44 CSS 像素；键盘 Enter 可启动/完成连接。
- 非法放置会显示占位或越界原因；建造规则当前为免费，ghost 明确展示“免费”。
- 建造抽屉仅初始展示三个设备；移动端使用底部抽屉，Escape 关闭并将焦点返还给“建造设备”。

## 视觉与响应式证据

- before：`artifacts/visual/phase-7-before-verified-*`。
- after：`artifacts/visual/phase-7-responsive-repair-*`，覆盖 1440×900、1024×768、768×1024、390×844、320×568 和移动端抽屉打开状态。
- 工厂画布是首屏主体；空检查器不占用布局宽度；移动端使用紧凑“产线别停 / DSTL”锁定字标。
- 390 与 320 视觉测试断言页面无横向溢出，HUD、设置、端点设备和工厂画布的边界均在视口内。

## 架构结论

界面只读取 `GameSession` 快照并通过既有 command adapter 调用；simulation/domain 没有 UI 规则回写，dependency-cruiser 维持零违规。

## 最终验证

- `CI=true pnpm install --frozen-lockfile`
- `pnpm check`
- `pnpm build`
- `CI=true pnpm smoke`
- `git diff --check`

## 剩余内测风险

- 需要真实触控设备复核端口拖拽手感与屏幕阅读器的叙述顺序。
- 高级迷宫设备需在完整解锁路径上进行一次人工视觉复核。
