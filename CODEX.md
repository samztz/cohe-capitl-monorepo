# CODEX.md — Web3 Insurance MVP Code Standards & Engineering Guide
> Purpose: Produce **readable, maintainable, secure** code across Web2 (RN/Next/Nest) and Web3 (Solidity, ethers).  
> Scope: Monorepo (`apps/mobile`, `apps/admin`, `apps/api`, `contracts`, `packages/*`).  
> Audience: All contributors (including AI coding assistants).

---

## 1. Core Principles (R-A-M-S)
- **Readable**: Prefer clarity over brevity. Make code "grep-able".
- **Auditable**: Log key actions; deterministic behavior; avoid hidden magic.
- **Maintainable**: Small modules, typed boundaries, zero implicit globals.
- **Secure**: Defensive checks; least privilege; explicit trust boundaries.

**Golden Rules**
- Fewer surprises > fewer lines.  
- Fail fast, fail loud, fail with context.  
- Comments explain **why**, code shows **what**.  
- One file = one responsibility.

---

## 2. Languages & Versions
- TypeScript ≥ 5.x, `strict: true`
- Node 20 LTS
- React 18, React Native (Expo SDK current), Next.js 14 App Router
- NestJS 10 with Fastify
- Prisma 5.x
- Solidity ^0.8.20 (checked with Foundry/Hardhat)

---

## 3. Project Structure (Monorepo)
```
apps/
  mobile/           # React Native DApp
  admin/            # Next.js dashboard
  api/              # NestJS API
packages/
  ui/               # shared UI
  types/            # shared DTO/TS types
  config/           # eslint, tsconfig, prettier
contracts/
  PremiumCollector/ # smart contracts
infra/
  docker/           # compose, infra as code
  scripts/          # data/ops scripts
```
**Do not** import across apps directly; only import from `packages/*`.

---

## 4. TypeScript Standards
- Enable `noImplicitAny`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- No `any`/`unknown` escaping at boundaries; prefer **zod** parse for inputs.
- Use **narrow types** for IDs & addresses:
  ```ts
  type Address = `0x${string}`
  type PolicyId = string & { readonly brand: unique symbol }
  ```
- Export DTOs from `packages/types` and reuse on client & server.

---

## 5. Naming & Layout
- Files: `kebab-case.tsx`, tests `*.spec.ts` (api) or `*.test.tsx` (web/mobile).
- Components: `PascalCase`, hooks `useXxx`, providers `XxxProvider`.
- API routes/controller names reflect resource: `/policies`, `/claims`.
- Avoid generic names (`utils.ts`); prefer domain names (`policy.service.ts`).

---

## 6. Error Handling & Logging
- Never swallow errors. Always add context:
  ```ts
  try { ... } catch (e) {
    logger.error({ err: e, policyId }, "policy activation failed")
    throw new HttpException("ACTIVATE_FAILED", 500)
  }
  ```
- Centralize API error shapes `{ code, message, details? }`.
- Use **pino** (api) with request-id correlation. No `console.log` in prod.
- React Native/Next: report to Sentry with `fingerprint`, **no PII**.

---

## 7. API Design (NestJS)
- REST first. Paths are nouns; actions via method or `/:id/action`:
  - `POST /policies/:id/approve`
- Validation:
  - **zod** at controller boundary; map to typed DTO.
- Auth:
  - SIWE → short-lived JWT (15m) + refresh.
  - Match JWT `address` with payload `address` for write operations.
- Idempotency:
  - For payment webhooks/listeners accept `Idempotency-Key` (or composite key).

---

## 8. Data Layer (Prisma)
- Use **decimal** for on-chain amounts. Convert with helper:
  ```ts
  export const toWei = (v: string|number, decimals=18) => parseUnits(v.toString(), decimals)
  ```
- Migrations are reviewed in PR. **Never edit applied migrations**; create new one.
- Unique constraints: `(walletAddress, skuId)` for “single-address single-policy”.

---

## 9. React / React Native
- State: **TanStack Query** for server-cache, **Zustand** for local UI state.
- Components are **pure**; side effects in hooks.
- Network:
  - Wrap `fetch`/axios with a typed client; inject `Authorization: Bearer`.
  - Handle 401 → refresh → retry once.
- UI:
  - Accessibility: `accessible`, `aria-*` (web), `testID` (RN).
- Forms:
  - **react-hook-form + zodResolver**; never trust uncontrolled inputs.

---

## 10. Next.js Admin
- App Router; data fetching via server actions or route handlers (typed).
- Avoid client-side secrets; read from env on server components only.
- Table pages use **TanStack Table**; paginate on server.

---

## 11. Web3 (ethers.js)
- Use **ethers v6**. No global provider singletons; DI per feature.
- Always specify `chainId`. Reject tx if `chainId` mismatch.
- For BEP-20:
  - Read decimals once and cache.
  - Always `approve` exact amount; no infinite approvals.
- Address & Hash types:
  ```ts
  type Hash = `0x${string}`
  function assertAddress(a: string): asserts a is Address { ... }
  ```

---

## 12. Solidity Standards
- Version pragma pinned `^0.8.20`; enable optimizer.
- **SPDX-License-Identifier** in every file.
- Use OpenZeppelin libraries; avoid custom ERC20.
- Checks-Effects-Interactions pattern; ReentrancyGuard when transferring.
- Events for every state change; emit before external calls.
- No storage of PII. Only store opaque IDs.
- Minimal surface:
  - `PremiumCollector`: `purchasePolicy(policyId, amount, token)` only.
- Security checklist before deploy:
  - No owner footguns; treasury is a multisig (Safe).
  - Pausable if funds flow through contract.
  - `onlyTreasury`/`onlyOwner` with clear separation of concerns.
- Tests:
  - **Foundry**: `forge test -vvvv`, 90%+ line coverage on business logic.

---

## 13. Secrets & Config
- All secrets via env; never commit `.env`.
- In monorepo: each app has its own `.env`; for local dev can symlink from root.
- Use **dotenv-expand** for variable composition; document required envs in `README`.

---

## 14. Security & Compliance
- Rate limit write endpoints. CSRF not needed for JWT + SPA.
- Validate uploaded files (mime, size). Store in private bucket (R2/S3) with signed URLs.
- Audit log every privileged action `{actor, action, subject, at, ip}`.
- Blocklist suspicious addresses; document AML/KYT process (off-chain).

---

## 15. CI/CD
- PR: lint + typecheck + unit tests + prisma migrate diff.
- `main`: build & deploy via GitHub Actions to Railway/Vercel.
- Tag releases `vX.Y.Z`; generate changelog from conventional commits.

---

## 16. Git Hygiene & Reviews
- Conventional commits:
  - `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `ci:`
- Small PRs (≤ 400 lines). Include screenshots for UI.
- Reviewer checklist:
  - ✅ Names clear, ✅ types strict, ✅ errors contextual, ✅ tests exist, ✅ no secret leaks.

---

## 17. Testing Strategy
- API: Jest + supertest; happy + sad paths.
- RN: vitest/react-native-testing-library for components; Detox for flows (smoke).
- Contracts: Foundry tests per function; revert reasons asserted.
- E2E (optional): Playwright hitting admin + api (test env).

---

## 18. Documentation
- Each feature folder has a `README.md`: purpose, inputs, outputs, edge cases.
- Public docs live in root `README.md` and `/docs` with diagrams (Mermaid).

---

## 19. Examples

**Zod-boundary controller**
```ts
const CreatePolicy = z.object({
  skuId: z.string().uuid(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
})
type CreatePolicy = z.infer<typeof CreatePolicy>

@Post()
async create(@Body() body: unknown) {
  const input = CreatePolicy.parse(body)
  return this.svc.create(input)
}
```

**RN typed fetch wrapper**
```ts
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}
```