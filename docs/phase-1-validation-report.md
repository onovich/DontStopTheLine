# Phase 1 确定性模拟内核验收报告

状态：PASS

## 交付

- `@dstl/domain` 的 command、event、节点/配方与拒绝结果可判别合同。
- `@dstl/simulation` 的版本化 state、seed PRNG、稳定队列排序、逻辑 tick、不可变快照与 replay。
- 源点生产、加工器 ore→plate、储存器、售卖器及资金增长的 headless P0 闭环。
- 线路在途容量、目标槽原子预留、下一 tick 到达，以及只读状态/统计 selectors。
- `@dstl/testkit` 的固定盈利场景和字节等价黄金 snapshot。

## 轮次

| 轮次 | Commit    | 内容                                      |
| ---- | --------- | ----------------------------------------- |
| 1    | `896417d` | domain/content contracts                  |
| 2    | `a7f6bb8` | deterministic state and queue primitives  |
| 3    | `68f0d90` | node buffers and tick production          |
| 4    | `beaeac0` | reserved-capacity line transport          |
| 5    | `1a381f6` | processor/seller money flow               |
| 6    | `e1b0551` | read-only selectors                       |
| 7    | `003ee84` | replay snapshot verification              |
| 8    | `d3aa942` | golden scenario, testkit and API docs     |
| 9    | `538c331` | work slots and logical tick timing repair |

## 覆盖

- 命令非法/未知实体拒绝且不修改原 state。
- `NO_INPUT`、`OUTPUT_FULL`、`WORKING`、`NO_CONSUMER`、`TARGET_FULL`、`LINE_FULL`、
  `RECIPE_MISMATCH`、`SELLER_BUSY` 均有公开解释 API。
- 相同 seed 与 command stream 的 snapshot 字节等价；盈利场景增加资金。
- Source、processor 与 seller 的工作项和 `workUntil` 跨逻辑 tick 保持，storage 独立转发输入与输出缓冲。

## 最终验证

- `CI=true pnpm install --frozen-lockfile`
- `pnpm check`
- `pnpm build`
- `pnpm smoke`
- `git diff --check`

以上命令均通过；simulation/domain 不依赖 UI、Canvas、Electron、存储或平台 API，且架构检查为
0 violations。
