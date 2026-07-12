# Phase 6 性能与发布候选报告

状态：READY_FOR_CHECK

## 性能基准

- `@dstl/testkit` 提供固定 seed 的 1,000 节点、500 条线路、20 tick 重放场景。
- 基准在当前验证环境中完成约 321 ms；报告同时给出节点数与逻辑 tick，便于后续重复比较。
- 该场景通过公开 simulation API 重放，未修改权威规则或以删减内容换取时间。

## 发布候选清单

- Web 构建与 Playwright smoke 通过。
- Desktop 壳保持 context isolation、关闭 renderer Node 权限，并只通过 save IPC 白名单访问本地文件。
- 存档 schema 的 round-trip 和损坏拒绝由 persistence 单元测试覆盖。

## 已知风险

- Electron 包仅进行语法/安全壳 dry-run；正式平台签名和安装器分发仍需发行环境完成。
- IndexedDB 的浏览器实机配额与崩溃恢复需要在目标浏览器矩阵中继续演练。

## 验证

- `CI=true pnpm install --frozen-lockfile`
- `pnpm check`（dependency-cruiser 0 violations）
- `pnpm build`
- `CI=true pnpm smoke`
- `git diff --check`
