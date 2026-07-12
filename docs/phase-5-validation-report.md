# Phase 5 存档与桌面端验收报告

状态：READY_FOR_CHECK

## 交付

- `@dstl/persistence` 提供版本化 schema、导入导出、round-trip 校验与损坏/未知版本拒绝。
- `@dstl/platform` 提供与业务无关的存储 port、内存测试实现和 IndexedDB 适配器。
- `apps/desktop` 使用 `contextIsolation: true`、`nodeIntegration: false` 和受限 preload；仅允许 `save:load` 与 `save:write` IPC。

## 验证

- `CI=true pnpm install --frozen-lockfile`
- `pnpm check`（含 dependency-cruiser 0 violations）
- `pnpm build`
- `CI=true pnpm smoke`
- `git diff --check`

## 延后范围

云同步、账户、联网与动态市场均未引入。
