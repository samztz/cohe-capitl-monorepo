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

## 9. Example “Good” Prompt
```
Create React Native screen at apps/mobile/src/screens/BuyPolicy.tsx
- Form: react-hook-form + zod
- Fields: amount(USDT), sku select, accept terms
- Submit -> POST /policy with JWT & address
- Show toast, navigate to PolicyDetail
- Include unit test
```

---

## 10. Workflow
Draft with Claude → run locally → paste exact error output → iterate → open PR.  
Keep diffs focused and reference paths precisely.