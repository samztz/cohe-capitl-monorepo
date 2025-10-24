## What
简述改动

## Why
业务动机 & 用户价值

## How
关键实现点（校验、错误处理、日志、依赖注入）

## Tests
- [ ] 单元测试
- [ ] 手动验证步骤（命令/截图）

## Security
- [ ] 输入校验(zod)
- [ ] 金额精度（decimal/parseUnits）
- [ ] 地址校验(0x…)
- [ ] JWT.address 与写入地址一致
- [ ] 无无限 approve / 无泄露 .env

## Checklist
- [ ] 跑过 `pnpm typecheck && pnpm test`
- [ ] 变更范围 ≤ 400 行
- [ ] 相关文档更新