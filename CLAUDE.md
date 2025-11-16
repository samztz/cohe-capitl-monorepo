# CLAUDE.md — Using Claude Code Effectively in This Monorepo
This guide defines **how** to collaborate with Claude Code (and other AI pair programmers) so the output remains **readable, maintainable, and secure**.

---

## 1. Prompt Contract (ALWAYS include)
When asking Claude to write/change code, provide:
1) **Goal** (business outcome).  
2) **Context** (repo path, framework, constraints).  
3) **Interfaces** (DTOs/types/ABI).  
4) **Acceptance Criteria** (compiles, tests, logs).  
5) **Security constraints** (no PII, validation, auth).

**Template**
```
You are pair-programming in a TypeScript monorepo for a Web3 insurance MVP.
Path: apps/api/src/modules/policy/policy.controller.ts
Goal: implement POST /policies with zod validation, Prisma create, and audit log.
Constraints: NestJS 10, Prisma 5, strict TS, decimal amounts, SIWE-JWT auth.
Interfaces: see packages/types/policy.ts.
Acceptance: ts builds, unit tests pass, logs contextual errors.
Security: validate address format, ensure JWT.address === payload.address.
```

---

## 2. Code Style Expectations
- Follow **CODEX.md** standards strictly.
- Prefer **small, composable functions**; avoid monolithic outputs.
- Include **inline comments** only for non-obvious logic (“why”).
- All inputs validated via **zod**; never trust `any` from the client.

---

## 3. Patch Format
- Ask for **path-addressed code blocks** or **unified diffs** only.
- Include **new files** with full paths.
- Provide **post-change build/test commands**.

---

## 4. Security Guardrails (Claude must obey)
- No direct use of unvalidated addresses.
- Amounts handled as strings → `parseUnits` with decimals.
- No infinite token approvals.
- No secrets in code; use env.
- Avoid dangerous Node APIs.

---

## 5. Testing with Claude
- Request tests together with code:
  - API: `*.spec.ts` using supertest.
  - Contracts: Foundry tests with revert reasons.
  - RN components: react-native-testing-library.
- **Test Script Organization** (MANDATORY):
  - ✅ Unit/integration tests: Place in `apps/{app}/test/` or `apps/{app}/src/**/*.spec.ts`
  - ✅ Manual test scripts: Place in `scripts/tests/` (e.g., `test-api.mjs`, `test-policy.sh`)
  - ✅ Test documentation: Place in `docs/` or `docs/archived/` for outdated docs
  - ❌ **NEVER** create test files in project root
  - ❌ **NEVER** create test files scattered across random directories

---

## 6. Refactoring Tasks
- Provide before/after goal; set non-functional constraints (complexity, duplication).
- Require migration notes if changing public shapes.

---

## 7. Web3-Specific Prompts
- Always specify `chainId`, decimals, and revert messages.
- For ethers v6: typed helpers, no global mutable singletons.
- For Solidity: CEI pattern, events, access control, NatSpec & tests.

---

## 8. Review Checklist
- ✅ Types strict
- ✅ Inputs validated
- ✅ Logs contextual
- ✅ Secure by default
- ✅ Tests present
- ✅ Docs updated

---

## 9. Example "Good" Prompt
```
Create Next.js page at apps/web/src/app/policy/create/page.tsx
- Form: react-hook-form + zod
- Fields: amount(USDT), sku select, accept terms
- Submit -> POST /policy with JWT & address
- Show success toast, navigate to /policy/[id]
- Include client-side validation
- Use TanStack Query for API calls
```

---

## 10. Workflow
Draft with Claude → run locally → paste exact error output → iterate → open PR.
Keep diffs focused and reference paths precisely.

---

## 11. Progress Tracking (MANDATORY)

**每次完成一个功能模块（task）后，Claude Code 必须执行以下操作：**

### 📝 更新 `docs/CHANGELOG.md`

在文件**顶部**添加新条目，记录：

1. **功能标题** - 简明描述完成的功能
2. **实现细节** - 关键技术点和业务逻辑
3. **相关文件** - 使用代码块列出所有新增/修改的文件路径
4. **环境变量** - 如果引入新的环境变量
5. **测试方法** - API 调用示例或测试命令
6. **注意事项** - 重要的配置、限制或待办事项

**格式示例**:
```markdown
## [YYYY-MM-DD] - 功能模块名称

### ✅ Added - 功能简述

**功能**: 详细说明

**实现细节**:
- 关键点 1
- 关键点 2

**相关文件**:
\```
path/to/file1.ts
path/to/file2.ts
\```

**注意事项**:
- 重要提醒
```

### 🗓️ 更新 `docs/project_state.md`

修改对应 Epic 下的任务状态：

- ⚪ 待做 → 🟡 进行中 (开始实现时)
- 🟡 进行中 → ✅ 完成 (完成后)

**示例**:
```markdown
| #5 | SKU 模块 (产品列表 CRUD + Mock 数据) | ✅ 完成 | Samztz |
| #6 | Policy 模块 (创建/签署/状态更新)      | ✅ 完成 | Samztz |
| #7 | Payment 模块 (链上或 Mock 支付确认接口) | ✅ 完成 | Samztz |
| #8 | Admin 审核流程接口 + 承保倒计时逻辑     | ⚪ 待做 | Samztz |
```

### 📊 更新统计数据

如果完成了 Epic 中的最后一个任务，在 CHANGELOG.md 的统计区域更新 Epic 完成度：

```markdown
### Epic 1: 后端基础设施 - ✅ 100% 完成
```

### ⚠️ 强制性规则

**Claude Code 在完成任何功能后，必须：**

1. ✅ 在 CHANGELOG.md 顶部添加详细条目
2. ✅ 更新 project_state.md 中的任务状态
3. ✅ 告知用户已更新这两个文件
4. ✅ 如果用户要求中文总结，用中文简述完成内容

**禁止行为**:
- ❌ 跳过文档更新
- ❌ 仅口头告知不写入文件
- ❌ 文档与代码不同步

### 📋 完成任务的标准输出模板

```
## ✅ [功能名称] 已完成

**完成内容**:
- 功能点 1
- 功能点 2

**相关文件**:
- path/to/file1.ts
- path/to/file2.ts

**文档已更新**:
- ✅ docs/CHANGELOG.md - 添加了详细实现记录
- ✅ docs/project_state.md - 任务状态更新为 "✅ 完成"

**测试命令**:
\```bash
curl -X POST http://localhost:3001/api/endpoint
\```
```

---

## 12. Example Complete Workflow

```
用户: 实现 Admin 审核 API

Claude:
1. 理解需求 → 确认接口设计
2. 创建 admin.controller.ts, admin.service.ts
3. 编写代码 → 测试通过
4. 更新 docs/CHANGELOG.md (顶部添加条目)
5. 更新 docs/project_state.md (#8 任务状态 ⚪→✅)
6. 输出完成总结（中文）

✅ Admin 审核模块已完成
- GET /admin/policies?status=under_review
- PATCH /admin/policies/:id (approve/reject)

文档已更新:
- docs/CHANGELOG.md
- docs/project_state.md
```

---

**记住**：代码质量 = 实现 + 文档 + 测试。缺一不可。