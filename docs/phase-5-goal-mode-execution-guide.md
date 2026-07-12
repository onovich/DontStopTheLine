# Phase 5 存档与桌面端 Goal 模式执行指南

状态：READY；预算 10 轮（1-8 实现、9 缓冲、10 验收）。

## Goal Prompt

实现版本化存档、导入导出与损坏恢复，并增加 Electron 安全桌面壳。存档保存 simulation 权威快照、内容版本、seed、tick 与 UI 偏好；迁移单向、可测试。Electron 使用 contextIsolation、关闭 nodeIntegration、仅通过窄 preload IPC 访问文件存储。每轮验证、commit、push 后推进。

## 范围

1-2 存档 schema/校验/迁移；3 Web IndexedDB 适配器；4 导入导出/损坏恢复；5 平台 storage port；6 Electron main/preload/IPC；7 打包 Windows/macOS/Linux 配置；8 恢复与安全测试；9 修复；10 完整验收。

## 非范围与 PASS

不做云同步、账户、联网或动态市场。冻结安装、check、build、smoke、diff check 全绿；存档 round-trip/迁移/拒绝损坏输入测试；Electron 无 renderer Node 权限、IPC 白名单测试、至少 Windows 打包 smoke。
