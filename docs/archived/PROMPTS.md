You are pair-programming in a TypeScript monorepo for a Web3 insurance MVP.

Repository:
- apps/api (NestJS + Prisma)
- apps/admin (Next.js)
- apps/mobile (React Native + Expo)
- packages/types, packages/ui, contracts

Task:
<一句话目标：例如 “实现 POST /policies 创建保单 + zod 校验 + Prisma 写库 + 审计日志”>

Constraints:
- Follow CODEX.md, strict TypeScript (TS5), no any.
- Validate all inputs with zod at boundaries.
- Amount handled as string → parseUnits with known decimals (USDT 18).
- JWT required; verify JWT.address === payload.address for writes.
- Ethers v6; never infinite ERC20 approvals.

Acceptance:
- Provide patch as path-addressed code blocks (only necessary files).
- Include unit tests (api: supertest; web/rn: testing-library).
- Build steps and commands to run tests locally.

Paths & interfaces to use:
<贴出相关文件路径、DTO 类型、接口定义（从 packages/types 拿）>
