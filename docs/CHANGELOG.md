# 📝 CHANGELOG - Cohe Capital 开发日志

> **规则**：每次完成一个功能模块（task）后，Claude Code 必须在此文件顶部添加新条目，记录完成时间、功能、相关文件和注意事项。

---

## [2025-11-16] - 🔓 修复 Admin 认证 & 公开 Treasury 接口 ✅ 完成

### ✅ Fixed - Admin Settings 401 Unauthorized Error

**问题 1**:
Admin 管理后台访问 `/admin/settings/treasury` 时报错 401 Unauthorized。

**原因**:
- Admin 应用使用 mock token (`demo-admin-token`)
- 后端原本使用 `JwtAuthGuard`，需要真实的 JWT token 和 User 表中的记录

**问题 2**:
普通用户的支付页面也访问 `/admin/settings/treasury`，同样报错 401。

**解决方案**:
1. 创建 `AdminGuard` 用于 Admin 端点的简单 token 验证
2. 创建公开的 Treasury 地址查询接口供普通用户使用

**实现细节**:

#### 1. **新增 AdminGuard (apps/api/src/modules/auth/admin.guard.ts)**

简单的 Admin 认证 Guard，用于开发/演示环境：
```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const [type, token] = authHeader.split(' ');

    // 验证 token 是否匹配环境变量或默认值
    const validAdminToken = process.env.ADMIN_TOKEN || 'demo-admin-token';
    if (token !== validAdminToken) {
      throw new UnauthorizedException('Invalid admin token');
    }
    return true;
  }
}
```

**⚠️ 安全提示**: 这仅用于演示环境！生产环境应使用:
- 独立的 Admin JWT 认证
- 基于角色的访问控制 (RBAC)
- 多因素认证 (MFA)

#### 2. **更新 Admin 端点使用 AdminGuard**

**AdminController** (`apps/api/src/modules/admin/admin.controller.ts`):
```typescript
@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminGuard)  // 改用 AdminGuard
@ApiBearerAuth()
export class AdminController { ... }
```

**SettingsController** (`apps/api/src/modules/settings/settings.controller.ts`):
```typescript
@ApiTags('Admin Settings')
@Controller('admin/settings')
@UseGuards(AdminGuard)  // 改用 AdminGuard
@ApiBearerAuth()
export class SettingsController { ... }
```

#### 3. **新增公开 Settings Controller**

**PublicSettingsController** (`apps/api/src/modules/settings/public-settings.controller.ts`):
```typescript
@ApiTags('Public Settings')
@Controller('settings')
export class PublicSettingsController {
  @Get('treasury-address')
  @ApiOperation({ summary: 'Get treasury address (public)' })
  async getTreasuryAddress(): Promise<{ address: string | null }> {
    const address = await this.settingsService.getTreasuryAddress();
    return { address };
  }
}
```

**特点**:
- 无 `@UseGuards(JwtAuthGuard)` - 不需要认证
- 使用 `/settings/treasury-address` 路径（不在 `/admin` 前缀下）
- 只读取功能，无安全风险

#### 4. **注册新 Controller**

**SettingsModule** (`apps/api/src/modules/settings/settings.module.ts`):
```typescript
@Module({
  imports: [PrismaModule],
  controllers: [SettingsController, PublicSettingsController], // 添加 PublicSettingsController
  providers: [SettingsService],
  exports: [SettingsService],
})
```

#### 5. **前端更新 API 路径**

**PolicyPaymentPage** (`apps/web/src/app/policy/payment/[policyId]/page.tsx:105`):
```typescript
// 修改前: '/admin/settings/treasury' (需要认证)
// 修改后: '/settings/treasury-address' (公开)
const treasuryResponse = await apiClient.get<TreasurySettings>('/settings/treasury-address')
```

**相关文件**:
```
apps/api/src/modules/auth/admin.guard.ts (NEW)
apps/api/src/modules/settings/public-settings.controller.ts (NEW)
apps/api/src/modules/settings/settings.controller.ts (MODIFIED)
apps/api/src/modules/settings/settings.module.ts (MODIFIED)
apps/api/src/modules/admin/admin.controller.ts (MODIFIED)
apps/web/src/app/policy/payment/[policyId]/page.tsx (MODIFIED)
apps/api/.env.example (MODIFIED)
```

**测试验证**:
```bash
# 1. 公开接口 - 无需认证 ✅
curl http://localhost:3001/settings/treasury-address
# => {"address":"0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"}
# HTTP 200 OK

# 2. Admin 接口 - 使用 demo-admin-token ✅
curl -H "Authorization: Bearer demo-admin-token" \
  http://localhost:3001/admin/settings/treasury
# => {"address":"0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"}
# HTTP 200 OK

# 3. Admin 接口 - 无 token 时拒绝 ✅
curl http://localhost:3001/admin/settings/treasury
# => {"message":"No authorization header","error":"Unauthorized","statusCode":401}
# HTTP 401 Unauthorized

# 4. Admin PUT 接口 - 使用 token 可以更新 ✅
curl -X PUT -H "Authorization: Bearer demo-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"address":"0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"}' \
  http://localhost:3001/admin/settings/treasury
# => {"success":true,"address":"0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199"}
# HTTP 200 OK

# 5. Admin stats 接口 ✅
curl -H "Authorization: Bearer demo-admin-token" \
  http://localhost:3001/admin/stats
# => {"total":9,"underReview":1,"approvedToday":4,"rejectedToday":1}
# HTTP 200 OK

# 6. 前端构建成功 ✅
pnpm build
# => ✓ Compiled successfully
```

**注意事项**:
- ✅ Admin 后台现在可以正常访问设置页面
- ✅ Admin Guard 使用简单的 token 验证（开发/演示用）
- ✅ Treasury 地址通过公开接口提供给普通用户
- ✅ API 语义清晰：`/settings/*` 公开，`/admin/*` 需要 admin token
- ⚠️ **生产环境需要替换 AdminGuard 为真实的 JWT 认证 + RBAC**

**环境变量配置** (apps/api/.env):
```bash
# Admin Authentication (可选，默认为 demo-admin-token)
ADMIN_TOKEN=demo-admin-token
```

---

## [2025-11-16] - 🏷️ 添加 tokenSymbol 字段 & BSC Testnet SKU ✅ 完成

### ✅ Added - tokenSymbol Field to SKU Model & Testnet Product

**功能**:
1. 在 SKU 模型中添加 `tokenSymbol` 字段（例如 "USDT", "USDC", "BNB"）
2. 通过 `/products` API 返回 tokenSymbol 给前端使用
3. 新增测试网 SKU: "YULILY SHIELD TESTNET" (BSC Testnet, chainId 97)

**实现细节**:

#### 1. **数据库 Schema 更新**

**Prisma Schema** (`apps/api/prisma/schema.prisma`):
```prisma
model Sku {
  id           String   @id @default(uuid())
  name         String
  chainId      Int
  tokenAddress String
  tokenSymbol  String   // NEW: Token symbol (e.g., "USDT", "USDC", "BNB")
  termDays     Int      @default(90)
  premiumAmt   Decimal  @db.Decimal(38, 18)
  coverageAmt  Decimal  @db.Decimal(38, 18)
  termsUrl     String
  status       String   @default("active")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  policies     Policy[]
}
```

**数据库迁移** (通过 seed.ts 自动应用):
- 添加 `tokenSymbol` 列为 nullable
- 为现有行设置默认值 "USDT"
- 设置 NOT NULL 约束

#### 2. **后端 API 更新**

**ProductResponseDto** (`apps/api/src/modules/products/dto/product-response.dto.ts`):
```typescript
@ApiProperty({
  description: 'Token symbol (e.g., USDT, USDC, BNB)',
  example: 'USDT',
  pattern: '^[A-Z]{2,10}$',
})
tokenSymbol!: string;
```

#### 3. **Seed 数据更新** (`apps/api/prisma/seed.ts`)

**SKU 1 - BSC Mainnet (已存在，更新)**:
```typescript
{
  id: 'bsc-usdt-plan-seed',
  name: 'YULILY SHIELD INSURANCE',
  chainId: 56,
  tokenAddress: '0x55d398326f99059fF775485246999027B3197955',
  tokenSymbol: 'USDT',
  termDays: 90,
  premiumAmt: '100.0',
  coverageAmt: '10000.0',
  termsUrl: 'https://example.com/terms/yulily-shield',
  status: 'active',
}
```

**SKU 2 - BSC Testnet (新增)**:
```typescript
{
  id: 'bsc-testnet-usdt-plan-seed',
  name: 'YULILY SHIELD TESTNET',
  chainId: 97,
  tokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
  tokenSymbol: 'USDT',
  termDays: 90,
  premiumAmt: '100.0',
  coverageAmt: '10000.0',
  termsUrl: 'https://example.com/terms/yulily-shield-testnet',
  status: 'active',
}
```

**Migration Helper Function** (内置于 seed.ts):
```typescript
async function ensureTokenSymbolColumn() {
  // Adds tokenSymbol column if not exists
  // Sets default values for existing rows
  // Sets NOT NULL constraint
}
```

#### 4. **前端类型更新**

**BackendSku Interface** (`apps/web/src/types/index.ts`):
```typescript
export interface BackendSku {
  id: string;
  name: string;
  chainId: number;
  tokenAddress: string;
  tokenSymbol: string; // NEW
  decimals: number;
  premiumAmt: string;
  coverageAmt: string;
  termDays: number;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
```

**Product Interface** (`apps/web/src/types/index.ts`):
```typescript
export interface Product {
  // ... existing fields
  tokenSymbol?: string; // NEW
}
```

**mapProduct Utility** (`apps/web/src/utils/index.ts`):
```typescript
export function mapProduct(sku: BackendSku): Product {
  return {
    // ... existing mappings
    tokenSymbol: sku.tokenSymbol, // NEW
  };
}
```

**相关文件**:
```
# Database
apps/api/prisma/schema.prisma (新增 tokenSymbol 字段)
apps/api/prisma/migrations/20251116_add_token_symbol/migration.sql (迁移 SQL)
apps/api/prisma/seed.ts (迁移逻辑 + 测试网 SKU)

# Backend
apps/api/src/modules/products/dto/product-response.dto.ts (DTO 更新)

# Frontend
apps/web/src/types/index.ts (类型定义)
apps/web/src/utils/index.ts (映射函数)
```

**测试验证**:
```bash
# 1. Run seed to apply migration and create SKUs
pnpm --filter api seed
# ✅ 成功：两个 SKU 创建/更新，tokenSymbol 列已添加

# 2. Verify /products API
curl http://localhost:3001/products | jq '.'
# ✅ 返回:
# [
#   {
#     "id": "bsc-usdt-plan-seed",
#     "name": "YULILY SHIELD INSURANCE",
#     "chainId": 56,
#     "tokenSymbol": "USDT",  <-- ✅
#     ...
#   },
#   {
#     "id": "bsc-testnet-usdt-plan-seed",
#     "name": "YULILY SHIELD TESTNET",
#     "chainId": 97,  <-- ✅ BSC Testnet
#     "tokenSymbol": "USDT",  <-- ✅
#     ...
#   }
# ]

# 3. Build verification
pnpm --filter api build   # ✅ 成功
pnpm --filter web build   # ✅ 成功
```

**注意事项**:
- ⚠️ BSC Testnet USDT 地址 `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd` 是占位符，需要验证实际地址
- 可以在 `.env` 中配置测试网代币地址
- tokenSymbol 字段建议使用大写字母（USDT, USDC, BNB）
- 前端现在可以直接使用 `product.tokenSymbol` 而无需通过 tokenAddress 推断

**构建验证**:
```bash
pnpm --filter api build   # ✅ 成功
pnpm --filter web build   # ✅ 成功
```

---

## [2025-11-16] - 🔧 修复保单金额计算精度问题 ✅ 完成

### ✅ Fixed - Insurance Amount/Cost Calculation Precision

**问题**: 当 Insurance Amount < 1 时，Insurance Cost 始终显示为 0，无法正确计算小数值的保费

**根本原因**:
- 双向绑定计算中使用了 `Math.round(amount * premiumRate * 100) / 100`
- 这会将小于 0.005 的结果四舍五入为 0
- 例如：amount = 0.5, premiumRate = 0.01 → cost = 0.005 → Math.round(0.005 * 100) / 100 = 0

**修复方案**: 移除 floor/round 操作，使用精确的小数计算

**实现细节**:

#### 1. **计算逻辑修复** (`apps/web/src/app/policy/form/[productId]/page.tsx`)

**修复前**:
```typescript
// Amount → Cost 计算
const calculatedCost = Math.round(amount * premiumRate * 100) / 100
// Cost → Amount 计算
const calculatedAmount = Math.round((cost / premiumRate) * 100) / 100
```

**修复后**:
```typescript
// Amount → Cost 计算
const calculatedCost = amount * premiumRate
const formattedCost = parseFloat(calculatedCost.toFixed(6))

// Cost → Amount 计算
const calculatedAmount = cost / premiumRate
const formattedAmount = parseFloat(calculatedAmount.toFixed(6))
```

#### 2. **显示逻辑修复** (Overview 部分)

**修复前**:
```typescript
// Insurance Amount 显示
{`${Math.floor(parseFloat(watchedAmount)).toLocaleString()} ${tokenSymbol}`}
// Insurance Cost 显示
{`${Math.floor(parseFloat(watchedCost)).toLocaleString()} ${tokenSymbol}`}
```

**修复后**:
```typescript
// Insurance Amount 显示
{`${parseFloat(parseFloat(watchedAmount).toFixed(6)).toLocaleString()} ${tokenSymbol}`}
// Insurance Cost 显示
{`${parseFloat(parseFloat(watchedCost).toFixed(6)).toLocaleString()} ${tokenSymbol}`}
```

**技术决策**:
- 使用 `toFixed(6)` 保留 6 位小数精度（足够处理 USDT 等代币）
- 使用 `parseFloat()` 移除尾随零（0.100000 → 0.1）
- 保持双向绑定实时计算的准确性

**相关文件**:
```
apps/web/src/app/policy/form/[productId]/page.tsx
- Line 136-139: Amount → Cost 计算
- Line 151-154: Cost → Amount 计算
- Line 424: Insurance Amount 显示
- Line 438: Insurance Cost 显示
```

**测试案例**:
```
输入 Insurance Amount = 0.5
Premium Rate = 0.01 (1%)
预期 Insurance Cost = 0.005 ✅

输入 Insurance Cost = 0.01
Premium Rate = 0.01
预期 Insurance Amount = 1 ✅

输入 Insurance Amount = 0.123456789
预期显示 = 0.123457 (6位小数) ✅
```

**构建验证**:
```bash
pnpm --filter web build  # ✅ 成功
```

---

## [2025-11-16] - 💰 保单金额字段重构 - 用户自定义保费与保额 ✅ 完成

### ✅ Fixed - Policy Amount Design Flaw

**问题**: 用户在创建保单时输入的保费 (Insurance Cost) 和保额 (Insurance Amount) 被硬编码为 SKU 默认值 (100 和 10000)，而非保存用户实际输入的金额

**根本原因**:
- Policy 表缺少 `coverageAmt` 字段
- 后端仅接收 `skuId`，自动从 SKU 表复制金额
- 前端将用户输入的金额作为 URL 参数传递，未保存到数据库

**修复方案**: 完全重构保单创建流程，将金额从 SKU 模板值改为用户输入值

**实现细节**:

#### 1. **数据库迁移 - 添加 coverageAmt 字段**
- ✅ Prisma Schema: 添加 `coverageAmt Decimal @db.Decimal(38, 18)` 到 Policy 模型
- ✅ 创建自定义迁移 SQL (`20251116043700_add_coverage_amt/migration.sql`):
  - Step 1: 添加列为 nullable
  - Step 2: 从 SKU 表回填现有保单数据
  - Step 3: 设置列为 NOT NULL
- ✅ 执行迁移: `prisma migrate resolve --applied`
- ✅ 重新生成 Prisma Client

#### 2. **后端 API 修改**

**DTO 更新** (`apps/api/src/modules/policy/dto/create-policy.dto.ts`):
```typescript
export class CreatePolicyDto {
  skuId!: string;
  premiumAmt!: string;    // 新增：用户输入保费
  coverageAmt!: string;   // 新增：用户输入保额
}
```

**Service 层** (`apps/api/src/modules/policy/policy.service.ts`):
- ✅ 更新 `CreatePolicyInput` 接口添加 `premiumAmt` 和 `coverageAmt`
- ✅ 更新 `Policy` 接口添加 `coverageAmt` 字段
- ✅ 修改 `createPolicy()` 方法:
  - 接收用户输入的金额
  - 验证金额为正数
  - 保存到数据库而非从 SKU 复制
- ✅ 更新 `getUserPolicies()` 和 `getPolicyById()` 返回 `coverageAmt`

**Controller 层** (`apps/api/src/modules/policy/policy.controller.ts`):
- ✅ 更新 Zod 验证 Schema 添加 `premiumAmt` 和 `coverageAmt`
- ✅ 从请求体提取金额并传递给 Service

#### 3. **前端修改**

**Policy 创建表单** (`apps/web/src/app/policy/form/[productId]/page.tsx`):
```typescript
// Before (错误):
const response = await apiClient.post('/policy', {
  skuId: productId,  // 仅发送 skuId
})
// 金额作为 URL 参数传递，未保存

// After (正确):
const response = await apiClient.post('/policy', {
  skuId: productId,
  premiumAmt: data.insuranceCost,     // 发送用户输入保费
  coverageAmt: data.insuranceAmount,  // 发送用户输入保额
})
```

**My Policies 页面** (`apps/web/src/app/my-policies/page.tsx`):
- ✅ 添加 `coverageAmt` 到 Policy 接口
- ✅ 移除 `getProductCoverage()` 函数
- ✅ 显示 `policy.coverageAmt` 而非 `product.coverageAmt`

**Policy Detail 页面** (`apps/web/src/app/policy/detail/[id]/page.tsx`):
- ✅ 添加 `coverageAmt` 到 Policy 接口
- ✅ 显示 `policy.coverageAmt` 而非 `product.coverageAmt`

**相关文件**:
```
# Database
apps/api/prisma/schema.prisma (新增 coverageAmt 字段)
apps/api/prisma/migrations/20251116043700_add_coverage_amt/migration.sql (迁移 SQL)

# Backend
apps/api/src/modules/policy/dto/create-policy.dto.ts (新增字段)
apps/api/src/modules/policy/policy.service.ts (业务逻辑重构)
apps/api/src/modules/policy/policy.controller.ts (验证 Schema 更新)

# Frontend
apps/web/src/app/policy/form/[productId]/page.tsx (发送金额到 API)
apps/web/src/app/my-policies/page.tsx (显示保单金额)
apps/web/src/app/policy/detail/[id]/page.tsx (显示保单金额)
```

**构建验证**:
```bash
pnpm --filter api exec prisma generate  # ✅ Pass
pnpm --filter api build                  # ✅ Pass
pnpm --filter web build                  # ✅ Pass
```

**重要变更**:
- ⚠️ **破坏性变更**: `POST /policy` API 现在需要 `premiumAmt` 和 `coverageAmt` 字段
- ✅ **向后兼容**: 已有保单的 `coverageAmt` 已从 SKU 回填，不影响现有数据
- 🔒 **数据验证**: 后端验证金额必须为正数

**测试建议**:
```bash
# 1. 创建新保单，输入自定义金额
# 2. 验证保单列表显示正确金额
# 3. 验证保单详情显示正确金额
# 4. 验证 Admin 面板显示正确金额
```

---

## [2025-11-15] - 📋 用户保单列表与详情真实数据集成 ✅ 完成

### ✅ Added - Real Policy Data Integration

**功能**: 将 My Policies 和 Policy Detail 页面从 Mock 数据迁移到真实 API 数据

**实现细节**:

#### 1. **后端 - 新增用户保单列表 API** (`GET /policy/my/list`)
- PolicyController 添加 `getUserPolicies` 端点 (需要 JWT 认证)
- PolicyService 实现查询用户所有保单,按创建时间倒序
- 返回安全字段,不包含敏感数据

#### 2. **前端 - My Policies 页面** (`apps/web/src/app/my-policies/page.tsx`)
- ✅ 移除所有 Mock 数据
- ✅ 调用 `GET /policy/my/list` 和 `GET /products`
- ✅ 自动计算剩余天数 (ACTIVE policies)
- ✅ 动态筛选: All, Active, Pending, Awaiting Payment, Ended
- ✅ 加载骨架屏 + 错误处理

#### 3. **前端 - Policy Detail 页面** (`apps/web/src/app/policy/detail/[id]/page.tsx`)
- ✅ 移除所有 Mock 数据
- ✅ 调用 `GET /policy/{id}` 获取保单详情
- ✅ 根据状态显示不同提示卡片和操作按钮
- ✅ 智能操作: File Claim, Complete Payment, Purchase New Policy

**相关文件**:
```
apps/api/src/modules/policy/policy.controller.ts (新增 getUserPolicies)
apps/api/src/modules/policy/policy.service.ts (新增 getUserPolicies)
apps/web/src/app/my-policies/page.tsx (完全重写)
apps/web/src/app/policy/detail/[id]/page.tsx (完全重写)
```

**构建验证**:
```bash
cd apps/api && pnpm build   # ✅ Pass
cd apps/web && pnpm build   # ✅ Pass
  /my-policies: 4.32 kB
  /policy/detail/[id]: 4.85 kB
```

---

## [2025-11-16] - 🔍 Admin 搜索功能 + 数据完整性修复 ✅ 完成

### ✅ Fixed - Admin Panel Critical Data Issues (P0/P1 Bugs)

**功能**: 修复 Admin 管理面板的搜索功能、数据缺失、字段不匹配等关键问题

**问题背景**:
完成全链路验收后发现 10 个问题（3 个 P0 阻塞性、2 个 P1 高优先级、5 个 P2-P3）。本次修复所有 P0 和 P1 问题，确保 Admin 管理面板核心功能正常运行。

**实现细节**:

#### 1. **Issue #1 (P0) - 修复搜索功能**

**问题**: 前端发送 `q` 参数但后端未处理，导致搜索功能完全失效

**修复**:
- ✅ 后端 DTO 已添加 `q?: string` 字段 (`list-admin-policies.query.ts:66-76`)
- ✅ 后端 Service 已实现搜索逻辑 (`admin.service.ts:96-103`)
  - 支持按 Policy ID 模糊搜索
  - 支持按钱包地址模糊搜索
  - 支持按用户邮箱模糊搜索
  - 使用 Prisma OR 条件 + case-insensitive 匹配

**代码示例**:
```typescript
// apps/api/src/modules/admin/admin.service.ts:96-103
if (q) {
  where.OR = [
    { id: { contains: q, mode: 'insensitive' } },
    { walletAddress: { contains: q, mode: 'insensitive' } },
    { user: { email: { contains: q, mode: 'insensitive' } } },
  ];
}
```

#### 2. **Issue #2 (P0) - 修复 SKU/User 数据缺失**

**问题**: Admin 列表 API 仅返回 `skuId`，未返回 SKU 名称、保额、期限等关键信息

**修复**:
- ✅ 后端 Service 已添加 Prisma `include` 关系查询 (`admin.service.ts:113-120`)
  - 包含 SKU 信息: `name`, `coverageAmt`, `termDays`
  - 包含 User 信息: `email`
- ✅ 后端 Controller 已映射字段到响应 (`admin.controller.ts:195-206`)
  - `skuName`, `coverageAmt`, `termDays`, `email` 全部返回

**代码示例**:
```typescript
// apps/api/src/modules/admin/admin.service.ts:113-120
include: {
  sku: {
    select: { name: true, coverageAmt: true, termDays: true },
  },
  user: {
    select: { email: true },
  },
}
```

#### 3. **Issue #4 (P0) - 实现统计 API**

**问题**: 前端调用 `/admin/stats` 但端点不存在，导致 Dashboard 统计数据丢失

**修复**:
- ✅ 实现 `GET /admin/stats` 端点 (`admin.controller.ts:82-104`)
- ✅ 实现 `AdminService.getStats()` 方法 (`admin.service.ts:161-179`)
  - 返回 `total`: 总保单数
  - 返回 `underReview`: 待审核数量 (PENDING_UNDERWRITING)
  - 返回 `approvedToday`: 已批准数量 (APPROVED_AWAITING_PAYMENT)
  - 返回 `rejectedToday`: 已拒绝数量 (REJECTED)
  - 使用 `Promise.all` 并发查询优化性能

**API 响应示例**:
```json
{
  "total": 150,
  "underReview": 20,
  "approvedToday": 5,
  "rejectedToday": 2
}
```

#### 4. **Issue #6 (P1) - 添加 reviewerNote 数据库字段**

**问题**: 代码中使用 `reviewerNote` 但数据库缺少该字段，导致审核备注无法保存

**修复**:
- ✅ 更新 Prisma Schema (`schema.prisma:70`)
  ```prisma
  reviewerNote    String?       // Admin note when approving/rejecting policy
  ```
- ✅ 更新 AdminService 保存逻辑 (`admin.service.ts:318, 341`)
  - Approve 时保存 `reviewerNote`
  - Reject 时保存 `reviewerNote`
- ✅ 执行数据库迁移
  ```bash
  pnpm --filter api exec -- prisma db push
  ```

#### 5. **Issue #3 (Schema Mismatch) - 修复响应字段不匹配**

**问题**: 后端返回 `pageSize`，前端 Schema 定义为 `limit`，导致类型不匹配

**修复**:
- ✅ 更新前端 Schema (`schemas.ts:51-56`)
  ```typescript
  export const PoliciesResponse = z.object({
    items: z.array(Policy),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),  // ← 从 limit 改为 pageSize
  })
  ```

**相关文件**:
```
# Backend
apps/api/src/modules/admin/admin.controller.ts (已修复 - 统计 API)
apps/api/src/modules/admin/admin.service.ts (已修复 - 搜索、SKU 数据、统计)
apps/api/src/modules/admin/dto/list-admin-policies.query.ts (已修复 - 搜索参数)
apps/api/prisma/schema.prisma (已修复 - reviewerNote 字段)

# Frontend
apps/admin/features/policies/schemas.ts (已修复 - pageSize 字段)
```

**测试方法**:

1. **测试搜索功能**:
   ```bash
   # 按钱包地址搜索
   curl "http://localhost:3001/admin/policies?q=0x1234" \
     -H "Authorization: Bearer YOUR_JWT"

   # 按邮箱搜索
   curl "http://localhost:3001/admin/policies?q=user@example.com" \
     -H "Authorization: Bearer YOUR_JWT"
   ```

2. **测试统计 API**:
   ```bash
   curl http://localhost:3001/admin/stats \
     -H "Authorization: Bearer YOUR_JWT"

   # 响应: {"total":150,"underReview":20,"approvedToday":5,"rejectedToday":2}
   ```

3. **测试 SKU 数据完整性**:
   ```bash
   curl "http://localhost:3001/admin/policies?page=1&pageSize=10" \
     -H "Authorization: Bearer YOUR_JWT"

   # 验证响应包含: skuName, coverageAmt, termDays, email
   ```

4. **测试审核备注**:
   ```bash
   curl -X PATCH "http://localhost:3001/admin/policies/{policyId}" \
     -H "Authorization: Bearer YOUR_JWT" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "approve",
       "paymentDeadline": "2025-12-31T23:59:59.000Z",
       "reviewerNote": "Approved after KYC verification"
     }'
   ```

**注意事项**:

⚠️ **数据库迁移**:
- 使用 `prisma db push` 而非 `migrate dev` 因为存在 schema drift
- 如需正式迁移文件，需先解决 drift 问题（Setting 表、User.roles 等）

⚠️ **统计 API 命名不准确**:
- `approvedToday` 实际返回**所有**批准的保单，不是今日
- `rejectedToday` 实际返回**所有**拒绝的保单，不是今日
- 如需真实今日统计，需添加 `createdAt` 过滤条件

⚠️ **搜索性能**:
- 当前使用 `contains` + `insensitive` 模式，对大数据量可能较慢
- 建议后续添加全文搜索索引或使用专用搜索引擎（如 Elasticsearch）

⚠️ **待修复的 P2-P3 问题** (非阻塞):
- Issue #5: Payment idempotency 未验证 policyId 匹配
- Issue #7: Timezone 处理未统一为 UTC
- Issue #8: Mock 数据需要清理
- Issue #9: 缺少 Cron job 处理过期保单
- Issue #10: 前后端格式不一致（underReview vs PENDING_UNDERWRITING）

---

## [2025-11-15] - 💳 Web 支付页面 + 金庫設置 API 完成 ✅ 完成

### ✅ Added - Payment Integration (Task M3-P4)

**功能**: Web 支付页面集成 AppKit Pay + 后端金库地址配置系统

**实现细节**:

#### 1. **后端 - 金库设置模块** (`apps/api/src/modules/settings/`)

- **Setting Model** (Prisma Schema):
  ```prisma
  model Setting {
    id        String   @id @default(uuid())
    key       String   @unique
    value     String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    @@index([key])
  }
  ```

- **SettingsService**: 金库地址管理，三级回退策略
  - 优先级: 数据库 > 环境变量 > null (错误)
  - `getTreasuryAddress()`: 获取金库地址
  - `setTreasuryAddress()`: 更新金库地址 (upsert)

- **SettingsController**: 管理员专用 API
  - `GET /admin/settings/treasury` - 获取金库地址
  - `PUT /admin/settings/treasury` - 更新金库地址 (需要 JWT 认证)

- **UpdateTreasuryDto**: 地址验证
  ```typescript
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Address must be a valid Ethereum address'
  })
  address!: string
  ```

#### 2. **前端 - 支付资产辅助函数** (`apps/web/src/pay/assets.ts`)

- **buildPaymentAsset()**: 构建 AppKit Pay 资产对象
  - 支持原生代币 (ETH, BNB) 和 ERC20 (USDT, USDC)
  - 网络标识符: `eip155:{chainId}`
  - 默认代币元数据 (symbol, decimals, name)

- **validatePaymentAmount()**: 金额验证
  - 确保正数，精度控制

#### 3. **前端 - 支付页面** (`apps/web/src/app/policy/payment/[policyId]/page.tsx`)

- **功能**:
  - 加载保单和产品数据
  - 从 API 获取金库地址 (备用: 环境变量)
  - 支付网关检查 (状态、截止日期、网络)
  - AppKit 模态框集成
  - **手动 txHash 确认回退机制**

- **支付流程**:
  1. 用户点击 "Pay with Exchange"
  2. 打开 AppKit 模态框
  3. 用户在钱包完成支付
  4. 用户粘贴 txHash 到手动确认表单
  5. 后端验证 → 保单激活

- **状态管理**:
  - `policy`, `product`, `treasuryAddress` 数据加载
  - `manualTxHash` 手动确认
  - `confirming`, `confirmSuccess`, `confirmError` 确认状态

#### 4. **Admin - 金库设置页面** (`apps/admin/app/(dashboard)/settings/page.tsx`)

- **功能**:
  - 显示当前金库地址
  - 更新金库地址表单
  - 地址格式验证 (0x + 40 hex)
  - 成功/错误反馈
  - i18n 支持 (en, zh-TW)

- **API 集成**:
  - `GET /admin/settings/treasury` - 加载当前地址
  - `PUT /admin/settings/treasury` - 更新地址

- **UI 组件**:
  - Card 布局
  - 当前地址显示 (只读)
  - 新地址输入 (验证)
  - 更新按钮 (禁用状态管理)

#### 5. **配置更新**

- **Web 应用端口**: `apps/web/package.json`
  ```json
  "dev": "next dev -p 3000"  // AppKit Pay 要求端口 3000
  ```

- **Admin API Client**: 添加 `put` 方法
  ```typescript
  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) })
  ```

**相关文件**:
```
# Backend
apps/api/prisma/schema.prisma (新增 Setting model)
apps/api/src/app.module.ts (集成 SettingsModule)
apps/api/src/modules/settings/settings.module.ts (新)
apps/api/src/modules/settings/settings.service.ts (新)
apps/api/src/modules/settings/settings.controller.ts (新)
apps/api/src/modules/settings/dto/update-treasury.dto.ts (新)

# Frontend - Web
apps/web/package.json (端口改为 3000)
apps/web/src/pay/assets.ts (新 - 支付资产辅助函数)
apps/web/src/app/policy/payment/[policyId]/page.tsx (新 - 支付页面)

# Frontend - Admin
apps/admin/lib/apiClient.ts (添加 put 方法)
apps/admin/src/locales/en.ts (添加 settingsPage 翻译)
apps/admin/src/locales/zh-TW.ts (添加 settingsPage 翻译)
apps/admin/app/(dashboard)/layout.tsx (添加 Settings 导航)
apps/admin/app/(dashboard)/settings/page.tsx (新 - 设置页面)
```

**环境变量**:
```bash
# Backend (可选，数据库优先)
TREASURY_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Frontend - Web
NEXT_PUBLIC_CHAIN_ID=56  # BSC Mainnet
NEXT_PUBLIC_TREASURY_ADDRESS=0x...  # 备用
```

**测试方法**:

1. **配置金库地址** (二选一):
   ```bash
   # 方式 1: 通过 Admin 页面
   # 访问 http://localhost:3002/settings
   # 输入金库地址并保存

   # 方式 2: 通过 API
   curl -X PUT http://localhost:3001/admin/settings/treasury \
     -H "Authorization: Bearer YOUR_JWT" \
     -H "Content-Type: application/json" \
     -d '{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
   ```

2. **测试支付流程**:
   ```bash
   # 1. 创建保单
   # 2. Admin 批准 → 状态变为 APPROVED_AWAITING_PAYMENT
   # 3. 访问支付页面
   curl http://localhost:3000/policy/payment/{policyId}

   # 4. 点击 "Pay with Exchange"
   # 5. 在钱包完成支付
   # 6. 粘贴 txHash 到手动确认表单
   # 7. 后端验证支付 → 保单激活
   ```

3. **验证 API**:
   ```bash
   # 获取金库地址
   curl http://localhost:3001/admin/settings/treasury \
     -H "Authorization: Bearer YOUR_JWT"

   # 响应: {"address":"0x..."}
   ```

**注意事项**:

⚠️ **AppKit Pay 集成限制**:
- `usePay` hook 未按文档导出 `pay` 函数
- 当前使用 `useAppKit().open()` 打开模态框
- **用户需要手动粘贴 txHash 完成确认** (不是自动捕获)
- 这是设计妥协，后续可优化

⚠️ **端口限制**:
- Web 应用必须在端口 3000 运行 (AppKit Pay 要求)
- Admin 应用在 3002，API 在 3001

⚠️ **网络支持**:
- 主网: BSC (chainId: 56)
- 测试网: BSC Testnet (97), Base Sepolia (84532)
- AppKit Pay 对 BSC 支持可能有限，建议先在 Base Sepolia 测试

⚠️ **安全**:
- Treasury API 需要 JWT 认证
- 地址格式严格验证 (0x + 40 hex)
- 后端会验证 txHash 和支付金额

**构建验证**:
```bash
# All builds passed ✅
cd apps/web && pnpm build     # ✅ Payment page 3.69 kB
cd apps/admin && pnpm build   # ✅ Settings page 6.17 kB
cd apps/api && pnpm build     # ✅ SettingsModule compiled
```

---

## [2025-11-15] - ♻️ 移除保单唯一性约束，允许重复购买 ✅ 完成

### ✅ Changed - Allow Multiple Policies for Same Product

**问题**:
用户创建保单时报错：
```
Policy already exists for wallet 0x83b6e7e65f223336b7531ccab6468017a5eb7f77 and SKU bsc-usdt-plan-seed
```

**根本原因**:
- Prisma schema 中存在 `@@unique([walletAddress, skuId])` 唯一约束
- 数据库表 Policy 有唯一索引 `Policy_walletAddress_skuId_key`
- 后端代码捕获 P2002 错误并抛出 ConflictException
- **这与业务逻辑不符**：用户应该能够重复购买相同的保险产品

**修复内容**:

#### 1. **数据库 Schema 修改** (`apps/api/prisma/schema.prisma`)
   - **移除**: `@@unique([walletAddress, skuId])` 唯一约束
   - **添加**: `@@index([walletAddress, skuId])` 非唯一索引（保持查询性能）

   ```prisma
   model Policy {
     // ... fields

     @@index([userId])
     @@index([status])
     @@index([walletAddress, skuId])  // ← 非唯一索引
     // @@unique([walletAddress, skuId])  // ← 已移除
   }
   ```

#### 2. **数据库迁移** (`20251115142936_remove_wallet_sku_unique_constraint`)
   ```sql
   -- Drop the unique constraint
   ALTER TABLE "Policy" DROP CONSTRAINT IF EXISTS "Policy_walletAddress_skuId_key";

   -- Create a non-unique index for efficient queries
   CREATE INDEX IF NOT EXISTS "Policy_walletAddress_skuId_idx"
     ON "Policy"("walletAddress", "skuId");
   ```

#### 3. **后端代码修改** (`apps/api/src/modules/policy/policy.service.ts`)
   - **移除**: ConflictException 导入
   - **移除**: P2002 错误特殊处理逻辑
   - **更新**: 文档注释，说明允许重复购买
   - **添加**: Logger 用于错误日志记录

   **修改前**:
   ```typescript
   } catch (error: any) {
     if (error.code === 'P2002') {
       throw new ConflictException(
         `Policy already exists for wallet ${normalizedAddress} and SKU ${skuId}`,
       );
     }
     throw error;
   }
   ```

   **修改后**:
   ```typescript
   } catch (error: any) {
     this.logger.error('Failed to create policy', {
       error: error.message,
       code: error.code,
       userId,
       skuId,
     });
     throw error;
   }
   ```

**业务影响**:
- ✅ 用户现在可以购买**多份相同的保险产品**
- ✅ 例如：同一个钱包可以购买 3 份"YULILY SHIELD INSURANCE"
- ✅ 每次购买都会创建独立的保单记录（不同的 Policy ID）
- ✅ 查询性能不受影响（保留了索引）

**使用场景**:
```typescript
// 用户第一次购买
POST /policy { skuId: "bsc-usdt-plan-seed" }
→ 201 Created { id: "policy-1", status: "DRAFT" }

// 用户再次购买相同产品（现在允许）
POST /policy { skuId: "bsc-usdt-plan-seed" }
→ 201 Created { id: "policy-2", status: "DRAFT" }

// 查询用户所有保单
GET /my-policies
→ [
  { id: "policy-1", skuName: "YULILY SHIELD", status: "ACTIVE" },
  { id: "policy-2", skuName: "YULILY SHIELD", status: "DRAFT" }
]
```

**测试方法**:
```bash
# 重启后端（应用迁移和代码更改）
pnpm --filter api build && pnpm --filter api dev

# 测试 1: 创建第一份保单
curl -X POST http://localhost:3001/policy \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"skuId": "bsc-usdt-plan-seed"}'
# 应该返回 201 Created

# 测试 2: 创建第二份相同产品的保单（应该成功）
curl -X POST http://localhost:3001/policy \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"skuId": "bsc-usdt-plan-seed"}'
# 应该返回 201 Created（不再是 409 Conflict）

# 测试 3: 前端测试
访问 http://localhost:3000/products
选择产品 → 填写表单 → Confirm and Pay
应该成功创建，即使之前已购买过该产品
```

**相关文件**:
```
apps/api/prisma/schema.prisma                                      (移除唯一约束)
apps/api/prisma/migrations/20251115142936_.../migration.sql       (数据库迁移)
apps/api/src/modules/policy/policy.service.ts                     (移除冲突检查)
```

**注意事项**:
- ✅ 迁移已成功应用到数据库
- ✅ 保留了组合索引以保持查询性能
- ⚠️ **这是一个重要的业务逻辑变更**，确保符合产品需求
- ⚠️ 如果需要限制购买数量，应在应用层实现（如"最多购买 5 份"）
- ⚠️ 前端可以考虑在"我的保单"页面显示同一产品的购买次数

---

## [2025-11-15] - 🐛 Admin 保单详情页缺少 Payments 数据 ✅ 完成

### ✅ Fixed - Policy Detail Page Missing Payments

**问题**:
Admin Web 保单详情页报错：
```
TypeError: Cannot read properties of undefined (reading 'length')
Source: app/(dashboard)/policies/[id]/page.tsx (212:34)
{policy.payments.length} payment(s) recorded
```

**根本原因**:
- 后端 `GET /admin/policies/:id` 返回的 policy 对象缺少 `payments` 字段
- `AdminService.getPolicyById()` 没有 include payments 关联
- 前端尝试访问 `policy.payments.length` 时遇到 undefined

**修复**:
1. **Service 层** (`apps/api/src/modules/admin/admin.service.ts:203-205`):
   ```typescript
   include: {
     sku: true,
     user: true,
     payments: {
       orderBy: { createdAt: 'desc' },  // ← 新增 payments 关联
     },
   }
   ```

2. **Controller 层** (`apps/api/src/modules/admin/admin.controller.ts:312-322`):
   ```typescript
   payments: policy.payments.map((payment) => ({
     id: payment.id,
     amount: payment.amount.toString(),
     txHash: payment.txHash,
     confirmed: payment.confirmed,  // ← 使用 confirmed 而非 status
     chainId: payment.chainId,
     tokenAddress: payment.tokenAddress,
     fromAddress: payment.fromAddress,
     toAddress: payment.toAddress,
     createdAt: payment.createdAt.toISOString(),
   }))
   ```

**Payment 模型字段**:
```prisma
model Payment {
  id           String   @id @default(uuid())
  policyId     String
  txHash       String   @unique
  chainId      Int
  tokenAddress String
  fromAddress  String
  toAddress    String
  amount       Decimal  @db.Decimal(38, 18)
  confirmed    Boolean  @default(false)  // ← 注意：是 confirmed 而非 status
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**响应示例**:
```json
{
  "id": "policy-uuid",
  "sku": { "name": "YULILY SHIELD INSURANCE" },
  "user": { "email": "user@example.com" },
  "payments": [
    {
      "id": "payment-uuid",
      "amount": "100.0",
      "txHash": "0x123...",
      "confirmed": true,
      "chainId": 97,
      "createdAt": "2025-11-15T..."
    }
  ]
}
```

**测试方法**:
```bash
# 重启后端
pnpm --filter api build && pnpm --filter api dev

# 测试 API
curl "http://localhost:3001/admin/policies/{policy-id}"
# 验证响应包含 payments 数组

# 前端测试
访问 http://localhost:3000/policies/{policy-id}
# 应该正常显示 "X payment(s) recorded"，无错误
```

**相关文件**:
```
apps/api/src/modules/admin/admin.service.ts    (添加 payments include)
apps/api/src/modules/admin/admin.controller.ts (映射 payments 字段)
```

**注意事项**:
- ✅ Payments 按创建时间倒序排列（最新的在前）
- ✅ Amount 转换为字符串以保持精度
- ⚠️ Payment 模型使用 `confirmed` 字段而非 `status`
- ⚠️ 必须重启后端服务才能生效

---

## [2025-11-15] - 🔥 紧急修复：Prisma 类型错误（pageSize 字符串 → 整数）✅ 完成

### ✅ Fixed - Admin Policies API Runtime Error

**问题**:
Admin Web 打开 "All Policies" 和 "Review Queue" 页面时后端报错：
```
Argument `take`: Invalid value provided. Expected Int, provided String.
take: "20"  // ← 字符串，应该是数字
```

**根本原因**:
- URL 查询参数默认是字符串类型（`"20"` 而非 `20`）
- NestJS 的 `@Type(() => Number)` 装饰器在某些情况下未正确转换
- Controller 直接传递 `query.pageSize` 给 Prisma，导致类型不匹配
- Prisma 的 `findMany({ take: "20" })` 严格要求整数，运行时抛出 `PrismaClientValidationError`

**修复**:
```typescript
// apps/api/src/modules/admin/admin.controller.ts:185-186
const result = await this.adminService.listPolicies({
  page: Number(query.page) || 1,        // ← 显式转换为数字
  pageSize: Number(query.pageSize) || 20,  // ← 显式转换为数字
  status: query.status,
  q: query.q,
});
```

**影响范围**:
- ✅ GET `/admin/policies` - 所有保单列表
- ✅ GET `/admin/policies?status=PENDING_UNDERWRITING` - Review Queue

**测试方法**:
```bash
# 重启后端
pnpm --filter api build && pnpm --filter api dev

# 测试 1: All Policies
curl "http://localhost:3001/admin/policies?page=1&pageSize=20"
# 应该返回 200 OK，包含 items 数组

# 测试 2: Review Queue
curl "http://localhost:3001/admin/policies?status=PENDING_UNDERWRITING&page=1&pageSize=20"
# 应该返回 200 OK

# 前端测试
访问 http://localhost:3000/policies (All Policies)
访问 http://localhost:3000/review (Review Queue)
# 应该正常显示列表，无 500 错误
```

**相关文件**:
```
apps/api/src/modules/admin/admin.controller.ts (显式 Number() 转换)
```

**注意事项**:
- ⚠️ 这是运行时错误，TypeScript 编译期无法检测（DTO 类型是 `number`，但运行时是 `string`）
- ⚠️ 必须重启后端服务才能生效（pnpm --filter api build）
- ✅ 使用 `Number()` 比 `parseInt()` 更安全（处理 `undefined`/`null` 时返回 `NaN`，然后 `|| 默认值` 生效）

---

## [2025-11-15] - 🐛 Admin API 四个关键 Bug 修复 ✅ 完成

### ✅ Fixed - Admin 后端 API 功能完善

**问题概述**:
在排查 Admin 门户问题时发现 4 个后端 API 契约不匹配和功能缺失的关键 Bug：
1. ❌ 搜索功能完全失效（前端发送 `q` 参数，后端未处理）
2. ❌ 保单列表缺少 SKU 关联数据（只返回 UUID，无产品名称）
3. ❌ Admin 保单详情端点不存在（前端调用错误的用户端点）
4. ❌ Stats 统计端点不存在（前端发起 4 次 API 调用计算统计）

**修复详情**:

#### 1. **修复搜索功能（Bug #1）** ✅
   - **问题**: 前端在 `/admin/policies` 请求中发送 `q` 参数（搜索 ID/钱包/邮箱），但后端 DTO 和 Service 未定义此参数，导致搜索功能完全失效
   - **修复**:
     - `apps/api/src/modules/admin/dto/list-admin-policies.query.ts`: 添加 `q?: string` 可选参数
     - `apps/api/src/modules/admin/admin.service.ts`: 在 `listPolicies` 方法中添加搜索逻辑
     ```typescript
     if (q) {
       where.OR = [
         { id: { contains: q, mode: 'insensitive' } },
         { walletAddress: { contains: q, mode: 'insensitive' } },
         { user: { email: { contains: q, mode: 'insensitive' } } },
       ];
     }
     ```
     - `apps/api/src/modules/admin/admin.controller.ts`: 添加 `@ApiQuery` 文档并传递 `q` 参数
   - **效果**: Admin 搜索框现在可以正常按 Policy ID、钱包地址、用户邮箱搜索

#### 2. **修复保单列表 SKU 关联数据缺失（Bug #2）** ✅
   - **问题**: 后端只返回 `skuId` (UUID)，未 join SKU 和 User 表，导致前端显示 UUID 而非产品名称，缺少覆盖金额、期限、邮箱等关键信息
   - **修复**:
     - `apps/api/src/modules/admin/admin.service.ts`:
       - 添加 `include: { sku: {...}, user: {...} }` 关联查询
       - 接口新增字段：`skuName`, `coverageAmt`, `termDays`, `email`
     - `apps/api/src/modules/admin/admin.controller.ts`: 映射新字段到响应
     - `apps/api/src/modules/admin/dto/admin-policy-list-response.dto.ts`: 添加新字段的 Swagger 文档
   - **数据示例**:
     ```json
     {
       "skuId": "uuid",
       "skuName": "YULILY SHIELD INSURANCE",  // ← 新增
       "coverageAmt": "10000.0",              // ← 新增
       "termDays": 90,                        // ← 新增
       "email": "user@example.com"            // ← 新增
     }
     ```
   - **效果**: 保单列表现在显示可读的产品名称和完整信息，无需额外查询

#### 3. **添加 Admin 保单详情 API 端点（Bug #3）** ✅
   - **问题**:
     - 前端 `usePolicyDetail` hook 调用 `/policy/:id`（用户端点）而非 Admin 端点
     - 缺少 Admin 专用的 GET `/admin/policies/:id` 端点
     - 用户端点不返回 `paymentDeadline` 等管理员专属字段
   - **修复**:
     - `apps/api/src/modules/admin/admin.service.ts`: 新增 `getPolicyById()` 方法
     ```typescript
     async getPolicyById(policyId: string) {
       return this.prisma.policy.findUnique({
         where: { id: policyId },
         include: { sku: true, user: true },
       });
     }
     ```
     - `apps/api/src/modules/admin/admin.controller.ts`: 新增 GET `/admin/policies/:id` 端点
     - `apps/admin/features/policies/hooks/usePolicyDetail.ts`: 修正路径为 `/admin/policies/${id}`
   - **响应示例**:
     ```json
     {
       "id": "uuid",
       "sku": { "name": "YULILY SHIELD INSURANCE", "coverageAmt": "10000.0" },
       "user": { "email": "user@example.com" },
       "paymentDeadline": "2025-11-16T08:00:00.000Z"  // ← Admin 专属字段
     }
     ```
   - **效果**: Admin 保单详情页现在使用正确的端点，显示完整信息

#### 4. **添加 Admin Stats 统计 API 专用端点（Bug #4）** ✅
   - **问题**:
     - 后端无 `/admin/stats` 端点
     - 前端 `useStats` hook 发起 4 次 `/admin/policies` 请求并客户端聚合（性能差）
   - **修复**:
     - `apps/api/src/modules/admin/admin.service.ts`: 新增 `getStats()` 方法
     ```typescript
     async getStats() {
       const [total, underReview, approved, rejected] = await Promise.all([
         this.prisma.policy.count(),
         this.prisma.policy.count({ where: { status: 'PENDING_UNDERWRITING' } }),
         this.prisma.policy.count({ where: { status: 'APPROVED_AWAITING_PAYMENT' } }),
         this.prisma.policy.count({ where: { status: 'REJECTED' } }),
       ]);
       return { total, underReview, approvedToday: approved, rejectedToday: rejected };
     }
     ```
     - `apps/api/src/modules/admin/admin.controller.ts`: 新增 GET `/admin/stats` 端点
     - `apps/admin/features/policies/hooks/useStats.ts`: 简化为单次 API 调用
   - **性能提升**: 从 4 次请求 → 1 次请求，减少 75% 网络开销
   - **效果**: Dashboard 统计卡片加载更快，数据一致性更好

**相关文件**:
```
apps/api/src/modules/admin/dto/list-admin-policies.query.ts  (添加 q 参数)
apps/api/src/modules/admin/admin.service.ts                 (4 个修复：搜索 + SKU 关联 + 详情 + 统计)
apps/api/src/modules/admin/admin.controller.ts              (4 个修复：搜索 + SKU 关联 + 详情 + 统计)
apps/api/src/modules/admin/dto/admin-policy-list-response.dto.ts (新增字段文档)
apps/admin/features/policies/hooks/usePolicyDetail.ts       (修正 API 路径)
apps/admin/features/policies/hooks/useStats.ts              (简化为单次 API 调用)
```

**测试方法**:
```bash
# Terminal 1: 启动后端
pnpm --filter api dev

# Terminal 2: 启动 Admin
pnpm --filter admin dev

# 测试 1: 搜索功能
curl "http://localhost:3001/admin/policies?q=0x1234"

# 测试 2: SKU 关联数据
curl "http://localhost:3001/admin/policies?page=1&pageSize=10"
# 验证响应包含 skuName, coverageAmt, termDays, email

# 测试 3: 保单详情
curl "http://localhost:3001/admin/policies/{policy-id}"
# 验证响应包含 sku 对象、user 对象、paymentDeadline

# 测试 4: 统计 API
curl "http://localhost:3001/admin/stats"
# 验证响应: { total, underReview, approvedToday, rejectedToday }

# 前端测试
访问 http://localhost:3000/dashboard
- 验证统计卡片显示正确数字
- 搜索框输入钱包地址/邮箱，验证搜索结果
- 点击保单列表项，验证详情页加载
```

**注意事项**:
- ✅ 所有 4 个 Bug 已完全修复
- ✅ 前后端 API 契约现在完全匹配
- ✅ TypeScript 类型安全（无 any，所有字段有类型）
- ✅ Swagger 文档已更新（包含所有新字段和端点）
- ⚠️ `approvedToday` 和 `rejectedToday` 实际返回总数（非当日），未来可添加日期过滤
- ⚠️ 搜索为模糊匹配（`contains`），大数据集需考虑添加索引
- ⚠️ Policy 模型无 `phone` 字段，已从代码中移除

---

## [2025-11-15] - 🔧 Admin 数据展示修复（Hydration + API 对接）✅ 完成

### ✅ Fixed - Admin Portal 后端数据对接修复

**问题概述**:
Admin 管理端门户出现以下问题：
1. React Hydration 错误（服务端/客户端 HTML 不匹配）
2. 无法从后端获取任何 policy 数据
3. 统计信息（Stats）未显示

**根本原因**:
1. **Hydration 错误**: `apps/admin/app/(dashboard)/layout.tsx` 中 `getUser()` 和 `isAuthed()` 在服务端和客户端返回不同值，导致条件渲染结果不一致
2. **API Base URL 缺失**: `.env.local` 中 `NEXT_PUBLIC_ADMIN_API_BASE` 为空字符串
3. **Stats API 不存在**: `useStats` hook 调用了不存在的 `/api/admin/stats` 端点

**实现细节**:

#### 1. **修复 Hydration 错误** (apps/admin/app/(dashboard)/layout.tsx:19-36)
   - **问题**: Zustand persist 在服务端访问 localStorage，返回初始值；客户端返回实际存储值 → SSR/CSR HTML 不匹配
   - **解决方案**: 添加 `mounted` 状态，延迟渲染直到客户端 hydration 完成
   ```typescript
   const [mounted, setMounted] = useState(false)

   useEffect(() => {
     setMounted(true)
     if (!isAuthed()) {
       router.push('/login')
     }
   }, [router])

   // 关键：hydration 完成前不渲染任何内容
   if (!mounted) {
     return null
   }
   ```
   - **效果**:
     - 服务端始终渲染 `null`
     - 客户端 hydration 后渲染完整 UI
     - 零 HTML 不匹配错误

#### 2. **配置 API Base URL** (apps/admin/.env.local:1-2)
   - **变更前**:
     ```
     NEXT_PUBLIC_ADMIN_API_BASE=
     NEXT_PUBLIC_USE_MOCK=true
     ```
   - **变更后**:
     ```
     NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3001
     NEXT_PUBLIC_USE_MOCK=false
     ```
   - **说明**:
     - Admin 门户需要连接到后端 API (localhost:3001)
     - 关闭 mock 模式，使用真实后端数据

#### 3. **重写 Stats Hook** (apps/admin/features/policies/hooks/useStats.ts)
   - **问题**: 后端未实现专用 `/api/admin/stats` 端点
   - **解决方案**: 客户端聚合统计 - 并行请求多个 `/admin/policies` 端点并汇总结果
   ```typescript
   const [allPolicies, underReview, approved, rejected] = await Promise.all([
     apiClient.get<{ data: any[]; total: number }>('/admin/policies', { pageSize: 1 }),
     apiClient.get<{ data: any[]; total: number }>('/admin/policies', {
       status: 'PENDING_UNDERWRITING', pageSize: 1
     }),
     apiClient.get<{ data: any[]; total: number }>('/admin/policies', {
       status: 'APPROVED_AWAITING_PAYMENT', pageSize: 1
     }),
     apiClient.get<{ data: any[]; total: number }>('/admin/policies', {
       status: 'REJECTED', pageSize: 1
     }),
   ])

   return {
     total: allPolicies.total || 0,
     underReview: underReview.total || 0,
     approvedToday: approved.total || 0,
     rejectedToday: rejected.total || 0,
   }
   ```
   - **优点**:
     - 立即可用，无需后端改动
     - 使用现有 `/admin/policies` API（支持 status 过滤）
     - 只请求 1 条数据（pageSize=1），仅获取 total count
   - **性能**: 4 个并行请求，总耗时 ≈ 单次请求时间

**相关文件**:
```
apps/admin/app/(dashboard)/layout.tsx         (新增 mounted 状态)
apps/admin/.env.local                         (配置 API Base URL)
apps/admin/features/policies/hooks/useStats.ts (重写 Stats 获取逻辑)
```

**测试方法**:
```bash
# Terminal 1: 启动后端 API
pnpm --filter api dev

# Terminal 2: 启动 Admin 门户
pnpm --filter admin dev

# 浏览器访问
http://localhost:3000/login
→ 登录成功后查看 Dashboard
→ 验证统计卡片显示正确数据（总数、待审核、已批准、已拒绝）
→ 导航到 /policies，验证保单列表正确加载
→ 验证无 hydration 错误（检查浏览器控制台）
```

**注意事项**:
- ✅ Hydration 问题已彻底解决（服务端渲染 null，客户端完整渲染）
- ✅ Admin 门户现在可以正确显示后端数据
- ⚠️ Stats 目前客户端计算（4 个并行请求），未来可优化为后端专用 API
- ⚠️ 确保后端 API (localhost:3001) 在访问 Admin 门户前已启动
- ⚠️ Stats 显示的 "今日批准/拒绝" 实际为 "所有批准/拒绝总数"（需要后端 API 支持日期过滤）

---

## [2025-11-15] - 📝 合同签署页：签名→等待审核（对齐设计 + 真实后端）✅ 完成

### ✅ Implemented - Web 合同签署页完整实现

**功能概述**:
完成合同签署页（/policy/contract-sign/[policyId]）的完整实现，集成真实后端 API（GET /policy/:id + POST /policy/contract-sign），实现钱包签名、状态流转、UI 对齐设计稿。签署成功后保单状态从 DRAFT → PENDING_UNDERWRITING。

**实现细节**:

#### 1. **数据准备与 API 集成**
   - **GET /policy/:id**: 获取保单详情（status、premiumAmt、walletAddress 等）
   - **Query 参数融合**: 从上一页（form）接收 coverage/period/symbol/premium，与后端数据融合展示
   - **TanStack Query**: 使用 `useQuery` 加载保单，retry: 1，优雅错误处理
   - **后端优先**: Premium 优先使用后端返回的 `policy.premiumAmt`，query 参数作为 fallback

#### 2. **状态检查与路由引导** (严格 DRAFT Only)
   非 DRAFT 状态时显示状态页，清晰引导用户：
   - **PENDING_UNDERWRITING**: "已签署，等待审核" → 按钮"查看详情"
   - **APPROVED_AWAITING_PAYMENT**: "已通过审核，待支付" → 按钮"去支付"
   - **ACTIVE/REJECTED/EXPIRED**: 按钮"查看详情"
   - 状态页居中展示，带黄色按钮 + 阴影效果

#### 3. **合同 Payload 构造** (Canonical Order)
   按固定键名顺序组织 payload，避免签名差异：
   ```typescript
   const contractPayload = {
     policyId: policy.id,
     walletAddress: user.address,      // 来自 authStore，只读
     coverageAmount: coverageFromQuery,
     premiumAmount: policy.premiumAmt,  // 后端返回的真实值
     termDays: parseInt(periodFromQuery),
     symbol: symbolFromQuery,
     timestamp: Date.now(),
   }
   ```

#### 4. **钱包签名流程** (ethers v6 BrowserProvider)
   - **Step 1**: 检查 chainId，不符合时抛出错误并禁用按钮
   - **Step 2**: 使用 `BrowserProvider(walletProvider)` 获取 signer
   - **Step 3**: `signer.signMessage(JSON.stringify(contractPayload))` 签名
   - **Step 4**: POST /policy/contract-sign，提交 { policyId, contractPayload, userSig }
   - **Step 5**: 成功后 `router.replace(/policy/detail/${policyId})`

#### 5. **ChainID 校验** (防钓鱼)
   - 从 `process.env.NEXT_PUBLIC_CHAIN_ID` 读取期望链网（97 = BSC Testnet）
   - 签名前检查 `network.chainId`，不一致时：
     - 显示红色警告框："请切换到 BSC Testnet (Chain ID: 97)"
     - 禁用签名按钮
     - 抛出错误阻止签名

#### 6. **按钮禁用逻辑**
   ```typescript
   const isChainCorrect = currentChainId === null || currentChainId === EXPECTED_CHAIN_ID
   const canSign = agreed && isChainCorrect && !isSigning
   ```
   禁用条件：
   - 未勾选"我已阅读并同意"
   - 链网不符
   - 正在签名中
   - 正在加载 policy

#### 7. **错误处理与友好提示**
   - **用户取消签名**: "Signature request was cancelled" (检查 err.code === 4001)
   - **链网错误**: 显示完整错误信息（如 "Please switch to BSC Testnet"）
   - **网络错误**: "Network error. Please check your connection"
   - **后端错误**: 显示 `err.response.data.message`
   - 错误框可点击 Dismiss 关闭

#### 8. **UI 对齐设计稿**
   - **背景**: `bg-[#050816]` (深色)
   - **合同区块**: `bg-[#2D3748]` + `border-[#374151]` + `rounded-xl` + `h-[400px]` + 可滚动
   - **同意按钮**: 边框切换态（未选: border-only，已选: bg-[#5B7C4F] 实心）
   - **签名按钮**: `bg-[#FECF4C] text-[#111827] rounded-xl shadow-[0_4px_16px_rgba(254,207,76,0.45)]`
   - **Header/BACK**: 与 form 页一致（`bg-[#050816]`, 钱包 pill `rounded-full`, uppercase 文字）
   - **移动端优先**: `max-w-md mx-auto w-full`

#### 9. **Loading Skeleton**
   - 加载时显示骨架屏（header + contract box + buttons）
   - 使用 `animate-pulse` 和灰色背景
   - 避免内容闪烁

#### 10. **合同内容展示**
   在合同区块内显示保单概要：
   - Policy ID (截断显示)
   - Coverage Amount
   - Premium (后端值优先)
   - Term (天数)
   - Wallet Address (截断显示)
   - 底部分隔线 + 条款说明文字

**相关文件**:
```
apps/web/src/app/policy/contract-sign/[policyId]/page.tsx    # 完全重写
```

**API 接口**:
- **GET /policy/:id** → PolicyResponse (id, status, premiumAmt, etc.)
- **POST /policy/contract-sign** → Body: { policyId, contractPayload, userSig } → { contractHash }

**Contract Payload 字段**:
```json
{
  "policyId": "uuid",
  "walletAddress": "0x...",
  "coverageAmount": "string",
  "premiumAmount": "string",
  "termDays": number,
  "symbol": "USDT",
  "timestamp": number
}
```

**构建测试**:
```bash
pnpm --filter web build
# ✓ 构建成功，无类型错误，605 kB First Load JS (contract-sign page)
```

**状态流转**:
```
DRAFT (可签署)
  ↓ 签名成功
PENDING_UNDERWRITING (等待审核)
  ↓ 管理员审核
APPROVED_AWAITING_PAYMENT (待支付)
  ↓ 支付成功
ACTIVE (生效)
```

**验收标准验证**:
- ✅ 非 DRAFT 不允许签署，并有清晰引导
- ✅ 签署按钮仅在勾选同意且链网正确时可用
- ✅ 成功签署后状态流转为 PENDING_UNDERWRITING，跳转详情页
- ✅ UI、间距、按钮风格与设计稿基本一致
- ✅ Skeleton 友好，无明显闪烁

**注意事项**:
- 不打印 userSig 明文，仅打印 policyId 和关键流程点
- chainId 校验失败禁止签名（防钓鱼）
- 签名的地址来自 authStore（只读），不信任用户输入
- Payload 键名顺序固定，确保签名一致性
- 后端 premiumAmt 优先于前端 query 参数

---

## [2025-11-15] - 🔧 Policy 表单页三项优化（增减按钮移除 + 产品改名 + 双向绑定）✅ 完成

### ✅ Enhanced - 表单交互优化与数据双向绑定

**功能概述**:
完成 Policy 表单页的三项重要优化：移除数字输入框的浏览器默认增减按钮、更新产品名称为 "YULILY SHIELD INSURANCE"、实现 Insurance Amount 和 Insurance Cost 的双向绑定计算。

**实现细节**:

#### 1. **移除数字输入框增减按钮**
   - **问题**: 浏览器默认的数字输入框（type="number"）在 focus 时会显示上下箭头按钮，影响 UI 美观
   - **解决方案**: 添加 Tailwind CSS 自定义类名
   ```tsx
   className="... [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
   ```
   - **效果**: 完全隐藏 Chrome/Safari/Firefox 的数字输入框增减按钮，保持纯净 UI

#### 2. **更新产品名称**
   - **修改文件**:
     - `apps/api/prisma/seed.ts`: Seed 数据中的产品名从 "BSC USDT Protection Plan" 改为 "YULILY SHIELD INSURANCE"
     - `apps/web/src/app/policy/form/[productId]/page.tsx`: 前端 fallback 默认值同步更新
   - **注意**: Seed 脚本使用 `upsert`，下次运行时会自动更新现有数据库记录

#### 3. **Insurance Cost 双向绑定计算** （核心功能）

   **3.1 架构设计**:
   - 新增状态: `lastEditedField` 追踪最后编辑的字段（'amount' | 'cost'）
   - 两个字段都可编辑，互相自动计算
   - 使用 `useEffect` 监听变化并触发反向计算

   **3.2 计算逻辑**:
   ```typescript
   // 当 Insurance Amount 改变时 → 自动计算 Insurance Cost
   insuranceCost = insuranceAmount * premiumRate

   // 当 Insurance Cost 改变时 → 自动反推 Insurance Amount
   insuranceAmount = insuranceCost / premiumRate
   ```

   **3.3 实现要点**:
   - **Form Schema 扩展**: 新增 `insuranceCost` 字段到 zod schema
   - **双向 useEffect**:
     - `watchedAmount` 变化 → 更新 `insuranceCost`（仅当 `lastEditedField === 'amount'`）
     - `watchedCost` 变化 → 更新 `insuranceAmount`（仅当 `lastEditedField === 'cost'`）
   - **onChange 处理**: 为两个输入框添加自定义 `onChange`，设置 `lastEditedField` 以区分编辑源
   - **Overview 同步**: Overview 区域显示 `watchedCost` 的实时值
   - **Submit 数据**: 提交时使用 `data.insuranceCost`（而非计算值）

   **3.4 UI 变化**:
   - Insurance Cost 从只读（disabled）改为可编辑
   - 辅助文字从 "Auto-calculated" 改为 "Bidirectional"
   - 添加与 Insurance Amount 相同的样式和增减按钮隐藏

**相关文件**:
```
apps/web/src/app/policy/form/[productId]/page.tsx    # 表单逻辑全面优化
apps/api/prisma/seed.ts                               # 产品名称更新
```

**构建测试**:
```bash
pnpm --filter web build
# ✓ 构建成功，无类型错误，165 kB First Load JS
```

**关键代码片段**:
```typescript
// 状态追踪
const [lastEditedField, setLastEditedField] = useState<'amount' | 'cost'>('amount')

// 双向绑定 - Amount → Cost
useEffect(() => {
  if (lastEditedField === 'amount') {
    const amount = parseFloat(watchedAmount)
    if (!isNaN(amount) && amount > 0 && premiumRate > 0) {
      const calculatedCost = Math.round(amount * premiumRate * 100) / 100
      setValue('insuranceCost', String(calculatedCost), { shouldValidate: true })
    }
  }
}, [watchedAmount, lastEditedField, premiumRate, setValue])

// 双向绑定 - Cost → Amount
useEffect(() => {
  if (lastEditedField === 'cost') {
    const cost = parseFloat(watchedCost)
    if (!isNaN(cost) && cost > 0 && premiumRate > 0) {
      const calculatedAmount = Math.round((cost / premiumRate) * 100) / 100
      setValue('insuranceAmount', String(calculatedAmount), { shouldValidate: true })
    }
  }
}, [watchedCost, lastEditedField, premiumRate, setValue])
```

**注意事项**:
- 双向绑定的关键是 `lastEditedField` 状态，避免无限循环更新
- 计算时保留两位小数: `Math.round(value * 100) / 100`
- 两个字段都需要隐藏浏览器默认增减按钮以保持 UI 一致性
- Premium Rate 从产品 API 获取: `premiumRate = premiumAmt / coverageAmt`

---

## [2025-11-15] - 🎨 Policy 表单页 UI 全面重构（完美对齐设计稿）✅ 完成

### ✅ Refactored - 表单页 UI 完全对齐移动端设计稿

**功能概述**:
对 Policy 表单页（/policy/form/[productId]）进行全面 UI 重构，完美对齐移动端设计稿 `docs/designs/保险细节页面.png`。实现统一卡片样式、精准色彩系统、移动端优先布局（max-w-md 居中）。

**实现细节**:

#### 1. **整体布局改造**
   - **背景色**: 从 `#0F111A` 改为 `#050816`（更深的深色背景）
   - **移动端优先**: 内容区域添加 `max-w-md mx-auto w-full`，在大屏上居中显示
   - **Skeleton 更新**: Loading 骨架屏同步使用新配色和布局

#### 2. **Header + BACK 按钮重构**
   - **Header 背景**: `bg-[#050816]`（与页面背景一致）
   - **Logo 文字**: `text-sm uppercase tracking-[1.5px]`（小号大写字母间距）
   - **钱包 Pill**:
     - 从圆角矩形改为圆形按钮 `rounded-full`
     - 颜色: `bg-[#FECF4C] text-[#111827]`（黄色背景 + 深色文字）
     - 字号: `text-xs font-semibold`
   - **BACK 按钮**: `text-xs uppercase tracking-[1.5px]`（大写字母间距）

#### 3. **统一表单卡片样式**（4 个字段）
   所有表单字段（Wallet Address / Amount / Cost / Period）采用统一卡片设计:
   - **卡片容器**: `bg-[#111827] rounded-xl px-4 py-3 border border-[#1F2937]`
   - **Label 样式**: `text-[#9CA3AF] text-xs uppercase tracking-[1.5px]`（灰色小号大写）
   - **Value 样式**: `text-white text-2xl font-semibold`（白色大号半粗）
   - **辅助文字**: `text-[#6B7280] text-[10px]`（Max/Auto-calculated）
   - **输入框**:
     - 无独立背景，直接 `bg-transparent`，融入卡片
     - 移除内部边框，仅通过卡片边框统一
     - Focus 状态自然融入卡片设计

#### 4. **Overview 卡片样式对齐**
   - 采用与表单字段相同的卡片样式: `bg-[#111827] rounded-xl border border-[#1F2937]`
   - Section 标题: `text-sm font-semibold mb-2.5`（缩小标题间距）
   - 内部分隔线: `border-[#1F2937]`（与卡片边框一致）
   - 所有文本缩小到 `text-xs`

#### 5. **Terms & Filing 卡片样式**
   - 采用统一卡片设计: `bg-[#111827] rounded-xl border border-[#1F2937]`
   - **圆点图标改造**:
     - 从 emoji ✓/● 改为圆形 div: `w-2 h-2 rounded-full`
     - 绿色: `bg-green-500`（保护项目）
     - 红色: `bg-red-500`（排除项目）
     - 灰色: `bg-[#9CA3AF]`（Filing 列表）
   - 文字尺寸: `text-[10px]`（Terms）、`text-[9px]`（免责声明）
   - Section 标题: `text-sm font-semibold mb-2.5`

#### 6. **底部按钮样式**
   - **正常状态**:
     - 背景: `bg-[#FECF4C]`（品牌黄色）
     - 文字: `text-[#111827]`（深色）
     - 圆角: `rounded-xl`
     - 阴影: `shadow-[0_4px_16px_rgba(254,207,76,0.45)]`（黄色发光效果）
   - **禁用状态**: `bg-[#374151] text-[#6B7280]`（灰色）
   - 文字: `text-sm font-semibold`

#### 7. **颜色系统标准化**
   ```
   深色背景: #050816 (页面)、#111827 (卡片)
   边框:     #1F2937 (卡片边框、分隔线)
   文字:     #FFFFFF (主要)、#9CA3AF (Label)、#6B7280 (辅助)
   品牌色:   #FECF4C (按钮、图标、高亮)
   状态色:   green-500 (保护)、red-500 (排除)
   ```

**相关文件**:
```
apps/web/src/app/policy/form/[productId]/page.tsx    # UI 完全重构
```

**设计对齐参考**:
- 设计稿: `docs/designs/保险细节页面.png`
- 实现截图对比: `docs/ui-snapshot/policy-form-001.png` (重构前)

**构建测试**:
```bash
pnpm --filter web build
# ✓ 构建成功，无类型错误
```

**注意事项**:
- 所有卡片样式统一使用 `bg-[#111827] rounded-xl border border-[#1F2937]`
- Label 统一使用 `text-xs uppercase tracking-[1.5px]`（大写 + 字母间距）
- 移动端优先设计，375px 宽度完美展示，大屏居中
- 黄色品牌色统一为 `#FECF4C`（非 #FFD54F）
- 业务逻辑（验证、计算、API）保持不变，仅 UI 重构

---

## [2025-11-15] - 📝 任务 M3-P2：Policy 表单页对齐设计稿 + 真实 API + 完整验证 ✅ 完成

### ✅ Refactored - 保单表单页全面重构，解决 9 个核心问题

**功能概述**:
完成 Policy 表单页（/policy/form/[productId]）的全面重构，按照设计稿实现所有交互细节，接入真实 API，添加完整的表单验证、实时计算、Loading Skeleton，修复所有命名和逻辑问题。

**实现细节**:

#### 1. **钱包地址自动填充（严重问题 - 已修复）**
   - 路径: `apps/web/src/app/policy/form/[productId]/page.tsx:110-115`
   - 从 `useAuthStore` 读取 `user.address`，自动填入「Insurance Wallet Address」
   - 字段设为 `readOnly` 和 `disabled`，防止用户修改
   - 使用 `useEffect` 监听 `user.address` 变化，动态填充
   - 后端始终以 JWT.address 为准，前端地址仅作展示

#### 2. **字段命名修正（严重问题 - 已修复）**
   - 上栏: **Insurance Amount**（用户可编辑，保障额度）
   - 下栏: **Insurance Cost**（只读，自动计算的保费）
   - 移除错误的第二个"Insurance Amount"命名
   - Label、placeholder、帮助文案严格区分

#### 3. **币种单位与 Max 显示（中等问题 - 已修复）**
   - 路径: `apps/web/src/app/policy/form/[productId]/page.tsx:18-26, 283`
   - 实现 `getTokenSymbol()` 函数：BSC USDT 地址 → "USDT"，默认 "USDT"
   - 在金额输入框右上方显示: `Max: {maxCoverage.toLocaleString()} {tokenSymbol}`
   - 输入框右侧显示币种圆形图标（黄色圆 + "$" 符号）
   - maxCoverage 取自真实 API 的 `product.coverageAmount`

#### 4. **表单验证（中等问题 - 已修复）**
   - 路径: `apps/web/src/app/policy/form/[productId]/page.tsx:74-91`
   - 使用 `react-hook-form` + `zod` + `zodResolver`
   - Schema 定义:
     - `walletAddress`: 正则 `/^0x[a-fA-F0-9]{40}$/`，必填（但只读，理论不会出错）
     - `insuranceAmount`: 字符串转数字，> 0，≤ maxCoverage，错误提示统一
     - `insurancePeriodDays`: 必须在允许集合中（30/60/90/defaultTermDays）
   - 错误提示样式：红色文本、text-xs、mt-2 间距一致

#### 5. **Overview 实时同步（严重问题 - 已修复）**
   - 路径: `apps/web/src/app/policy/form/[productId]/page.tsx:117-124, 356-392`
   - 使用 `watch()` 实时监听 `insuranceAmount` 和 `insurancePeriodDays`
   - 计算公式:
     - `premiumRate = premiumAmt / coverageAmt`（从真实产品获取）
     - `insuranceCost = round(insuranceAmount * premiumRate, 2)`（保留两位小数）
   - Overview 区块显示:
     - Insurance Amount: 实时同步
     - Insurance Period: 实时同步（天数）
     - Insurance Cost: 实时计算

#### 6. **UI 排版对齐设计稿（中-重问题 - 已修复）**
   - 路径: 整个 page.tsx
   - Label: `text-sm font-semibold`
   - Input: 圆角 `rounded-lg`，边框 `border-[#374151]`，focus 边色 `focus:border-[#FFD54F]`
   - Section 标题: `text-white text-base font-semibold`
   - 区块背景: `bg-[#1A1D2E]`，边框 `border-[#374151]`
   - 按钮: `bg-[#FFD54F] text-[#0F111A]`，hover `brightness-110`，圆角一致
   - Terms & Conditions: 分组列表（✓/●），行距紧凑

#### 7. **Max 动态化（轻-中问题 - 已修复）**
   - 路径: `apps/web/src/app/policy/form/[productId]/page.tsx:61`
   - Max 取自真实 API: `product.coverageAmount`
   - 若 API 未返回，则使用 query 参数中的 `coverageFromQuery`，否则默认 8000000
   - UI 显示: `Max: {maxCoverage.toLocaleString()} {tokenSymbol}`

#### 8. **真实 API 接入（严重问题 - 已修复）**
   - 路径: `apps/web/src/app/policy/form/[productId]/page.tsx:48-58, 127-155`
   - **获取产品详情**:
     - GET /products → 前端 find(productId) 找到对应产品
     - 提取 premiumAmount、coverageAmount、termDays、tokenAddress
   - **创建保单**:
     - POST /policy，仅传 `{ skuId: productId }`
     - 后端通过 JWT.address 自动关联用户
     - 成功后拿到 `policyId`
   - **跳转签署页**:
     - `/policy/contract-sign/${policyId}?coverage=${amount}&period=${days}&symbol=${symbol}&premium=${cost}`
     - 签署页可直接使用这些 query 显示概览，同时可调用 `/policy/:id` 兜底

#### 9. **Loading Skeleton（中等问题 - 已修复）**
   - 路径: `apps/web/src/app/policy/form/[productId]/page.tsx:158-208`
   - 当 `isChecking || isAuthLoading || isProductLoading` 时显示骨架屏
   - 骨架组件:
     - Header（logo + address badge）
     - Back button
     - Title + Description（2-3 行）
     - 表单字段（4 个 label + input）
     - Overview 区块
     - 提交按钮
   - 使用 `animate-pulse` 和 `bg-[#374151]` 灰色块，避免闪烁

**相关文件**:
```
apps/web/src/app/policy/form/[productId]/page.tsx    # 表单页完全重写
apps/web/package.json                                 # 新增 react-hook-form, @hookform/resolvers
```

**依赖更新**:
```bash
# 新增依赖（兼容版本）
pnpm --filter web add react-hook-form@7.54.0 @hookform/resolvers@3.9.1
# zod@3.23.8 已存在
```

**费率计算公式**:
```typescript
// 从真实产品获取费率
const premiumRate = parseFloat(product.premiumAmount) / parseFloat(product.coverageAmount)

// 实时计算保费（保留两位小数）
const insuranceCost = Math.round(parseFloat(insuranceAmount) * premiumRate * 100) / 100
```

**构建验证**:
```bash
pnpm --filter web build
# ✅ 构建成功，无类型错误
# ✅ 表单页 bundle size: 26.9 kB (合理)
```

**测试方法**:
1. 启动后端 API: `pnpm --filter api dev`
2. 启动 Web 前端: `pnpm --filter web dev`
3. 登录后访问 http://localhost:3030/products
4. 点击任意产品的 "Select" 按钮
5. 验证表单页功能：

**验收清单**:
- ✅ 钱包地址自动填充且不可编辑（灰色、只读）
- ✅ Insurance Amount（可编辑）vs Insurance Cost（只读、自动计算）命名正确
- ✅ Max 和币种符号正确显示（取自真实 API）
- ✅ 输入 Insurance Amount，Cost 实时变化，Overview 同步更新
- ✅ 表单验证：金额 > 0、≤ maxCoverage，Period 在允许集合中
- ✅ 错误提示样式一致（红色、text-xs）
- ✅ UI 对齐设计稿（spacing、border、font、color）
- ✅ 提交成功 → 跳转 `/policy/contract-sign/[policyId]?coverage=...&period=...`
- ✅ Loading Skeleton 覆盖所有加载状态

**注意事项**:
- ✅ 后端始终以 JWT.address 为准，前端地址仅展示
- ✅ 不打印 JWT、签名等敏感信息
- ✅ 日志仅输出必要调试信息
- ⚠️ 下一步需在 `/policy/contract-sign/[policyId]` 页接收 query 参数并显示

---

## [2025-11-15] - 🛒 任务 M3-P1：Products 页面接入真实后端 API + 适配器 ✅ 完成

### ✅ Added - 产品列表页面真实 API 对接 + 后端字段适配

**功能概述**:
完成 Web DApp 产品列表页面（/products）与后端 GET /products 接口的对接，实现后端字段（premiumAmt/coverageAmt）到前端字段（premiumAmount/coverageAmount）的适配，保留 Loading/Error/Empty 三态 UI，并在跳转时携带产品信息参数。

**实现细节**:

1. **类型定义扩展**
   - 路径: `apps/web/src/types/index.ts`
   - 新增 `BackendSku` 接口（后端 API 响应类型）
   - 更新 `Product` 接口（前端使用类型，字段改为可选以适配不同场景）
   - 字段映射：
     - `premiumAmt` (后端) → `premiumAmount` (前端)
     - `coverageAmt` (后端) → `coverageAmount` (前端)

2. **适配器函数**
   - 路径: `apps/web/src/utils/index.ts:76`
   - 新增 `mapProduct(sku: BackendSku): Product` 函数
   - 功能：转换后端 SKU 响应为前端 Product 类型
   - 处理：
     - 字段名称映射（premiumAmt → premiumAmount）
     - 状态转换（status === 'active' → isActive: true）
     - 日期格式标准化（Date → ISO string）

3. **Products 页面真实 API 对接**
   - 路径: `apps/web/src/app/products/page.tsx:17-26`
   - 使用 TanStack Query 调用 GET /products 接口
   - 响应数据通过 `Utils.mapProduct` 适配器转换
   - 移除 Mock 数据逻辑，改为空数组作为 fallback
   - 移除 `description` 字段显示（后端不返回）
   - 更新错误提示文案："Failed to load products. Please try again later."

4. **跳转链接携带产品信息**
   - 路径: `apps/web/src/app/products/page.tsx:128`
   - 格式: `/policy/form/{productId}?name=...&termDays=...&premium=...&coverage=...`
   - 目的：减少保单表单页的二次请求，提升用户体验
   - 参数编码：使用 `encodeURIComponent` 处理产品名称

**相关文件**:
```
apps/web/src/types/index.ts
apps/web/src/utils/index.ts
apps/web/src/app/products/page.tsx
```

**构建验证**:
```bash
pnpm --filter web build
# ✅ 构建成功，TypeScript 类型检查通过
# ✅ 无类型错误，无编译错误
```

**测试方法**:
1. 启动后端 API 服务: `pnpm --filter api dev`
2. 启动 Web 前端服务: `pnpm --filter web dev`
3. 访问 http://localhost:3000/products（需先登录）
4. 验证以下功能：
   - ✅ Loading 状态显示（"Loading products..."）
   - ✅ 产品列表显示真实数据（来自后端 GET /products）
   - ✅ 产品卡片显示：产品名称、Coverage、Premium、Term Days
   - ✅ Error 状态显示（如后端未启动）
   - ✅ Empty 状态显示（如后端返回空数组）
   - ✅ 点击 Select 按钮跳转到 `/policy/form/{id}?name=...&termDays=...` 等

**API 调用示例**:
```bash
# 获取产品列表（需 JWT Token）
curl -X GET http://localhost:3001/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 响应示例
[
  {
    "id": "bsc-usdt-plan-seed",
    "name": "BSC USDT Insurance - Seed Round",
    "chainId": 56,
    "tokenAddress": "0x55d398326f99059fF775485246999027B3197955",
    "decimals": 18,
    "premiumAmt": "100.0",
    "coverageAmt": "10000.0",
    "termDays": 90,
    "status": "active",
    "createdAt": "2024-10-25T00:00:00.000Z",
    "updatedAt": "2024-10-25T00:00:00.000Z"
  }
]
```

**注意事项**:
- ✅ 后端 GET /products 为公开接口（无需鉴权），但前端已添加路由保护（useRequireAuth）
- ✅ 适配器函数使用严格类型，确保类型安全
- ✅ 产品名称可能包含特殊字符，已使用 `encodeURIComponent` 编码
- ✅ 保留了 Loading、Error、Empty 三态 UI，用户体验良好
- ⚠️ 下一步需要在 `/policy/form/[productId]` 页面接收并使用这些 query 参数

---

## [2025-11-15] - 🌐 Admin i18n 扩展覆盖 - Dashboard + Policies + Review 页面 ✅ 完成

### ✅ Enhanced - i18n 繁体中文翻译扩展至所有核心页面

**功能概述**:
扩展 Admin 系统的繁体中文 i18n 支持，覆盖 Dashboard、Policies 列表页、Review 审核页、PolicyFilters 筛选器等核心组件，保证除专业术语外的全面翻译。

**实现细节**:

1. **翻译文件扩展**
   - 路径: `apps/admin/src/locales/en.ts` + `apps/admin/src/locales/zh-TW.ts`
   - 新增翻译域:
     - `dashboard` - 仪表板相关（标题、概览、统计卡片、快速操作）
     - `navigation` - 导航栏（Dashboard、All Policies、Review Queue、Logout）
     - `policyDetail` - 保单详情页（基本信息、付款信息、时间轴、附件、合约）
     - `timeline` - 保单时间轴事件（创建、提交、批准、拒绝、激活、过期）
     - `filters` - 筛选器（按状态筛选、全部、搜索占位符）
     - `reviewPage` - 审核页面（标题、描述）
     - `policiesPage` - 保单列表页（标题、描述）

2. **已翻译的页面与组件**
   - `apps/admin/app/(dashboard)/layout.tsx` - 导航栏（Dashboard、All Policies、Review Queue、Logout）
   - `apps/admin/app/(dashboard)/dashboard/page.tsx` - 仪表板（标题、统计卡片、欢迎信息）
   - `apps/admin/app/(dashboard)/policies/page.tsx` - 保单列表页（标题、加载状态、分页）
   - `apps/admin/app/(dashboard)/review/page.tsx` - 审核页面（标题、待审核数量）
   - `apps/admin/features/policies/components/PolicyFilters.tsx` - 筛选器（搜索占位符、状态选择）

3. **翻译覆盖范围**
   - ✅ 通用UI：取消、确认、更改、提交、备注、选填、查看、搜尋、載入中
   - ✅ 导航：儀表板、所有保單、審核隊列、登出
   - ✅ Dashboard：總保單數、待審核、生效中保單、歡迎使用
   - ✅ Filters：按狀態篩選、全部、搜尋保單編號或錢包地址
   - ✅ 审核对话框：批准、拒绝、付款截止时间、确认批准/拒绝（前期已完成）
   - ✅ 状态标签：草稿、待審核、等待付款、生效中、已拒絕、已過期（前期已完成）
   - ✅ 表格：保單編號、用戶、SKU/保额、保費、保險期限、狀態、建立時間、操作（前期已完成）

**相关文件**:
```
apps/admin/src/locales/en.ts (扩展)
apps/admin/src/locales/zh-TW.ts (扩展)
apps/admin/app/(dashboard)/layout.tsx
apps/admin/app/(dashboard)/dashboard/page.tsx
apps/admin/app/(dashboard)/policies/page.tsx
apps/admin/app/(dashboard)/review/page.tsx
apps/admin/features/policies/components/PolicyFilters.tsx
```

**构建验证**:
```bash
pnpm --filter admin build
# ✅ 构建成功，所有 TypeScript 类型检查通过
```

**测试方法**:
1. 启动 admin 前端: `pnpm --filter admin dev`
2. 登录后点击右上角 Globe 图标切换到繁体中文
3. 验证以下页面的翻译:
   - Dashboard 页面：标题、统计卡片、欢迎信息
   - All Policies 页面：标题、搜索框、状态筛选、分页
   - Review Queue 页面：标题、待审核数量提示
   - 导航栏：所有导航项和登出按钮

**注意事项**:
- ✅ 核心页面（Dashboard、Policies、Review）已全面覆盖翻译
- ✅ 保单详情页（Policy Detail）翻译文件已准备，但组件尚未集成（待下一步）
- ✅ PolicyTimeline 组件翻译文件已准备，但组件尚未集成（待下一步）
- ✅ 专业术语（SKU、Policy ID、txHash 等）保持英文
- ✅ 语言切换后立即生效，无需刷新页面

---

## [2025-11-15] - 🔧 Admin API 修补 + 审核 Deadline UI + 繁体中文 i18n ✅ 完成

### ✅ Added - 任务 M2：后端 API 修补 + Admin 前端完整功能

**功能概述**:
完成 Admin 系统的后端 API 修补（添加 reviewerNote）、前端真实 API 对接、审核 Deadline UI、繁体中文 i18n 基础支持，并修复所有 TypeScript 类型错误。

---

#### A) 后端 API 修补

**实现细节**:

1. **Admin 审核 API - 添加 reviewerNote 字段**
   - 路径: `apps/api/src/modules/admin/dto/review-policy.dto.ts:36`
   - 新增 `reviewerNote` 可选字段（用于批准或拒绝时的备注）
   - 示例: `"Approved after verification"` 或 `"Missing required documents"`

2. **AdminService - 日志记录**
   - 路径: `apps/api/src/modules/admin/admin.service.ts:15`
   - 添加 Logger 支持
   - 当 reviewerNote 存在时，记录日志: `"Policy {id} approved with note: ..."`

3. **AdminController - Zod 校验**
   - 路径: `apps/api/src/modules/admin/admin.controller.ts:74`
   - 更新 zod schema 添加 `reviewerNote: z.string().optional()`
   - 传递 reviewerNote 参数到 service 层

**相关文件**:
```
apps/api/src/modules/admin/dto/review-policy.dto.ts
apps/api/src/modules/admin/admin.service.ts
apps/api/src/modules/admin/admin.controller.ts
```

---

#### B) Admin 前端 - 真实 API 对接 + Deadline UI + i18n

**实现细节**:

1. **真实后端 API 对接**
   - 路径: `apps/admin/lib/apiClient.ts:20`
   - 添加 Authorization header: `Bearer ${getToken()}`
   - 更新 API endpoints: `/api/admin/*` → `/admin/*`（直接对接后端）
   - 更新参数名: `limit` → `pageSize`（匹配后端接口）
   - 删除所有 mock API routes: `apps/admin/app/api/admin/` 目录

2. **审核 Deadline UI**
   - 路径: `apps/admin/features/policies/components/ApproveRejectDialog.tsx:167`
   - 添加 `datetime-local` 输入框，允许 admin 设置支付截止时间
   - 默认值: 当前时间 + 24 小时
   - 转换为 ISO 8601 格式发送到后端
   - 提示文字: "User must pay before this time for the policy to become active"

3. **PolicyStatus 枚举迁移**
   - 旧枚举: `'pending' | 'under_review' | 'approved' | 'rejected' | 'expired'`
   - 新枚举: `'DRAFT' | 'PENDING_UNDERWRITING' | 'APPROVED_AWAITING_PAYMENT' | 'ACTIVE' | 'REJECTED' | 'EXPIRED_UNPAID' | 'EXPIRED'`
   - 影响文件:
     - `apps/admin/features/policies/schemas.ts:15`
     - `apps/admin/lib/constants.ts:3`
     - `apps/admin/mocks/seed.ts:10`
     - 所有使用 status 的组件（PolicyTable, PolicyTimeline, PolicyFilters 等）

4. **繁体中文 i18n 系统**
   - 路径: `apps/admin/src/locales/`
   - 新增文件:
     - `en.ts` - 英文翻译（基础语言）
     - `zh-TW.ts` - 繁体中文翻译
     - `index.ts` - 导出 Locale 类型和 translations
   - 状态管理: `apps/admin/src/store/localeStore.ts`
     - 使用 Zustand + persist middleware
     - localStorage 持久化 key: `locale-storage`
   - UI 组件: `apps/admin/components/LanguageSwitcher.tsx`
     - 语言切换下拉菜单（Globe 图标）
     - 集成到 Dashboard 布局的 header

5. **已翻译的组件**
   - `ApproveRejectDialog.tsx` - 审核对话框（标题、按钮、占位符、提示文字）
   - `PolicyStatusBadge.tsx` - 状态徽章（所有 7 个状态的中英文标签）
   - `PolicyTable.tsx` - 保单列表表格（表头、操作按钮、空状态提示）

**翻译覆盖范围**:
- 通用: 取消、确认、更改、提交、备注、选填、查看、搜尋
- 审核对话框: 批准、拒绝、付款截止时间、提交中、确认批准/拒绝
- 状态标签: 草稿、待审核、等待付款、生效中、已拒绝、已过期（未付款）、已过期
- 表格: 保单编號、用户、SKU/保额、保费、保险期限、状态、建立时间、操作

**相关文件**:
```
apps/admin/lib/apiClient.ts
apps/admin/lib/constants.ts
apps/admin/features/policies/schemas.ts
apps/admin/features/policies/components/ApproveRejectDialog.tsx
apps/admin/features/policies/components/PolicyStatusBadge.tsx
apps/admin/features/policies/components/PolicyTable.tsx
apps/admin/features/policies/components/PolicyTimeline.tsx
apps/admin/features/policies/components/PolicyFilters.tsx
apps/admin/features/policies/hooks/usePolicies.ts
apps/admin/mocks/seed.ts
apps/admin/src/locales/en.ts
apps/admin/src/locales/zh-TW.ts
apps/admin/src/locales/index.ts
apps/admin/src/store/localeStore.ts
apps/admin/components/LanguageSwitcher.tsx
apps/admin/components/ui/dropdown-menu.tsx
apps/admin/app/(dashboard)/layout.tsx
```

**新增依赖**:
```bash
pnpm --filter admin add zustand
```

**环境变量**: 无新增

**构建验证**:
```bash
pnpm --filter admin build
# ✅ 构建成功，所有 TypeScript 类型检查通过
```

**测试方法**:
1. 启动 admin 前端: `pnpm --filter admin dev`
2. 登录后点击右上角 Globe 图标切换语言
3. 访问 /review 页面，点击 "Review" 按钮
4. 审核对话框应显示繁体中文界面（如选择 zh-TW）
5. Approve 操作应显示 Payment Deadline 日期时间选择器
6. 提交后应发送 reviewerNote（如填写）到后端

**注意事项**:
- ⚠️ i18n 仅覆盖核心组件，其他页面（dashboard, policies 详情页等）仍为英文
- ⚠️ 测试配置尚未添加（下一步任务）
- ⚠️ 语言切换后不影响 dayjs 日期格式（仍为 'MMM D, YYYY'）
- ✅ 所有 API 请求已切换到真实后端，不再使用 mock routes
- ✅ PolicyStatus enum 已全局统一为 7-state 枚举

---

## [2025-11-15] - 🔒 Payment 确认 API 限制 + 激活策略 ✅ 完成

### ✅ Modified - Payment 确认接口重构（先审核再支付）

**功能描述**:
重构 Payment 确认 API，添加严格的状态和时间限制。仅允许在 `APPROVED_AWAITING_PAYMENT` 状态且 `paymentDeadline` 未过期时确认支付。支付成功后自动激活保单（设置 `startAt`/`endAt`，状态 → `ACTIVE`）。

**实现细节**:

1. **支付前置条件校验**
   - 路径: `apps/api/src/modules/payment/payment.service.ts:72`
   - **状态校验**: 只允许 `APPROVED_AWAITING_PAYMENT` 状态的保单确认支付
     - 错误码: `INVALID_STATUS`
     - 其他状态（DRAFT, PENDING_UNDERWRITING, ACTIVE, etc.）返回 400
   - **截止时间校验**: `now <= paymentDeadline`
     - 错误码: `PAYMENT_EXPIRED`
     - 超时返回 400，附带 deadline 和 now 的时间戳
   - **paymentDeadline 存在性**: 必须设置 paymentDeadline
     - 错误码: `MISSING_DEADLINE`

2. **幂等性处理**
   - txHash 唯一性约束（数据库层面）
   - 重复提交同一 txHash → 返回现有 Payment 记录（200 OK）
   - 不会重复激活保单，不会抛出错误
   - 日志记录: "Payment already confirmed for txHash xxx"

3. **保单激活逻辑**
   - **原逻辑**: 支付后 → `PENDING_UNDERWRITING`（等待审核）
   - **新逻辑**: 支付后 → `ACTIVE`（立即激活）
   - 设置保障期:
     - `startAt = now`（当前时间）
     - `endAt = now + termDays`（根据 SKU 的保障期限计算，默认 90 天）
   - 数据库更新:
     ```typescript
     {
       status: PolicyStatus.ACTIVE,
       startAt,
       endAt,
     }
     ```

4. **Controller 文档更新**
   - 路径: `apps/api/src/modules/payment/payment.controller.ts:40`
   - Swagger 文档: 更新为"Review then Pay"工作流说明
   - 错误响应示例:
     - `INVALID_STATUS`: 保单状态不符
     - `PAYMENT_EXPIRED`: 超过支付截止时间
     - `MISSING_DEADLINE`: 缺少支付截止时间
   - 成功响应: Payment 记录 + 保单激活（后台自动设置 startAt/endAt）

5. **链上验证保留**
   - 继续使用 `blockchain.verifyTransfer()` 验证 ERC20 交易
   - 验证内容: token address, from address, to address, amount
   - 验证失败 → 抛出 BadRequestException

**业务流程完整链路**:

```
1. 用户创建保单 → DRAFT
2. 用户签署合同 → PENDING_UNDERWRITING
3. Admin 审核通过 → APPROVED_AWAITING_PAYMENT (设置 paymentDeadline)
4. 用户支付（本接口）→ ACTIVE (设置 startAt, endAt) ✅ 新增
5. 保障期结束 → EXPIRED
```

**修改文件**:
```
apps/api/src/modules/payment/payment.service.ts      # 状态校验 + 激活逻辑
apps/api/src/modules/payment/payment.controller.ts   # Swagger 文档更新
```

**测试命令**:
```bash
# 构建验证
pnpm --filter api build  # ✅ 0 errors

# 支付确认（成功场景）
curl -X POST http://localhost:3001/payment/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "550e8400-e29b-41d4-a716-446655440000",
    "txHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }'

# 预期响应
{
  "id": "payment-uuid",
  "policyId": "policy-uuid",
  "txHash": "0x1234...",
  "confirmed": true,
  ...
}
# 保单状态已更新为 ACTIVE，startAt 和 endAt 已设置

# 错误场景 1: 保单状态不符
# 响应 400: { "code": "INVALID_STATUS", "message": "..." }

# 错误场景 2: 支付超时
# 响应 400: { "code": "PAYMENT_EXPIRED", "message": "..." }

# 错误场景 3: 重复支付（幂等）
# 响应 200: 返回现有 Payment 记录，不重复激活
```

**注意事项**:
- ✅ TypeScript 编译通过，无类型错误
- ✅ 只允许 `APPROVED_AWAITING_PAYMENT` 状态支付
- ✅ 必须在 `paymentDeadline` 之前支付
- ✅ 支付成功后自动激活保单（`ACTIVE` + `startAt`/`endAt`）
- ✅ 幂等性保证：重复 txHash 不会抛错，返回现有记录
- ✅ 链上验证保留，继续使用 `blockchain.verifyTransfer()`
- ⚠️ 需实现定时任务：超过 `paymentDeadline` 未支付的保单 → `EXPIRED_UNPAID`

**状态机流程变更**:

**旧流程**:
```
... → (User pays) → PENDING_UNDERWRITING → (Admin approves) → ACTIVE
```

**新流程**:
```
... → (Admin approves) → APPROVED_AWAITING_PAYMENT → (User pays) → ACTIVE ✅
```

---

## [2025-11-15] - 🔄 Admin 审核 API 改为"先审核再支付" ✅ 完成

### ✅ Modified - Admin 审核流程重构（Review then Pay）

**功能描述**:
重构 Admin 审核 API，改为"先审核再支付"工作流。审核通过后，保单状态变为 `APPROVED_AWAITING_PAYMENT` 并设置 `paymentDeadline`，用户需在截止时间前支付保费后保单才会激活。

**实现细节**:

1. **ReviewPolicyDto 新增字段**
   - 路径: `apps/api/src/modules/admin/dto/review-policy.dto.ts`
   - 新增可选字段 `paymentDeadline?: string`（ISO 8601 格式）
   - 用于指定用户支付截止时间

2. **Admin 审核逻辑重构**
   - 路径: `apps/api/src/modules/admin/admin.service.ts:155`
   - **审核通过（approve）**:
     - 状态迁移: `PENDING_UNDERWRITING` → `APPROVED_AWAITING_PAYMENT`
     - 设置 `paymentDeadline`（前端传入 或 默认 now+24h）
     - **不再**设置 `startAt`/`endAt`（等待支付后设置）
   - **审核拒绝（reject）**:
     - 状态迁移: `PENDING_UNDERWRITING` → `REJECTED`
   - 参数验证: `paymentDeadline` 必须为有效 ISO 8601 字符串
   - 错误处理: 无效日期格式返回 `INVALID_DEADLINE` 错误

3. **Controller 更新**
   - 路径: `apps/api/src/modules/admin/admin.controller.ts:207`
   - Zod 验证: 添加 `paymentDeadline: z.string().optional()`
   - Swagger 文档: 更新为"Review then Pay"工作流说明
   - 请求示例:
     ```json
     {
       "action": "approve",
       "paymentDeadline": "2025-12-31T23:59:59.000Z"
     }
     ```
   - 响应示例:
     ```json
     {
       "id": "uuid",
       "status": "APPROVED_AWAITING_PAYMENT",
       "paymentDeadline": "2025-12-31T23:59:59.000Z"
     }
     ```

4. **ReviewPolicyResponse DTO 更新**
   - 路径: `apps/api/src/modules/admin/dto/review-policy-response.dto.ts`
   - 新增 `paymentDeadline?: string` 字段
   - 更新 `status` 类型为 `PolicyStatus` 枚举
   - 更新文档说明：`startAt`/`endAt` 在支付确认后设置，而非审核阶段

5. **PolicyReviewResult 接口更新**
   - 路径: `apps/api/src/modules/admin/admin.service.ts:46`
   - 新增 `paymentDeadline?: Date` 字段

**业务流程变更**:

**旧流程（直接激活）**:
```
PENDING_UNDERWRITING → (Admin approve) → ACTIVE (with startAt, endAt)
```

**新流程（先审核再支付）**:
```
PENDING_UNDERWRITING
  → (Admin approve) → APPROVED_AWAITING_PAYMENT (with paymentDeadline)
  → (User pays) → ACTIVE (with startAt, endAt)
```

**修改文件**:
```
apps/api/src/modules/admin/dto/review-policy.dto.ts           # 新增 paymentDeadline 字段
apps/api/src/modules/admin/dto/review-policy-response.dto.ts  # 新增 paymentDeadline 响应
apps/api/src/modules/admin/admin.service.ts                   # 审核逻辑重构
apps/api/src/modules/admin/admin.controller.ts                # Zod 验证 + Swagger 更新
```

**测试命令**:
```bash
# 构建验证
pnpm --filter api build  # ✅ 0 errors

# 审核通过（自定义截止时间）
curl -X PATCH http://localhost:3001/admin/policies/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"action":"approve","paymentDeadline":"2025-12-31T23:59:59.000Z"}'

# 预期响应
{
  "id": "uuid",
  "status": "APPROVED_AWAITING_PAYMENT",
  "paymentDeadline": "2025-12-31T23:59:59.000Z"
}

# 审核通过（默认截止时间 now+24h）
curl -X PATCH http://localhost:3001/admin/policies/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"action":"approve"}'

# 审核拒绝
curl -X PATCH http://localhost:3001/admin/policies/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"action":"reject"}'

# 预期响应
{
  "id": "uuid",
  "status": "REJECTED"
}
```

**注意事项**:
- ✅ TypeScript 编译通过，无类型错误
- ✅ 只允许从 `PENDING_UNDERWRITING` 状态进行审核
- ✅ `paymentDeadline` 为可选参数，服务端兜底 now+24h
- ✅ 审核通过后**不再**立即设置 `startAt`/`endAt`（等待支付确认）
- ⚠️ 需更新 Payment 确认接口，支付成功后设置 `startAt`/`endAt` 并激活保单（状态 → ACTIVE）
- ⚠️ 需实现定时任务检查 `paymentDeadline`，超时未支付的保单状态 → `EXPIRED_UNPAID`

**向后兼容性**:
- ❌ 不兼容：旧行为是审核通过直接 `ACTIVE`，新行为是 `APPROVED_AWAITING_PAYMENT`
- 建议：前端需适配新的状态机流程

---

## [2025-11-15] - 🆕 GET /policy/:id 接口 + PolicyResponseDto 枚举对齐 ✅ 完成

### ✅ Added - Policy 查询接口与 DTO 枚举同步

**功能描述**:
新增 `GET /policy/:id` 接口，支持按 UUID 查询保单详情。同时将 `PolicyResponseDto` 的 `status` 字段从字符串枚举更新为严格的 `PolicyStatus` 枚举类型，确保 API 响应与数据库状态机完全一致。

**实现细节**:

1. **新增 GET /policy/:id 接口**
   - 路径: `apps/api/src/modules/policy/policy.controller.ts:270`
   - UUID 校验：使用 zod 验证 `id` 参数为有效 UUID
   - 返回字段：
     - 基础字段: `id`, `userId`, `skuId`, `walletAddress`, `premiumAmt`, `status`
     - 可选字段: `contractHash`, `startAt`, `endAt`, `paymentDeadline`
     - 时间戳: `createdAt`, `updatedAt`
   - 安全性：不返回 `userSig` 敏感数据
   - 异常处理：400 (UUID 格式错误) / 404 (保单不存在)

2. **PolicyService.getPolicyById()**
   - 路径: `apps/api/src/modules/policy/policy.service.ts:220`
   - 处理 Prisma null 值 → undefined 转换
   - 返回类型安全的 `Policy` 接口

3. **PolicyResponseDto 枚举对齐**
   - 路径: `apps/api/src/modules/policy/dto/policy-response.dto.ts`
   - 更新 `status` 字段类型：`string` → `PolicyStatus` 枚举
   - 新增字段：`contractHash?`, `startAt?`, `endAt?`, `paymentDeadline?`
   - Swagger 文档：添加"先审核再支付"状态机说明
   - 枚举值完整列表：
     ```typescript
     enum PolicyStatus {
       DRAFT                      // 创建后
       PENDING_UNDERWRITING       // 签署后
       APPROVED_AWAITING_PAYMENT  // 审核通过
       ACTIVE                     // 支付后
       REJECTED                   // 审核拒绝
       EXPIRED_UNPAID             // 逾期未支付
       EXPIRED                    // 保单过期
     }
     ```

4. **Policy 接口扩展**
   - 更新 `Policy` 接口以包含所有状态机相关字段
   - 修复 `createPolicy()` 返回值的 null → undefined 处理

**修改文件**:
```
apps/api/src/modules/policy/policy.controller.ts       # GET /policy/:id 端点
apps/api/src/modules/policy/policy.service.ts          # getPolicyById() + Policy 接口
apps/api/src/modules/policy/dto/policy-response.dto.ts # PolicyStatus 枚举 + 新字段
```

**测试命令**:
```bash
# 构建验证
pnpm --filter api build  # ✅ 0 errors

# 本地测试示例
curl http://localhost:3001/policy/<uuid>

# 预期响应 (DRAFT 状态)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "650e8400-e29b-41d4-a716-446655440000",
  "skuId": "bsc-usdt-plan-seed",
  "walletAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "premiumAmt": "100.0",
  "status": "DRAFT",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**注意事项**:
- ✅ TypeScript 编译通过，无类型错误
- ✅ 所有可选字段正确处理 null → undefined
- ✅ Swagger 文档自动更新，展示完整枚举值
- ⚠️ GET /policy/:id 无需 JWT 认证（如需添加认证，使用 `@UseGuards(JwtAuthGuard)`）

**兼容性**:
- 向后兼容：现有 API 消费者将看到新的枚举值（大写格式）
- 数据库状态：已通过 M1-P1 迁移至枚举类型
- 前端适配：需更新前端代码以使用新枚举值（DRAFT 而非 pending）

---

## [2025-11-15] - 🔄 Prisma 状态机枚举 + 支付截止时间字段 ✅ 完成

### ✅ Added - Policy 状态机迁移（先审核再支付）

**功能描述**:
将 `Policy.status` 从 `String` 迁移至严格的 `PolicyStatus` 枚举类型，新增 `paymentDeadline` 字段支持"先审核再支付"业务流程，实现完整的保单生命周期状态机。

**实现细节**:

1. **Prisma Schema 变更**
   - 新增枚举类型 `PolicyStatus`：
     ```prisma
     enum PolicyStatus {
       DRAFT                      // 草稿（创建保单后）
       PENDING_UNDERWRITING       // 待审核（签署合同后）
       APPROVED_AWAITING_PAYMENT  // 审核通过，等待支付
       ACTIVE                     // 生效中（支付后）
       REJECTED                   // 审核拒绝
       EXPIRED_UNPAID             // 逾期未支付
       EXPIRED                    // 保单已过期
     }
     ```
   - 修改 `Policy.status` 从 `String` → `PolicyStatus`，默认值 `DRAFT`
   - 新增字段 `Policy.paymentDeadline: DateTime?`（审核通过时设置）

2. **数据库迁移**
   - 迁移文件: `apps/api/prisma/migrations/20251115082120_policy_state_machine/migration.sql`
   - 使用 CASE WHEN 语句安全地将历史字符串值映射到枚举：
     ```sql
     'pending' → DRAFT
     'under_review' → PENDING_UNDERWRITING
     'approved' → APPROVED_AWAITING_PAYMENT
     'active' → ACTIVE
     'rejected' → REJECTED
     'expired' → EXPIRED
     未知值 → DRAFT (fallback)
     ```
   - ✅ 迁移已成功应用到数据库

3. **代码更新 - 使用枚举值**
   - 所有服务层文件已更新为使用 `PolicyStatus` 枚举：
     ```typescript
     import { PolicyStatus } from 'generated/prisma/enums';

     // 创建保单
     status: PolicyStatus.DRAFT

     // 签署合同后
     status: PolicyStatus.PENDING_UNDERWRITING

     // 审核通过
     status: PolicyStatus.APPROVED_AWAITING_PAYMENT

     // 支付后激活
     status: PolicyStatus.ACTIVE
     ```
   - DTO 也更新为枚举验证（`@IsEnum(PolicyStatus)`）

4. **状态机业务规则**
   - **DRAFT → PENDING_UNDERWRITING**: 用户签署合同
   - **PENDING_UNDERWRITING → APPROVED_AWAITING_PAYMENT**: Admin 审核通过，**必须设置 paymentDeadline**
   - **APPROVED_AWAITING_PAYMENT → ACTIVE**: 用户完成支付，设置 startAt/endAt
   - **APPROVED_AWAITING_PAYMENT → EXPIRED_UNPAID**: 超过 paymentDeadline 未支付（需定时任务）
   - **PENDING_UNDERWRITING → REJECTED**: Admin 审核拒绝
   - **ACTIVE → EXPIRED**: 保障期结束（now > endAt）

**修改文件**:
```
apps/api/prisma/schema.prisma                                    # 枚举定义 + Policy 模型
apps/api/prisma/migrations/20251115082120_policy_state_machine/ # 数据库迁移
apps/api/src/modules/policy/policy.service.ts                    # DRAFT, PENDING_UNDERWRITING, ACTIVE, EXPIRED
apps/api/src/modules/admin/admin.service.ts                      # PENDING_UNDERWRITING, ACTIVE, REJECTED
apps/api/src/modules/payment/payment.service.ts                  # PENDING_UNDERWRITING
apps/api/src/modules/admin/dto/list-admin-policies.query.ts      # DTO 枚举验证
apps/api/README.md                                               # 新增状态机文档 + Mermaid 图
```

**迁移命令**（已执行）:
```bash
# 生成 Prisma Client
pnpm --filter api prisma:generate

# 应用迁移（手动执行 SQL）
docker exec -i web3ins-db psql -U postgres -d web3_insurance < migration.sql

# 验证构建
pnpm --filter api dev  # ✅ TypeScript 编译通过（0 errors）
```

**注意事项 - 历史数据兼容**:
- ⚠️ 如果生产环境有历史数据，迁移 SQL 会自动映射字符串 → 枚举
- ✅ 迁移包含安全的 fallback 逻辑（未知值默认为 DRAFT）
- 🔒 新代码强制使用枚举，不再接受任意字符串，避免状态混乱

**业务影响**:
- ✅ 状态字段现在有编译时类型检查，减少运行时错误
- ✅ 支持"先审核再支付"流程（Admin 审核 → 用户支付 → 激活）
- ⚠️ 后续需要实现定时任务，自动将超过 `paymentDeadline` 的保单标记为 `EXPIRED_UNPAID`

**文档更新**:
- ✅ `apps/api/README.md` 新增章节：
  - 📊 核心数据模型（Policy 表结构）
  - 🔄 保单状态机（Mermaid 状态图 + 详细说明）
  - 业务规则代码示例

---

## [2025-11-14] - 🔐 Web 路由保护与认证修复 ✅ 完成

### ✅ Added - 统一路由守卫系统

**功能描述**:
为所有受保护路由（Dashboard、Products、Policies、Policy 相关页面）添加了统一的路由守卫，确保未登录用户无法访问受保护页面，并稳定重定向到 `/auth/connect`，无 UI 闪烁。

**实现细节**:
1. **路由守卫 Hook** - `useRequireAuth` 已存在并优化
   - 读取 `authStore` 的 `isAuthenticated`、`isLoading`、`user` 状态
   - 提供 `isChecking` 状态，页面在检查期间显示统一 Loading 屏
   - 未登录时使用 `router.replace('/auth/connect')` 重定向
   - 添加日志前缀 `[useRequireAuth]` 便于排查

2. **受保护页面接入路由守卫**
   - `/dashboard` - 已有保护 ✅
   - `/products` - 新增保护 ✅
   - `/my-policies` - 新增保护 ✅
   - `/policy/form/[productId]` - 新增保护 ✅
   - `/policy/detail/[id]` - 新增保护 ✅
   - `/policy/contract-sign/[policyId]` - 新增保护 ✅
   - `/policy/success/[policyId]` - 新增保护 ✅

3. **统一 Loading 屏样式**
   - 所有受保护页面使用一致的 Loading UI
   - 黑色背景 + 金黄色转圈 + "Checking auth..." 提示

4. **/auth/connect 三态分流**
   - 现有逻辑已完善，无需修改
   - **已连接未登录**: 显示连接钱包按钮，触发 SIWE 登录
   - **已登录未连接**: Effect 2 会断开陈旧连接（或用户可重新连接）
   - **已登录已连接**: Effect 1 立即跳转到 `/dashboard`

5. **根路由保持服务端重定向**
   - `apps/web/src/app/page.tsx` 保持使用 `redirect('/auth/connect')`
   - 避免历史上的"无限 Loading"问题回归

**修改文件**:
```
apps/web/src/hooks/useRequireAuth.ts         # 已存在，保持原样
apps/web/src/app/products/page.tsx           # 添加 useRequireAuth + Loading screen
apps/web/src/app/my-policies/page.tsx        # 添加 useRequireAuth + Loading screen
apps/web/src/app/policy/form/[productId]/page.tsx          # 添加 useRequireAuth + Loading screen
apps/web/src/app/policy/detail/[id]/page.tsx               # 添加 useRequireAuth + Loading screen
apps/web/src/app/policy/contract-sign/[policyId]/page.tsx  # 添加 useRequireAuth + Loading screen
apps/web/src/app/policy/success/[policyId]/page.tsx        # 添加 useRequireAuth + Loading screen
apps/web/src/app/auth/connect/page.tsx       # 保持现有三态分流逻辑（已完善）
apps/web/src/app/page.tsx                    # 保持服务端 redirect（已优化）
```

**代码示例**:
```typescript
// 所有受保护页面的标准模式
export default function ProtectedPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()

  // ... 页面逻辑

  // Show loading screen while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FFD54F] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9CA3AF] text-sm font-medium">Checking auth...</p>
        </div>
      </div>
    )
  }

  // Render normal page content
  return <div>...</div>
}
```

**测试验证**:
```bash
# 1. 构建测试
pnpm --filter web build
# ✅ 构建成功，无类型错误

# 2. 本地验证
pnpm --filter web dev

# 3. 浏览器测试
# ✅ 未登录访问 /dashboard → 稳定跳到 /auth/connect（无闪烁）
# ✅ 未登录访问 /products → 稳定跳到 /auth/connect
# ✅ 未登录访问 /my-policies → 稳定跳到 /auth/connect
# ✅ 未登录访问 /policy/* → 稳定跳到 /auth/connect
# ✅ /auth/connect 三态分流正确（已连接未登录、已登录未连接、已登录已连接）
# ✅ 已登录访问受保护路由正常进入
# ✅ 根路由 / 立即重定向到 /auth/connect（无 Loading）
```

**安全性**:
- ✅ 不在前端日志打印 JWT、签名等敏感信息
- ✅ 仅基于 `authStore` 与 `provider` 状态进行导航
- ✅ 严格遵循"受保护路由必须登录"约束
- ✅ 所有重定向使用 `replace()` 而非 `push()`，避免返回绕过认证

**用户体验改进**:
- 🎯 **无闪烁**: 首次访问受保护路由时不会出现"先渲染后跳转"的视觉跳动
- ⚡ **快速响应**: Loading 屏简洁明了，authStore 初始化快速
- 🔄 **稳定重定向**: 未登录用户始终被引导到 /auth/connect
- 📱 **一致体验**: 所有受保护页面使用统一的 Loading 样式

**注意事项**:
- ⚠️ `/auth/connect` 的三态分流逻辑已经很完善，本次未修改
- ⚠️ `authStore` 的 `loadStoredAuth()` 已优化（无 token 时立即设置 `isLoading: false`）
- ⚠️ 所有 console.log 使用统一前缀（`[useRequireAuth]`、`[ConnectPage]`等）便于调试
- ⚠️ 受保护页面的 `isChecking` 检查必须在所有其他逻辑之前，确保优先级

**后续工作**:
- [ ] 考虑为 Loading 屏添加国际化支持（当前硬编码 "Checking auth..."）
- [ ] 可选：在 `useRequireAuth` 中添加更细粒度的权限检查（如角色、权限）
- [ ] 可选：添加路由切换的 loading 指示器（NProgress 或类似）

---

## [2025-11-14] - 🎨 修复底部导航栏图标变形问题 ✅ 完成

### 🐛 Fixed - 导航图标保持一致形状

**问题描述**:
底部导航栏的图标在 active (focus) 状态时会变形，因为 `fill` 和 `strokeWidth` 属性会改变图标的渲染方式。

**根本原因**:
```typescript
// 之前的代码
icon: (active: boolean) => (
  <svg fill={active ? 'currentColor' : 'none'} stroke="currentColor">
    <path strokeWidth={active ? 0 : 2} d="..." />
  </svg>
)
```

当 `active` 为 `true` 时：
- `fill='currentColor'` 会填充图标内部
- `strokeWidth={0}` 会移除描边
- 这导致图标从描边样式变为填充样式，形状发生改变

**解决方案**:
移除动态的 `fill` 和 `strokeWidth` 属性，保持图标形状一致，只通过父元素的 `text-[#FFD54F]` 来改变颜色：

```typescript
// 修改后的代码
icon: (active: boolean) => (
  <svg fill="none" stroke="currentColor">
    <path strokeWidth={2} d="..." />
  </svg>
)
```

- ✅ `fill` 始终为 `"none"`（不填充）
- ✅ `strokeWidth` 始终为 `2`（描边宽度固定）
- ✅ 颜色通过 `stroke="currentColor"` 继承父元素的文字颜色
- ✅ 父元素的 `className` 根据 `isActive` 切换 `text-[#FFD54F]` 或 `text-[#9CA3AF]`

**修改文件**:
```
apps/web/src/components/BottomNav.tsx (lines 15-46)
```

**效果**:
- ✅ **非激活状态**: 灰色描边图标 (`text-[#9CA3AF]`)
- ✅ **激活状态**: 金黄色描边图标 (`text-[#FFD54F]`)
- ✅ **图标形状**: 始终保持一致，不会变形
- ✅ **用户体验**: 清晰的视觉反馈，无闪烁或变形

**测试方式**:
```bash
pnpm --filter web dev
# 访问不同页面，观察底部导航栏图标
# ✅ Dashboard、Products、Policies、Settings 之间切换
# ✅ 图标应只改变颜色，不改变形状
```

---

## [2025-11-14] - 🐛 修复首页无限 Loading 问题 ✅ 完成

### 🐛 Fixed - 简化根路由为直接重定向

**问题描述**:
首次访问应用（localStorage 为空）时，根路由 `/` 会无限 loading，不会自动跳转到 `/auth/connect`。只有刷新页面后才能正常跳转。

**根本原因**:
根路由 `/` 使用了 Client Component + `useEffect` 进行路由跳转，依赖 `authStore` 的 `isLoading` 状态。在某些情况下（特别是首次访问），状态初始化的时序问题导致路由跳转失败。

**解决方案**:
完全移除根路由的复杂逻辑，改为使用 Next.js 的 `redirect()` 直接重定向到 `/auth/connect`：
- ✅ **服务端重定向**：使用 `redirect()` 在服务端直接跳转，无需等待 Client Component 渲染
- ✅ **简化架构**：移除不必要的中间层，`/auth/connect` 已有完整的认证路由逻辑
- ✅ **性能提升**：页面体积从 1.81 kB 降至 143 B（减少 92%）

**修改文件**:
```
apps/web/src/app/page.tsx (完全重写，从 76 行减少到 12 行)
apps/web/src/store/authStore.ts (优化 loadStoredAuth 逻辑)
```

**修改内容**:
```typescript
// 修改前（76 行，Client Component）
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) {
      router.replace('/dashboard')
    } else {
      router.replace('/auth/connect')
    }
  }, [isAuthenticated, isLoading, router])

  return <div>Loading...</div>
}

// 修改后（12 行，Server Component）
import { redirect } from 'next/navigation'

/**
 * Root Page - Immediate Redirect
 * Redirects all traffic to /auth/connect
 * The connect page handles authentication routing:
 * - Not authenticated -> Show wallet connect UI
 * - Authenticated -> Redirect to /dashboard
 */
export default function Home() {
  redirect('/auth/connect')
}
```

**authStore 优化**:
```typescript
// apps/web/src/store/authStore.ts
loadStoredAuth: async () => {
  try {
    const storedToken = storage.getItem(JWT_STORAGE_KEY)

    // ✅ 先检查 token，无 token 则立即 ready（不调用后端 API）
    if (!storedToken) {
      set({ isLoading: false, isAuthenticated: false, token: null, user: null })
      console.log('[AuthStore] No stored token found, ready for login')
      return
    }

    // ✅ 只有有 token 时才 loading 并验证
    set({ isLoading: true })
    // ... 调用后端验证
  }
}
```

**测试验证**:
```bash
# 1. 清除浏览器 localStorage
# 2. 运行开发服务器
pnpm --filter web dev

# 3. 访问 http://localhost:3000
# ✅ 立即重定向到 /auth/connect（无 loading 画面）
# ✅ 无需刷新页面
# ✅ 性能显著提升
```

**性能改进**:
- 📦 **Bundle 体积**: 1.81 kB → 143 B（减少 **92%**）
- ⚡ **加载速度**: 服务端重定向，无需等待 React hydration
- 🎯 **用户体验**: 无闪烁、无 loading 画面，立即跳转

**影响范围**:
- ✅ 所有访问根路由 `/` 的请求都会立即重定向到 `/auth/connect`
- ✅ `/auth/connect` 页面已有完整的认证逻辑（未登录显示连接页面，已登录跳转 dashboard）
- ✅ 已登录用户的体验不受影响（authStore 仍会验证 token）
- ✅ 首次访问用户的体验大幅提升（立即看到连接页面）

---

## [2025-11-14] - 🌐 Web 端国际化系统（英文/繁体中文） ✅ 完成

### ✅ Added - 完整的双语支持系统

**功能描述**:
实现了完整的国际化（i18n）系统，支持英文和繁体中文双语切换。用户可以在 Welcome 页面和 Settings 页面一键切换语言，语言偏好会持久化存储在 localStorage 中，所有 UI 文字（除专业术语如 BTC/BSC）均已翻译。

**实现细节**:
1. **类型安全的翻译系统** - 使用 TypeScript 类型推导，确保所有翻译键的类型安全
2. **Zustand 状态管理** - 统一的状态管理，与现有 authStore 模式一致
3. **LocalStorage 持久化** - 语言偏好在页面刷新后保持
4. **可复用组件** - LanguageSwitcher 组件支持 compact 和 button 两种变体
5. **全局初始化** - AppProviders 中自动加载已保存的语言偏好

**相关文件**:
```
apps/web/src/locales/
├── en.ts                           # 英文翻译（220+ 行，完整覆盖所有模块）
├── zh-TW.ts                        # 繁体中文翻译（220+ 行）
└── index.ts                        # 配置和类型导出

apps/web/src/store/
└── localeStore.ts                  # Zustand store + hooks

apps/web/src/components/
├── LanguageSwitcher.tsx            # 语言切换按钮组件（双变体）
├── AppProviders.tsx                # ✏️ 添加 locale 初始化
└── BottomNav.tsx                   # ✏️ 使用 t.nav.* 翻译

apps/web/src/app/
├── auth/connect/page.tsx           # ✏️ Welcome 页面全面翻译
└── settings/page.tsx               # ✏️ Settings 页面全面翻译 + 功能化语言切换
```

**翻译覆盖范围**:
- ✅ Common（通用词汇）: 20+ 项
- ✅ Welcome/Connect 页面: 15+ 项
- ✅ Auth 流程: 5+ 项
- ✅ Dashboard: 10+ 项
- ✅ Policies: 15+ 项
- ✅ Claims: 10+ 项
- ✅ Settings: 30+ 项（包含所有设置选项和对话框）
- ✅ Navigation: 5 项
- ✅ Errors: 13+ 项
- ✅ Success: 6+ 项
- ✅ Confirm: 3+ 项
- ✅ Date/Time: 7+ 项
- ✅ Currency: 5+ 项

**使用方法**:
```typescript
// 在任何 Client Component 中使用
import { useTranslations, useCurrentLocale, useLocaleStore } from '@/store/localeStore'

function MyComponent() {
  const t = useTranslations()                      // 获取翻译对象
  const locale = useCurrentLocale()                // 获取当前语言 'en' | 'zh-TW'
  const setLocale = useLocaleStore((s) => s.setLocale)  // 切换语言函数

  return (
    <div>
      <h1>{t.common.appName}</h1>
      <p>{t.welcome.title}</p>
      <button onClick={() => setLocale('zh-TW')}>切换到中文</button>
    </div>
  )
}
```

**语言切换功能位置**:
1. **Welcome/Connect 页面** - 右上角紧凑按钮（显示"中"/"EN"）
2. **Settings 页面** - Preferences 区域的 Language 选项（可点击切换，显示完整语言名称）

**技术亮点**:
- 🔒 **类型安全**: 使用 TypeScript `typeof` 确保中文翻译与英文结构完全一致
- 🚀 **零侵入**: 移除了 `as const`，避免字面量类型限制，提高灵活性
- 📦 **轻量化**: 无需第三方 i18n 库，纯 Zustand + TypeScript 实现
- 🔄 **实时响应**: 切换语言后所有组件立即更新，无需刷新页面
- 💾 **持久化**: localStorage key `app_locale`，跨会话保持用户偏好

**测试方式**:
```bash
# 构建测试
pnpm --filter web build

# 开发环境测试
pnpm --filter web dev
# 访问 http://localhost:3000/auth/connect
# 1. 点击右上角"中"按钮，验证页面文字切换为繁体中文
# 2. 刷新页面，验证语言偏好保持
# 3. 进入 Settings 页面，点击 Language 选项，验证切换功能
# 4. 测试所有页面的翻译完整性
```

**注意事项**:
- ⚠️ **专业术语保持不变**: BTC, BSC, ETH, USDT 等专业术语在所有语言中保持英文原样
- ⚠️ **未翻译的页面**: Dashboard, Products, Policies 等主要业务页面的翻译键已创建，但页面代码尚未更新使用翻译（待后续更新）
- ⚠️ **默认语言**: 系统默认为英文（en），首次访问或清除 localStorage 后显示英文
- ⚠️ **类型检查**: 如果添加新翻译键，必须同时在 en.ts 和 zh-TW.ts 中添加，否则会有 TypeScript 错误

**后续工作**:
- [ ] 更新 Dashboard 页面使用翻译
- [ ] 更新 Products 页面使用翻译
- [ ] 更新 My Policies 页面使用翻译
- [ ] 更新 Policy 相关表单页面使用翻译
- [ ] 添加更多语言支持（如简体中文）

---

## [2025-11-14] - 🧪 整理和优化后端测试套件 ✅ 完成

### ✅ Added - 统一的测试管理系统

**功能描述**:
将散落在 `apps/api` 根目录的测试文件整理到结构化的测试目录，并创建了统一的测试运行脚本，支持一键运行所有测试并输出可视化报告。

**目录结构**:
```
apps/api/tests/
├── unit/                           # 单元测试（无依赖，可离线运行）
│   ├── siwe-basic.test.js
│   ├── siwe-nonce-format.test.js
│   ├── siwe-message-format.test.js
│   └── siwe-message-builder.test.js
│
├── integration/                    # 集成测试（需要 API 运行）
│   ├── api-nonce-endpoint.test.sh
│   ├── policy-api.test.js
│   └── policy-api-auth.test.js
│
├── e2e/                            # 端到端测试（完整流程）
│   ├── siwe-auth-flow.test.js
│   └── siwe-complete-flow.test.js
│
├── run-all-tests.sh                # 主测试运行脚本 ⭐
└── README.md                       # 完整文档
```

**测试运行脚本特性**:
1. **彩色输出** - 使用颜色区分测试状态（绿色=通过，红色=失败，黄色=跳过）
2. **进度指示** - 每个测试显示运行状态和结果
3. **分类运行** - 按 Unit/Integration/E2E 分类运行
4. **智能跳过** - API 未运行时自动跳过集成测试
5. **统计报告** - 显示总数、通过、失败、跳过的测试数量
6. **进度条可视化** - 用进度条显示测试通过率
7. **退出码** - 成功返回 0，失败返回 1（适合 CI/CD）

**使用方式**:
```bash
# 一键运行所有测试
./apps/api/tests/run-all-tests.sh

# 或从 api 目录
cd apps/api
./tests/run-all-tests.sh
```

**测试输出示例**:
```
╔══════════════════════════════════════════════════════════════╗
║           Cohe Capital API Test Suite Runner                ║
╚══════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📦 Unit Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Running: siwe-nonce-format
  ✓ PASSED

▶ Running: siwe-message-format
  ✓ PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔗 Integration Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ API server is running at http://localhost:3001

▶ Running: api-nonce-endpoint
  ✓ PASSED

╔══════════════════════════════════════════════════════════════╗
║                      Test Summary                            ║
╚══════════════════════════════════════════════════════════════╝

  ✓ [UNIT] siwe-nonce-format
  ✓ [UNIT] siwe-message-format
  ✓ [INTEGRATION] api-nonce-endpoint

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total Tests:    9
  Passed:         9 (100%)
  Failed:         0 (0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓  ALL TESTS PASSED! 🎉

  ████████████████████████████████████████ 100%
```

**测试覆盖范围**:
- ✅ **SIWE 认证**: Nonce 格式、消息格式、完整认证流程
- ✅ **API 端点**: Nonce 生成、Policy CRUD
- ✅ **JWT 认证**: 带认证的 API 调用
- ✅ **端到端流程**: 从 nonce 生成到签名验证的完整流程

**相关文件**:
```
apps/api/tests/run-all-tests.sh    # 主测试脚本
apps/api/tests/README.md            # 完整文档
apps/api/tests/unit/*               # 4 个单元测试
apps/api/tests/integration/*        # 3 个集成测试
apps/api/tests/e2e/*                # 2 个端到端测试
```

**价值**:
1. **提高代码质量** - 每次修改后运行测试，确保没有破坏现有功能
2. **加速开发** - 快速发现问题，减少调试时间
3. **便于重构** - 有测试保护，可以放心重构代码
4. **文档化** - 测试本身就是最好的使用示例
5. **CI/CD 友好** - 可直接集成到自动化流程

**使用场景**:
```bash
# 场景1: 修改后端代码后验证
git add .
./apps/api/tests/run-all-tests.sh  # 确保所有测试通过
git commit -m "fix: ..."

# 场景2: Pull Request 前验证
./apps/api/tests/run-all-tests.sh
# 所有绿色 ✓ 才能提交 PR

# 场景3: 部署前验证
pnpm build
./apps/api/tests/run-all-tests.sh
# 确认生产环境可用
```

**开发者体验**:
- 🎨 漂亮的彩色输出
- 📊 清晰的统计数据
- 🚀 快速执行（单元测试 < 1s）
- 📝 详细的 README 文档
- 🔧 易于添加新测试

---

## [2025-11-14] - ✨ 实现 Settings 页面 Disconnect Wallet 功能 ✅ 完成

### ✅ Added - 完整的钱包断开连接功能

**功能描述**:
在 Settings 页面实现了完整的钱包断开连接功能，包括真实钱包地址显示、确认对话框、加载状态和完整的清理流程。

**实现功能**:
1. **显示真实钱包地址**
   - Header 显示当前连接的钱包地址（格式：0xABCD...1234）
   - Account 部分显示完整的钱包地址信息
   - 从 AppKit 和 authStore 获取地址数据

2. **Disconnect Wallet 按钮**
   - 点击按钮显示确认对话框
   - 防止用户意外断开连接
   - 加载状态显示（Disconnecting...）
   - Disabled 状态防止重复点击

3. **确认对话框**
   - 美观的模态对话框设计
   - 警告图标和清晰的文案
   - Cancel 和 Disconnect 两个操作按钮
   - 半透明背景遮罩

4. **完整的断开流程**
   - 调用 `resetAuth()` 清理所有存储
   - 断开 WalletConnect 会话
   - 清除 JWT token 和用户数据
   - 清除 WalletConnect/AppKit 缓存
   - 清空 authStore 状态
   - 重定向到登录页面

**相关文件**:
```
apps/web/src/app/settings/page.tsx    # Settings 页面完整实现
apps/web/src/lib/resetAuth.ts          # 复用现有的认证重置工具
apps/web/src/store/authStore.ts        # 使用 logout 清空状态
```

**UI 特性**:
- 🎨 红色主题的 Disconnect 按钮（警告色）
- ⚠️ 确认对话框防止误操作
- 🔄 加载状态和 spinner 动画
- 🚫 Disabled 状态防止重复操作
- 📱 响应式设计，适配移动端
- 🎭 流畅的过渡动画

**技术实现**:
```typescript
// 集成钱包和认证状态
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useAuthStore } from '@/store/authStore'
import { resetAuth } from '@/lib/resetAuth'

// 格式化地址显示
const formatAddress = (addr) => {
  if (!addr) return 'Not Connected'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// 断开连接流程
const confirmDisconnect = async () => {
  setIsDisconnecting(true)
  await resetAuth({ close })  // 清理所有存储和会话
  logoutStore()               // 清空 auth store
  router.push('/auth/connect') // 重定向到登录页
}
```

**用户体验**:
1. 用户点击 "Disconnect Wallet"
2. 显示确认对话框询问是否确认断开
3. 用户确认后显示加载状态
4. 完成所有清理操作
5. 自动跳转到登录页面
6. 用户需要重新连接钱包才能访问

**测试要点**:
- ✅ 钱包地址正确显示
- ✅ 确认对话框正常弹出
- ✅ Cancel 按钮关闭对话框
- ✅ Disconnect 按钮触发断开流程
- ✅ 加载状态正确显示
- ✅ 存储和会话完全清理
- ✅ 重定向到登录页面成功

---

## [2025-11-14] - 🔧 修复 SIWE Nonce 格式问题（UUID 连字符）✅ 完成

### ✅ Fixed - Nonce 不能包含连字符等特殊字符

**问题表现**:
后端仍然报错：`invalid message: max line number was 9`，即使消息格式完全正确（10行，空行位置正确）。

**根本原因**:
后端使用 `randomUUID()` 生成 nonce，产生的格式为 `79ac432d-57ab-4a3b-a5aa-ff10e2d0e09a`（包含连字符）。

**SIWE v3.0.0 的 nonce 字段不接受连字符等特殊字符，只接受字母和数字！**

根据 EIP-4361 标准，nonce 的 ABNF 定义是：
```
nonce = 8*ALPHA / 8*DIGIT
```
即：nonce 必须是字母或数字字符，不包括特殊字符。

**测试验证**:
```bash
❌ UUID with hyphens: "79ac432d-57ab-4a3b-a5aa-ff10e2d0e09a" → FAILED
✅ UUID without hyphens: "79ac432d57ab4a3ba5aaff10e2d0e09a" → SUCCESS
✅ Alphanumeric: "wD5bHPxpRSfXWkYNK8m3v" → SUCCESS
```

**修复方案**:
在后端生成 nonce 时移除连字符：
```typescript
// 修复前
const nonce = randomUUID(); // "79ac432d-57ab-4a3b-a5aa-ff10e2d0e09a"

// 修复后
const nonce = randomUUID().replace(/-/g, ''); // "79ac432d57ab4a3ba5aaff10e2d0e09a"
```

**相关文件**:
```
apps/api/src/modules/auth/auth.service.ts:37   # requestNonce() - 初始 nonce 生成
apps/api/src/modules/auth/auth.service.ts:134  # verifySignature() - 刷新 nonce
apps/api/test-uuid-nonce.js                    # 新增：测试不同 nonce 格式
apps/api/test-e2e-nonce.js                     # 新增：E2E 流程测试
apps/api/test-real-api.sh                      # 新增：真实 API 测试脚本
```

**测试结果**:
```bash
# E2E 测试
node apps/api/test-e2e-nonce.js
# ✅ E2E Test: SUCCESS - Complete flow works correctly!

# 真实 API 测试
./apps/api/test-real-api.sh
# ✅ All tests passed! Backend is ready for SIWE authentication.

# API 响应示例
curl -X POST http://localhost:3001/auth/siwe/nonce
# {"nonce":"e887d727c2a246ad8a00f4d68635e3ae"}  ✅ 无连字符！
```

**关键要点**:
- UUID 的连字符会导致 SIWE 解析失败
- 移除连字符后，nonce 变成 32 个十六进制字符（a-f0-9）
- 保持了 UUID 的唯一性和随机性
- 符合 SIWE v3.0.0 的 alphanumeric-only 要求

---

## [2025-11-14] - 🔧 修复 SIWE 消息 statement 后多余空行问题 ✅ 完成

### ✅ Fixed - statement 和 URI 之间只能有一个空行

**问题表现**:
后端报错：`invalid message: max line number was 9`，消息有9行但解析失败。

**根本原因**:
`siweUtil.ts` 在生成消息时，statement 后面添加了一个空行（line 49: `\n${statement}\n`），然后在 URI 前又添加了一个空行（line 53: `\nURI:`），导致 statement 和 URI 之间有**两个空行**，违反了 SIWE 格式规范。

**错误的消息格式**（11行，两个空行）:
```
Line 0: domain wants you to sign in...
Line 1: address
Line 2: (blank)
Line 3: statement
Line 4: (blank)
Line 5: (blank)  ❌ 多余的空行！
Line 6: URI: ...
...
Line 10: Issued At: ...
```
❌ 解析失败：`invalid message: max line number was 6`

**正确的消息格式**（10行，只有一个空行）:
```
Line 0: domain wants you to sign in...
Line 1: address
Line 2: (blank)
Line 3: statement
Line 4: (blank)  ✅ 唯一的空行
Line 5: URI: ...
Line 6: Version: 1
Line 7: Chain ID: 97
Line 8: Nonce: ...
Line 9: Issued At: ...
```
✅ 解析成功！

**修复方案**:
重构 `formatSiweMessage` 函数，逻辑更清晰：
1. address 后总是添加一个空行
2. 如果有 statement，添加 statement + 一个空行
3. 然后直接添加 URI（不需要额外空行）

**相关文件**:
```
apps/web/src/lib/siweUtil.ts           # 修复空行逻辑
apps/api/test-our-format.js            # 新增：测试我们的格式函数
apps/api/test-siwe-format.js           # 新增：对比正确和错误格式
```

**测试验证**:
```bash
node apps/api/test-our-format.js
# ✅ SUCCESS! Message parsed correctly
```

**关键代码变更**:
```typescript
// 修复前：重复添加空行
message += `${address}\n`
if (statement) {
  message += `\n${statement}\n`  // 这里有 \n
}
message += `\nURI: ${uri}\n`     // 这里又有 \n，导致两个空行！

// 修复后：清晰的逻辑
message += `${address}\n`
message += `\n`                  // address 后的空行
if (statement) {
  message += `${statement}\n`
  message += `\n`                // statement 后的空行
}
message += `URI: ${uri}\n`       // 直接添加 URI，无需额外空行
```

---

## [2025-11-14] - 🔧 修复 SIWE 消息格式错误（深度排查）✅ 完成

### ✅ Fixed - SIWE v3.0.0 强制要求 statement 字段

**问题表现**:
用户报告登录时出现错误：`Error: Invalid SIWE message format`
即使修复了空行问题，错误仍然重复出现。

**深度排查过程**:

通过创建测试脚本直接调用 `siwe` 库进行解析，发现真正的根本原因：

**SIWE v3.0.0 库强制要求消息必须包含 `statement` 字段！**

测试结果：
```bash
❌ WITHOUT statement: invalid message: max line number was 7
✅ WITH statement: SUCCESS!
```

**根本原因**:
后端使用的 `siwe@3.0.0` 库在解析消息时，**强制要求** statement 字段。如果消息中没有 statement，解析会失败并报错 "invalid message: max line number was 7"。

这是 SIWE v3.0.0 的一个破坏性变更，与 EIP-4361 标准（statement 是可选字段）不一致。

**修复前的消息**（没有 statement）：
```
localhost wants you to sign in with your Ethereum account:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

URI: http://localhost:3001
Version: 1
Chain ID: 97
Nonce: wD5bHPxpRSfXWkYNK8m3v
Issued At: 2024-01-01T00:00:00.000Z
```
❌ 解析失败：`invalid message: max line number was 7`

**修复后的消息**（添加 statement）：
```
localhost wants you to sign in with your Ethereum account:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Sign in with Ethereum to the app.

URI: http://localhost:3001
Version: 1
Chain ID: 97
Nonce: wD5bHPxpRSfXWkYNK8m3v
Issued At: 2024-01-01T00:00:00.000Z
```
✅ 解析成功！

**修复方案**:

在 `apps/web/src/hooks/useSiweAuth.ts` 中添加 statement 字段：

```typescript
// 修改前：没有 statement
const siweMessage = formatSiweMessage({
  domain: SIWE_DOMAIN,
  address,
  // 没有 statement  ❌
  uri: SIWE_URI,
  version: '1',
  chainId: CHAIN_ID,
  nonce,
  issuedAt: new Date().toISOString(),
})

// 修改后：添加 statement
const siweMessage = formatSiweMessage({
  domain: SIWE_DOMAIN,
  address,
  statement: 'Sign in with Ethereum to the app.',  // ✅ 必需字段！
  uri: SIWE_URI,
  version: '1',
  chainId: CHAIN_ID,
  nonce,
  issuedAt: new Date().toISOString(),
})
```

**相关文件**:
```
apps/web/src/hooks/useSiweAuth.ts     # 添加 statement 字段
apps/web/src/lib/siweUtil.ts          # 修复空行格式（已在之前修复）
apps/api/test-siwe.js                 # 用于测试 SIWE 消息解析的测试脚本
```

**排查方法**:
通过创建独立的 Node.js 测试脚本，直接调用 `siwe` 库测试不同格式的消息，最终发现 statement 是必需的。

**测试验证**:
```bash
# 测试脚本验证
cd apps/api && node test-siwe.js

# 应该看到：
✅ SUCCESS! (with statement)
❌ FAILED: invalid message: max line number was 7 (without statement)
```

**重要发现**:
- SIWE v3.0.0 强制要求 statement，这可能是库的 bug 或设计变更
- EIP-4361 标准中 statement 是可选的
- 建议后续考虑降级到 SIWE v2.x 或向 SIWE 库提 issue

**参考资料**:
- SIWE 库：https://github.com/spruceid/siwe
- EIP-4361 标准：https://eips.ethereum.org/EIPS/eip-4361

---

## [2025-11-14] - 🚨 紧急修复：无限签名请求循环 ✅ 完成

### ✅ Hotfix - 修复 Effect 依赖导致的无限 MetaMask 签名弹窗问题

**问题表现**:
用户报告打开 `/auth/connect` 页面后，MetaMask 签名请求无限弹出，无法停止。

**根本原因分析**:

1. **Effect 依赖包含了变化的函数引用** (`login`, `clearError`, `close`)
   - 这些函数在每次渲染时都会重新创建
   - 导致 Effect 重新触发 → 调用 `login()` → 失败后调用 `close()` → `close` 引用变化 → Effect 再次触发
   - 形成**无限循环**

2. **缺少防重复触发机制**
   - 没有标志位防止同一个 address 重复尝试登录
   - `close()` 断开钱包后，可能又重新连接，再次触发登录

3. **自动登录逻辑与用户需求不符**
   - 用户要求："完全取消已连接钱包但还没有后端 sign in 的状态"
   - 但之前的代码在检测到钱包连接后自动触发 SIWE，违反了二元状态设计

**修复方案**:

### 1. **移除 Effect 依赖中的函数引用**

```typescript
// 修改前：依赖包含 login, clearError, close
useEffect(() => {
  autoLogin()
}, [
  authStoreLoading,
  isAuthenticated,
  isConnected,
  address,
  login,        // ❌ 每次渲染都变化
  clearError,   // ❌ 每次渲染都变化
  close,        // ❌ 每次渲染都变化
])

// 修改后：只依赖必要的状态
useEffect(() => {
  handleSiweLogin()
}, [
  isConnected,
  address,       // ✅ 只依赖 address 变化
  walletProvider,
  isAuthenticated,
  isSiweLoading,
  chainId,
])
```

### 2. **使用 useRef 标记用户主动发起的流程**

```typescript
const isUserInitiatedFlow = useRef(false)

// 只有用户点击 Connect Wallet 时才标记
const handleConnectWallet = async () => {
  isUserInitiatedFlow.current = true
  await open()
}

// Effect 中检查标志位
useEffect(() => {
  if (!isUserInitiatedFlow.current) {
    return // 不是用户主动触发，跳过
  }
  // ...执行 SIWE 登录
}, [isConnected, address, ...])
```

### 3. **新增 Effect 2：强制二元状态，断开 stale 连接**

```typescript
/**
 * Effect 2: Enforce binary state
 * 如果检测到钱包已连接但用户未认证，且不是用户主动触发的流程，
 * 说明这是从上次会话残留的连接 → 自动断开
 */
useEffect(() => {
  if (authStoreLoading || isAuthenticated || isUserInitiatedFlow.current) {
    return
  }

  if (isConnected && address) {
    console.log('[ConnectPage] Detected stale wallet connection, disconnecting...')
    close()
  }
}, [authStoreLoading, isAuthenticated, isConnected, address, isSiweLoading, close])
```

### 4. **简化状态机：只有两个状态**

- **未连接** → 显示 "Connect Wallet" 按钮
- **已认证** → 自动跳转 Dashboard
- **已连接但未认证的中间态** → 自动断开，回到"未连接"

**修复后的流程**:

```
1. 用户打开 /auth/connect
   ↓
2. authStore 验证 localStorage 中的 token（后端 /auth/siwe/me）
   ↓
3a. Token 有效 → 跳转 Dashboard ✅
3b. Token 无效 → 清理 localStorage
   ↓
4. 检查钱包连接状态
   ↓
5a. 钱包未连接 → 显示 "Connect Wallet" 按钮 ✅
5b. 钱包已连接但未认证 → 自动断开（stale connection）
   ↓
6. 用户点击 "Connect Wallet"
   ↓
7. 设置 isUserInitiatedFlow.current = true
   ↓
8. 打开 AppKit 钱包选择弹窗
   ↓
9. 用户选择钱包并连接
   ↓
10. Effect 3 检测到钱包连接 + isUserInitiatedFlow = true
    ↓
11. 自动触发 SIWE 签名请求（只触发一次）
    ↓
12a. 签名成功 → 保存 token → 跳转 Dashboard ✅
12b. 签名失败/拒绝 → 断开钱包 → 重置 isUserInitiatedFlow → 显示错误 ✅
```

**相关文件**:
```
apps/web/src/app/auth/connect/page.tsx    # 完全重构逻辑，使用 useRef 防止无限循环
```

**关键改进**:
- ✅ **无限循环修复**: 移除 Effect 依赖中的函数引用
- ✅ **防重复触发**: 使用 `isUserInitiatedFlow` ref 标记用户主动操作
- ✅ **强制二元状态**: 自动断开 stale 钱包连接
- ✅ **用户体验**: 只在用户点击时才触发签名，不会自动弹窗

**测试方法**:
```bash
# 1. 清除浏览器所有数据
- 打开 DevTools → Application → Clear storage → Clear site data

# 2. 访问页面
- 访问 http://localhost:3000
- 应该只看到 "Connect Wallet" 按钮，不会自动弹出签名

# 3. 测试登录
- 点击 "Connect Wallet"
- 选择钱包并连接
- 应该只弹出一次签名请求
- 签名成功后跳转 Dashboard

# 4. 测试 stale connection
- 不要 Logout，直接刷新页面
- 如果之前的 token 已过期，应该：
  a. authStore 验证 token 失败
  b. 清理 localStorage
  c. 检测到钱包还连着 → 自动断开
  d. 显示 "Connect Wallet" 按钮

# 5. 验证无无限循环
- 在任何情况下，MetaMask 签名请求应该最多只弹出一次
```

**破坏性变更**:
- 不再在页面加载时自动触发 SIWE 登录
- 用户必须主动点击 "Connect Wallet" 才会开始登录流程

---

## [2025-11-14] - 🔐 认证系统安全性和逻辑重构 ✅ 完成

### ✅ Fixed - 修复认证系统的安全漏洞、竞态条件、性能问题和 UX 缺陷

**问题诊断**:
通过全面代码审查，发现了认证流程中的多个关键问题：

1. **🚨 安全漏洞 (P0)**: `authStore.loadStoredAuth` 从 localStorage 读取 JWT 后直接信任，未与后端验证有效性
   - 攻击者可手动修改 localStorage 伪造身份
   - Token 可能已过期、被撤销或被篡改
   - 存在认证绕过、权限提升、数据泄露风险

2. **🔁 竞态条件 (P1)**: 多个组件重复调用 `loadStoredAuth`
   - `page.tsx`、`auth/connect/page.tsx`、`useRequireAuth` 都在调用
   - 同一页面可能触发 2-3 次 localStorage 读取
   - 如果加入 token 验证 API，会产生多次重复请求

3. **⏱️ 性能问题 (P1)**: 不必要的 100ms 延迟
   - `page.tsx` 和 `connect/page.tsx` 都有人为的 100ms setTimeout
   - 每次页面加载强制等待 100-200ms
   - localStorage 是同步操作，无需延迟

4. **🔄 UX 问题 (P0)**: Logout 逻辑混乱
   - 只调用 `close()` 但未清理 localStorage
   - 未调用 `authStore.logout()`
   - Alert 提示 "cleared storage keys" 但实际未清理
   - Logout 后立即 `loadStoredAuth()` 重新加载未清理的数据

5. **🔀 状态逻辑 (P0)**: auth/connect 页面存在三态混乱
   - 未连接钱包 / 已连接但未 Sign In / 已 Sign In
   - 中间态容易卡住，用户体验差

**修复方案**:

### 1. **authStore.ts - 添加 JWT Token 后端验证**

```typescript
// 修改前：直接信任 localStorage 中的 token
if (storedToken && storedUserData) {
  const user = JSON.parse(storedUserData) as User
  // TODO: Optionally validate token with backend here
  set({ token: storedToken, user, isAuthenticated: true })
}

// 修改后：调用后端 /auth/siwe/me 验证 token 有效性
const response = await fetch(`${API_BASE_URL}/auth/siwe/me`, {
  headers: { 'Authorization': `Bearer ${storedToken}` }
})

if (!response.ok) {
  // Token 无效，清理存储
  storage.removeItem(JWT_STORAGE_KEY)
  storage.removeItem(USER_STORAGE_KEY)
  set({ isAuthenticated: false })
} else {
  // Token 有效，更新用户数据
  const { userId, address } = await response.json()
  set({ token: storedToken, user: { id: userId, address }, isAuthenticated: true })
}
```

### 2. **AppProviders.tsx - 全局初始化认证**

```typescript
// 在 AppProviders 中一次性初始化认证，避免重复调用
export function AppProviders({ children }) {
  const loadStoredAuth = useAuthStore(state => state.loadStoredAuth)

  useEffect(() => {
    console.log('[AppProviders] Initializing auth on app startup...')
    loadStoredAuth()
  }, [loadStoredAuth])

  return <QueryClientProvider>{children}</QueryClientProvider>
}
```

### 3. **page.tsx - 移除延迟和重复逻辑**

```typescript
// 修改前：手动读取 localStorage + 100ms 延迟
const timer = setTimeout(() => {
  const token = localStorage.getItem('auth_jwt_token')
  if (token) router.push('/dashboard')
}, 100)

// 修改后：直接使用 authStore，无延迟
const { isAuthenticated, isLoading } = useAuthStore()

useEffect(() => {
  if (isLoading) return
  if (isAuthenticated) router.replace('/dashboard')
  else router.replace('/auth/connect')
}, [isAuthenticated, isLoading, router])
```

### 4. **useRequireAuth.ts - 移除重复调用**

```typescript
// 修改前：每次调用都 loadStoredAuth()
useEffect(() => {
  loadStoredAuth()
  const timer = setTimeout(() => { /* check auth */ }, 0)
}, [loadStoredAuth])

// 修改后：直接使用全局初始化的 authStore
const { isAuthenticated, user, isLoading } = useAuthStore()

useEffect(() => {
  if (isLoading) return
  if (!isAuthenticated) router.replace('/auth/connect')
}, [isAuthenticated, isLoading, router])
```

### 5. **auth/connect/page.tsx - 重构为二元状态逻辑**

```typescript
// 新设计原则：
// 1. 只有两个状态：未认证（显示按钮）或已认证（跳转）
// 2. 钱包连接后自动触发 SIWE 登录
// 3. 如果连接了钱包但未认证，自动断开钱包
// 4. 失败后断开钱包，回到初始状态

// Effect 1: 已认证 -> 跳转 dashboard
useEffect(() => {
  if (!authStoreLoading && isAuthenticated && user) {
    router.replace('/dashboard')
  }
}, [authStoreLoading, isAuthenticated, user, router])

// Effect 2: 钱包连接但未认证 -> 自动触发 SIWE 登录
useEffect(() => {
  if (authStoreLoading || isAuthenticated || !isConnected) return

  const autoLogin = async () => {
    // 检查网络
    if (chainId !== targetChainId) {
      setLocalError(`Please switch to ${targetNetworkName}`)
      await close() // 断开钱包
      return
    }

    // 自动登录
    const success = await login()
    if (!success) {
      await close() // 登录失败，断开钱包
    }
  }

  autoLogin()
}, [authStoreLoading, isAuthenticated, isConnected, login, close])
```

### 6. **handleLogout - 完整清理所有状态**

```typescript
// 修改前：只调用 close()，未清理 localStorage
const handleLogout = async () => {
  await close()
  alert('Successfully logged out') // 误导性提示
  loadStoredAuth() // 重新加载未清理的数据！
}

// 修改后：使用 resetAuth 完整清理
const handleLogout = async () => {
  setIsLoggingOut(true)

  // 调用 resetAuth 清理所有存储和 WalletConnect 缓存
  const result = await resetAuth({ close })

  console.log(`Removed ${result.removedKeys.length} storage keys`)

  if (result.success) {
    console.log('Successfully logged out')
  } else {
    console.warn('Logout with warnings:', result.errors)
  }

  setIsLoggingOut(false)
}
```

**相关文件**:
```
apps/web/src/store/authStore.ts              # 添加 JWT 后端验证逻辑
apps/web/src/components/AppProviders.tsx     # 全局初始化 loadStoredAuth
apps/web/src/app/page.tsx                    # 移除延迟和重复逻辑
apps/web/src/hooks/useRequireAuth.ts         # 移除重复的 loadStoredAuth 调用
apps/web/src/app/auth/connect/page.tsx       # 重构为二元状态逻辑
```

**安全性提升**:
- ✅ JWT Token 每次启动时与后端验证，防止伪造
- ✅ 过期或无效的 token 自动清理
- ✅ 无法通过修改 localStorage 绕过认证

**性能优化**:
- ✅ 移除所有不必要的 setTimeout 延迟
- ✅ loadStoredAuth 只在全局初始化时调用一次
- ✅ 避免重复的网络请求和 localStorage 读取

**用户体验改进**:
- ✅ 二元状态设计：只有"未连接"或"已认证"两个状态
- ✅ 钱包连接后自动 SIWE 登录，无需手动点击
- ✅ 失败自动断开，回到初始状态
- ✅ Logout 完整清理所有数据，无残留

**测试方法**:
```bash
# 1. 启动开发服务器
cd apps/web && pnpm dev

# 2. 测试登录流程
- 访问 http://localhost:3000
- 点击 "Connect Wallet" 连接钱包
- 自动弹出签名请求
- 签名成功后自动跳转 /dashboard

# 3. 测试 Token 验证
- 打开浏览器 DevTools -> Application -> Local Storage
- 手动修改 auth_jwt_token 为无效值
- 刷新页面，应自动清理并跳转到 /auth/connect

# 4. 测试 Logout
- 在 /auth/connect 页面点击 Logout
- 检查 Console 输出的 "Removed X storage keys"
- 确认 localStorage 已清空

# 5. 测试失败场景
- 连接钱包后，拒绝签名
- 应自动断开钱包，显示错误信息
- 可以重新点击 Connect Wallet
```

**注意事项**:
- ⚠️ 后端必须有 `/auth/siwe/me` 接口并验证 JWT
- ⚠️ 如果后端 token 过期时间很短，用户可能频繁需要重新登录
- ⚠️ 建议后端实现 token 刷新机制（refresh token）
- ⚠️ 现有用户需要重新登录一次以触发新的验证流程

**破坏性变更**:
- `loadStoredAuth` 现在是异步函数，但调用方式保持不变
- 移除了所有 setTimeout 延迟，页面加载速度更快
- auth/connect 页面不再显示 "Sign In" 按钮（自动触发）

---

## [2025-11-14] - Web SIWE 登录体验修复（移除自动登录 + 超时保护 + 二元状态）✅ 完成

### ✅ Fixed - 取消页面加载即自动登录；只在用户点击时进入签名流程，并为关键步骤添加超时保护，避免停留在“Signing in with wallet...”中间态。

**问题表现**:
- 打开 `/auth/connect` 即显示“Signing in with wallet...”，用户无操作也进入中间态。
- 钱包签名或会话异常时 `signMessage` 可能挂起，页面无限 Loading。

**修复要点**:
- UI 状态收敛：不再在页面加载时触发 SIWE；仅在用户点击 “Sign In” 后显示 Loading。
- 加入超时保护：为 `nonce` 获取、`signMessage`、`verify`、`me` 请求分别设置 8s/30s/10s/10s 超时，失败后回退到可点击状态并显示可读错误。
- 首屏水合：等待 authStore 水合完成后再决定跳转或展示按钮，避免逻辑竞态。
- 二元状态强制：进入 `/auth/connect` 时只允许两种状态——
  1) 未连接钱包（显示 Connect Wallet）
  2) 已完成后端 Sign-In（直接跳转 /dashboard）
  若检测到“已连接但未完成 Sign-In”，将直接 `disconnect()` 以清除中间态；用户重新点击 Connect 后将触发签名流程，失败则自动断开。

**涉及文件**:
```
apps/web/src/app/auth/connect/page.tsx     # 连接页：移除首屏自动登录；强制二元状态；连接后自动 SIWE，失败自动 disconnect
apps/web/src/hooks/useSiweAuth.ts          # 登录流程：添加 withTimeout 包装，超时错误提示
```

**注意事项**:
- 如在浏览器中已存在旧的 WalletConnect 缓存，建议使用页面中的 Logout（包含缓存清理）后重新登录。
- 后端 SIWE 域和 URI 需与前端环境变量一致（NEXT_PUBLIC_SIWE_DOMAIN / NEXT_PUBLIC_SIWE_URI）。

**测试建议**:
1. 首次进入 `/auth/connect`：应看到 Connect Wallet 或（钱包已连接时）Sign In 按钮，不应出现 Loading。
2. 点击 Sign In 后：若钱包弹窗未确认 30s，应出现“Timed out waiting for wallet signature”错误并可重试。
3. 登录成功后：应自动跳转 `/dashboard`。

---

## [2025-01-15] - 彻底重构认证流程 🔧 Major Refactor

### 🎯 核心问题解决 - 消除"中间态卡死"的根本原因

**问题诊断** (感谢用户详细分析):
用户报告了"打开页面即卡在 Signing in with wallet 中间态"的问题，并进行了深度诊断，发现了以下根本性设计缺陷：

1. **自动触发登录导致中间态卡住** - 页面加载时只要检测到"已连接但未认证"就自动发起 SIWE 登录
2. **签名 Promise 无超时/可取消** - `signer.signMessage()` 可能永久挂起
3. **AppKit UI 未正确挂载** - 缺少对 AppKit 会话管理的支持
4. **Store 水合与自动登录有竞态** - 未等待 authStore 水合完成
5. **UI 状态条件耦合不当** - Loading 状态在用户无操作时出现
6. **单纯依赖 `isConnected`** - 未检查会话健康状态

**设计目标**:
> 用户应该要么没有登录完成，要么已经链接钱包跳转至 dashboard，**永远不可能出现打开就卡在中间的状态**。

### ✅ 完整重构方案

#### 1. **移除所有自动登录逻辑** (最关键修复)

**之前**: 页面加载时自动检测钱包连接状态并触发 SIWE 登录
**现在**: **仅在用户点击 "Sign In" 按钮时才触发 SIWE 登录**

```typescript
// ❌ 删除了所有自动登录的 useEffect
// ✅ 仅通过用户点击按钮触发
const handleSignIn = async () => {
  // 健康检查 → 网络检查 → SIWE 登录
  const success = await login()
}
```

#### 2. **等待 authStore 水合完成后再渲染 UI**

添加 `authHydrated` 状态，确保在 authStore 水合完成前显示 Loading：

```typescript
const [authHydrated, setAuthHydrated] = useState(false)

useEffect(() => {
  loadStoredAuth()
  setTimeout(() => setAuthHydrated(true), 100)
}, [])

// 水合前显示 Loading
if (!authHydrated || authStoreLoading) {
  return <LoadingScreen />
}
```

#### 3. **会话健康检查替代单纯 `isConnected`**

```typescript
const isWalletSessionHealthy = (): boolean => {
  return !!(isConnected && address && walletProvider)
}

// 使用会话健康状态替代 isConnected
{isWalletSessionHealthy() ? <SignInButton /> : <ConnectButton />}
```

#### 4. **优化 UI 状态机 - 严格仅两种最终状态**

```typescript
// State Machine:
// 1. 水合中 → Loading Screen
// 2. 已认证 → Redirect to Dashboard (很少看到这个状态)
// 3. 未认证 + SIWE Loading → "Signing in..." (仅用户点击后)
// 4. 未认证 + 会话健康 → "Sign In" 按钮
// 5. 未认证 + 未连接 → "Connect Wallet" 按钮

{isSiweLoading ? (
  <LoadingSigningIn />  // 仅用户点击后出现
) : isWalletSessionHealthy() ? (
  <SignInButton />       // 钱包已连接，等待用户点击
) : (
  <ConnectButton />      // 未连接钱包
)}
```

#### 5. **AppKit 初始化说明**

Reown AppKit v5 通过全局初始化工作（`createAppKit()` 返回单例），无需额外的 Provider 组件。已在 `apps/web/src/config/appkit.ts` 中正确配置，并在 `AppProviders` 中导入以确保初始化。

**相关文件**:
```
apps/web/src/app/auth/connect/page.tsx    # 完全重写 - 移除自动登录
apps/web/src/components/AppProviders.tsx  # 添加注释说明 AppKit 初始化
```

### 🎯 新行为流程图

```
用户访问 /auth/connect
    ↓
等待 authStore 水合 (100ms)
    ↓
已认证? → YES → 立即跳转 /dashboard
    ↓ NO
钱包已连接且会话健康?
    ↓ YES → 显示 "Sign In" 按钮（等待用户点击）
    ↓ NO  → 显示 "Connect Wallet" 按钮
         ↓
    用户点击 "Connect Wallet"
         ↓
    AppKit Modal 打开 → 连接成功 → 显示 "Sign In" 按钮
         ↓
    用户点击 "Sign In"
         ↓
    网络检查 → SIWE 签名 → 验证 → 存储 token → 跳转 /dashboard
         ↓
    任何步骤失败 → 回到 "Sign In" 按钮状态 + 错误提示
```

### 🔥 关键改进点对比

| 问题 | 之前 | 现在 |
|------|------|------|
| 自动登录 | ❌ 页面加载即触发 | ✅ 仅用户点击触发 |
| UI 中间态 | ❌ 可能卡住无限 Loading | ✅ Loading 仅在用户操作时出现 |
| Store 水合 | ❌ 与自动登录有竞态 | ✅ 水合完成前显示 Loading |
| 会话检查 | ❌ 仅依赖 `isConnected` | ✅ 检查 address + walletProvider |
| 状态机逻辑 | ❌ 复杂的多状态条件 | ✅ 清晰的两种最终状态 |
| 错误处理 | ❌ 可能永久卡住 | ✅ 任何错误回到可操作状态 |

### 📋 测试场景

1. ✅ 首次访问 → 显示 "Connect Wallet" → 点击连接 → 显示 "Sign In" → 点击签名 → 成功登录
2. ✅ 已登录用户访问 /auth/connect → 瞬间跳转 /dashboard（不显示页面）
3. ✅ 钱包已连接但未登录 → **显示 "Sign In" 按钮**（不自动弹签名窗）
4. ✅ 用户点击 Sign In 后取消签名 → 回到 "Sign In" 按钮 + 错误提示
5. ✅ 用户点击 Sign In 但网络不对 → 显示网络错误 + 保持 "Sign In" 按钮
6. ✅ 用户 Logout → 清除所有缓存 → 重新水合 → 显示 "Connect Wallet"

### 💡 设计原则总结

1. **No Auto-Login** - 用户必须主动点击才登录
2. **Two Final States** - 未认证（显示 UI）或已认证（跳转）
3. **Loading Only on Action** - Loading 仅在用户操作时出现
4. **Wait for Hydration** - UI 等待 authStore 水合完成
5. **Session Health Check** - 不仅检查 `isConnected`，还检查 `address` 和 `walletProvider`

---

## [2025-01-15] - ~~修复自动登录卡死问题~~ 🔴 已废弃（被上方重构替代）

### 🔧 问题修复 - 防止 SIWE 自动登录无限加载

**问题描述**:
用户报告打开 `/auth/connect` 页面时卡在 "Signing in with wallet..." 状态无法继续：
1. AppKit 从缓存恢复了钱包连接状态（`isConnected = true`）
2. 但 Auth Store 没有认证缓存（JWT 已过期或被清除）
3. 自动登录触发后，在 `signer.signMessage()` 步骤卡住
4. 如果用户未响应 MetaMask 签名弹窗，Promise 会永久挂起
5. UI 永久显示 Loading 状态，用户无法继续操作

**根本原因**:
- `useSiweAuth.ts` 的 `login()` 函数在等待用户签名时没有超时机制
- 如果用户不响应钱包弹窗，`await signer.signMessage()` 会永久等待
- `isSiweLoading` 状态无法重置，导致 UI 卡在 Loading 状态

**修复方案**:

### 1. ✅ 为自动登录添加 30 秒超时机制

在 `apps/web/src/app/auth/connect/page.tsx` 的自动登录逻辑中添加超时保护：

```typescript
// 添加 30 秒超时，防止无限等待
const loginPromise = login()
const timeoutPromise = new Promise<boolean>((resolve) => {
  setTimeout(() => {
    console.warn('[ConnectPage] Auto SIWE login timeout after 30s')
    resolve(false)
  }, 30000)
})

const success = await Promise.race([loginPromise, timeoutPromise])
```

### 2. ✅ 改进日志输出

在 `useSiweAuth.ts` 中添加更详细的日志，帮助诊断用户在哪个步骤卡住：

```typescript
console.log('[useSiweAuth] Requesting signature from wallet...')
// Sign message (this may hang if user doesn't respond to wallet popup)
const signature = await signer.signMessage(siweMessage)
```

**用户体验改善**:
- ✅ 自动登录最多等待 30 秒，超时后显示手动 "Sign In" 按钮
- ✅ 用户可以选择手动重试，不会永久卡死
- ✅ 更清晰的日志帮助调试问题

**相关文件**:
```
apps/web/src/app/auth/connect/page.tsx   # 添加 Promise.race 超时机制
apps/web/src/hooks/useSiweAuth.ts         # 改进日志输出
```

**测试场景**:
1. ✅ 钱包已连接 + 无认证缓存 → 自动登录弹窗 → 用户确认签名 → 成功登录
2. ✅ 钱包已连接 + 无认证缓存 → 自动登录弹窗 → 用户忽略/关闭弹窗 → 30秒后显示手动按钮
3. ✅ 钱包已连接 + 无认证缓存 → 自动登录弹窗 → 用户取消签名 → 立即显示手动按钮

**下一步优化建议**:
- 考虑缩短超时时间为 15-20 秒（用户体验更好）
- 添加取消按钮让用户主动停止等待
- 同步清除 AppKit 和 Auth Store 的缓存，避免状态不一致

---

## [2025-01-15] - 认证与路由保护优化 ✅ 完成

### 🔐 Security & UX - 客户端受保护路由 + 自动登录流程优化

**背景**: 原有认证流程存在安全隐患和用户体验问题：
1. Dashboard 等页面没有真正的路由保护，未登录用户可直接访问
2. /auth/connect 页面在已连接钱包时体验不佳，未自动尝试登录
3. 已登录用户访问 /auth/connect 时未立即重定向

**完成内容**:

### 1. ✅ 新增 `useRequireAuth` Hook - 统一路由保护

创建了通用的客户端路由守卫 Hook：

**功能**:
- 自动从 localStorage 加载认证状态
- 未登录时自动重定向到 `/auth/connect`
- 返回 `isChecking` 状态用于显示 Loading

**使用方式**:
```tsx
'use client'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export default function ProtectedPage() {
  const { isChecking } = useRequireAuth()

  if (isChecking) {
    return <LoadingScreen />
  }

  return <YourContent />
}
```

### 2. ✅ Dashboard 页面添加路由保护

**变更**:
- 使用 `useRequireAuth()` 保护 Dashboard 页面
- 未登录用户访问时自动重定向到 `/auth/connect`
- 添加 Loading 状态避免闪烁
- 显示真实的用户钱包地址（从 useCurrentUser 获取）

**用户体验**:
- 未登录访问 `/dashboard` → 自动跳转到 `/auth/connect`
- 已登录访问 `/dashboard` → 正常显示内容

### 3. ✅ /auth/connect 页面自动登录优化

**新增逻辑**:
- 添加 `hasTriedAutoLogin` 状态标志，确保只尝试一次自动登录
- 进入页面时，如果钱包已连接但未认证，自动尝试 SIWE 登录
- 自动登录流程：检测网络 → SIWE 签名 → 成功跳转 Dashboard / 失败显示手动按钮

**UI 状态优化**:
```tsx
{isAuthenticated && user ? (
  // ✅ 已认证：几乎瞬间跳转 Dashboard（很少看到）
  <SignedInBlock />
) : isSiweLoading || (isConnected && !isAuthenticated && !hasTriedAutoLogin) ? (
  // ✅ 自动登录或手动登录进行中：显示 Loading
  <LoadingSigningInBlock />
) : isConnected && !isAuthenticated && hasTriedAutoLogin ? (
  // ✅ 连接钱包但自动登录失败：显示手动 Sign In 按钮
  <ConnectedButNotSignedInBlock />
) : (
  // ✅ 未连接：显示 Connect Wallet 按钮
  <ConnectWalletButton />
)}
```

**用户体验流程**:
1. **已登录 + 访问 /auth/connect**: 瞬间跳转 Dashboard，不显示连接页面
2. **未登录 + 钱包已连接**: 自动尝试 SIWE 登录 → 显示 Loading → 成功跳转 / 失败显示按钮
3. **未登录 + 未连接**: 显示 Connect Wallet 按钮
4. **点击 Connect Wallet**: 连接成功后自动检查网络并触发 SIWE 登录

**相关文件**:
```
apps/web/src/hooks/useRequireAuth.ts          # 新建 - 路由保护 Hook
apps/web/src/app/dashboard/page.tsx           # 添加路由保护
apps/web/src/app/auth/connect/page.tsx        # 自动登录逻辑优化
```

**技术细节**:
- 使用两个独立的 useEffect 处理自动登录逻辑：
  1. 页面加载时的自动登录（hasTriedAutoLogin 控制）
  2. 用户点击 Connect Wallet 后的自动登录（userInitiatedConnect 控制）
- Loading 状态统一处理：`isSiweLoading || (isConnected && !isAuthenticated && !hasTriedAutoLogin)`
- 网络检测：自动登录前先调用 `checkNetworkSupported()` 避免不必要的钱包弹窗

**安全性提升**:
- ✅ Dashboard 及所有需要登录的页面现在都有客户端路由保护
- ✅ 未登录用户无法访问受保护页面的真实内容
- ✅ 认证状态统一从 useAuthStore 管理，避免不一致

**注意事项**:
- 后续添加新的受保护页面（如 `/products`, `/my-policies`）时，需要添加 `useRequireAuth()` Hook
- 自动登录仅在页面首次加载时尝试一次，避免死循环
- 如果用户拒绝签名，会回退到手动 Sign In 按钮状态

**下一步建议**:
- 为其他页面（Products, My Policies 等）添加路由保护
- 考虑添加 Server-Side 路由保护（Next.js middleware）
- 实现 Token 过期自动刷新机制

---

## [2025-01-15] - 项目架构转型：Mobile → Web 文档更新 ✅ 完成

### 📚 Documentation - 项目架构变更文档同步

**背景**: 项目从 Mobile (React Native) 转向 Web (Next.js 14)，需要在所有重要文档中体现这一变化。

**完成内容**:
1. ✅ 更新 `docs/project_state.md`:
   - 版本升级至 v0.2.0
   - Epic 3 (Mobile DApp) 标记为 🔴 废弃
   - 创建 Epic 4 (Web DApp)，包含 5 个 Issues
   - 更新项目总览表格与进度统计
   - 添加架构变更警告

2. ✅ 更新 `README.md`:
   - 在顶部添加架构变更警告框
   - 系统架构图：Mobile DApp → Web DApp (Next.js 14)
   - 技术栈表：更新前端技术从 React Native 到 Next.js 14 + Reown AppKit
   - Monorepo 结构：标记 `apps/mobile/` 为已废弃
   - 开发指南：移除 Mobile 启动命令，添加 Web 启动命令

3. ✅ 创建 `apps/web/README.md`:
   - 完整的 Web DApp 文档
   - 环境变量配置说明
   - 项目结构说明
   - 开发指南与调试技巧
   - 安全最佳实践
   - API 集成示例
   - 常见问题解答

4. ✅ 更新 `apps/mobile/README.md`:
   - 添加醒目的 DEPRECATED 警告
   - 说明废弃原因与替代方案
   - 指向 `apps/web/` 的链接

5. ✅ 更新 `CLAUDE.md`:
   - 修改示例从 Mobile (React Native) 到 Web (Next.js)

**相关文件**:
```
docs/project_state.md          # 项目状态追踪 - 添加 Epic 4 Web DApp
README.md                      # 主 README - 架构图、技术栈更新
apps/web/README.md             # 新建 - Web DApp 完整文档
apps/mobile/README.md          # 添加废弃警告
CLAUDE.md                      # 更新示例代码
```

**架构变更概要**:
- **原架构**: Mobile (React Native + Expo) + Admin (Next.js) + API (NestJS)
- **新架构**: Web (Next.js 14) + Admin (Next.js) + API (NestJS)
- **变更原因**:
  1. Web 端更易于开发和部署
  2. 用户可直接通过浏览器访问，无需下载 APP
  3. 钱包集成在 Web 端更成熟（Reown AppKit React）

**Web DApp 已完成功能** (详见 apps/web/README.md):
- ✅ Next.js 14 (App Router) + TypeScript 项目结构
- ✅ Reown AppKit React 钱包连接集成
- ✅ SIWE 完整登录流程
- ✅ 智能路由与认证守卫
- ✅ Logout 功能（清除 localStorage + WalletConnect 缓存）
- ✅ 响应式 UI 设计

**下一步** (Epic 4 剩余任务):
- ⚪ Issue #34: 实现产品列表页 (`/products`)
- ⚪ Issue #35: 实现保单购买流程 (`/policy/create`)
- ⚪ Issue #36: 实现保单详情页与倒计时 (`/policy/:id`)

**注意事项**:
- Mobile 端代码保留在 `apps/mobile/` 作为参考，但不再维护
- Web 端已成功迁移 SIWE 登录、钱包连接、登出等核心功能
- 后续功能开发全部基于 Web 端（Next.js 14）

---

## [2025-01-15] - Mobile SIWE 登录流程修复 - 适配后端契约 ✅ 完成

### ✅ Fixed - 移动端 SIWE 接口适配后端契约

**功能**: 修复移动端 SIWE (Sign-In with Ethereum) 登录流程，使其完全适配后端 API 契约

**问题描述**:
- 原移动端 SIWE 客户端与后端接口契约不匹配，导致登录失败
- `getNonce()` 误用 GET 请求，期望后端返回 domain/uri/chainId
- `verifySignature()` 期望返回 accessToken 和完整 user 对象
- 缺少调用 `/auth/siwe/me` 获取用户信息的步骤

**实现细节**:
- **修改 `getNonce()` 方法**: 改为 POST /auth/siwe/nonce，发送 `{ walletAddress }`，返回 `{ nonce }`
- **SIWE 消息格式化**: domain/uri/chainId 从环境变量读取（不依赖后端返回）
  - `EXPO_PUBLIC_SIWE_DOMAIN` (默认 'localhost')
  - `EXPO_PUBLIC_SIWE_URI` (默认 API_BASE)
  - `EXPO_PUBLIC_CHAIN_ID` (默认 97)
- **修改 `verifySignature()` 方法**: 适配后端返回 `{ token, address }`
- **新增 `getMe()` 方法**: 使用 token 调用 GET /auth/siwe/me，获取 `{ userId, address }`
- **完整登录流程**:
  1. 连接钱包获取 address
  2. POST /auth/siwe/nonce 获取 nonce
  3. 使用环境变量 + nonce 格式化 SIWE 消息
  4. 用户签名
  5. POST /auth/siwe/verify 验证签名，获取 token
  6. GET /auth/siwe/me 获取用户信息
  7. 构造 User 对象并存储到 Zustand + SecureStore

**相关文件**:
```
apps/mobile/src/features/auth/siweLogin.ts        # 修复 SIWE 登录逻辑
apps/mobile/.env.example                          # 添加 SIWE 环境变量说明
apps/mobile/README.md                             # 更新环境变量文档
```

**环境变量**:
```env
# API Configuration
EXPO_PUBLIC_API_BASE=http://localhost:3001

# SIWE (Sign-In with Ethereum) Configuration
EXPO_PUBLIC_SIWE_DOMAIN=localhost
EXPO_PUBLIC_SIWE_URI=http://localhost:3001

# Blockchain Configuration
EXPO_PUBLIC_CHAIN_ID=97  # BSC Testnet (56 for Mainnet)
```

**后端契约（已对齐）**:
- POST /auth/siwe/nonce, Body: `{ walletAddress }`, 返回: `{ nonce }`
- POST /auth/siwe/verify, Body: `{ message, signature }`, 返回: `{ token, address }`
- GET /auth/siwe/me, Headers: `Authorization: Bearer <token>`, 返回: `{ userId, address }`

**测试方法**:
```bash
# 1. 启动后端
pnpm --filter api dev

# 2. 配置移动端环境变量
cd apps/mobile
cp .env.example .env
# 根据实际情况修改 .env 中的 SIWE_DOMAIN 和 SIWE_URI

# 3. 启动移动端
pnpm --filter mobile dev

# 4. 使用 AppKit 连接钱包，观察完整登录流程
```

**注意事项**:
- 不修改后端实现，仅调整移动端以适配现有后端契约
- 所有 SIWE 配置通过环境变量管理，避免硬编码
- 保留完整的错误处理和用户友好提示（LoginErrorType）
- User 对象的 createdAt/updatedAt 由前端生成（后端 /me 不返回时间戳）

---

## [2025-10-30] - Epic 6 Web Admin 后台管理系统完整实现 ✅ 完成

### ✅ Added - 完整的 Admin Dashboard（Next.js 14）

**功能**: 实现可上线演示的 Web Admin 后台管理系统，支持保单管理和审核流程

**实现细节**:
- **技术栈**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **认证系统**: 轻量级 Email/Password 登录（localStorage 存储，demo 模式）
- **仪表盘**: 实时统计卡片（总保单数、待审核数、今日通过/拒绝数）
- **保单列表**: 完整的搜索、筛选、分页功能（支持按状态/ID/钱包/邮箱查询）
- **审核队列**: 专门的待审核保单页面，支持快捷审核
- **保单详情**: Tabs 展示（Overview/Payments/Timeline），包含完整的 Policy 信息
- **审核流程**: 对话框式审核（Approve/Reject + 备注），状态自动流转
- **Mock API**: 使用 Next.js API Routes 实现本地 Mock（60 条随机测试数据）
- **状态管理**: @tanstack/react-query 实现请求缓存和自动刷新
- **UI 组件**: shadcn/ui（Button, Card, Table, Dialog, Badge, Tabs, Select, Toast 等）

**技术亮点**:
- 完整的 Loading/Empty State 处理
- Toast 通知反馈
- 响应式设计（移动端友好）
- 类型安全（Zod Schema + TypeScript）
- 可切换 Mock/真实 API（通过环境变量）

**相关文件**:
```
apps/admin/
├── app/
│   ├── (auth)/login/page.tsx                    # 登录页
│   ├── (dashboard)/
│   │   ├── layout.tsx                           # Dashboard 布局 + 导航
│   │   ├── dashboard/page.tsx                   # 仪表盘（统计卡片）
│   │   ├── policies/page.tsx                    # 保单列表（筛选+分页）
│   │   ├── policies/[id]/page.tsx               # 保单详情（Tabs）
│   │   └── review/page.tsx                      # 审核队列
│   ├── api/admin/                               # Mock API Routes
│   │   ├── policies/route.ts                    # GET 保单列表
│   │   ├── policies/[id]/route.ts               # GET/PATCH 单个保单
│   │   └── stats/route.ts                       # GET 统计数据
│   ├── globals.css                              # Tailwind 样式
│   └── layout.tsx                               # 根布局
├── components/ui/                               # shadcn/ui 组件库
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── select.tsx
│   ├── badge.tsx
│   ├── toast.tsx
│   └── ...
├── features/policies/
│   ├── components/
│   │   ├── ApproveRejectDialog.tsx              # 审核对话框
│   │   ├── PolicyFilters.tsx                    # 筛选器组件
│   │   ├── PolicyStatusBadge.tsx                # 状态徽章
│   │   ├── PolicyTable.tsx                      # 保单表格
│   │   └── PolicyTimeline.tsx                   # 时间线组件
│   ├── hooks/
│   │   ├── usePolicies.ts                       # 保单列表 Query
│   │   ├── usePolicyDetail.ts                   # 保单详情 Query
│   │   └── useStats.ts                          # 统计数据 Query
│   └── schemas.ts                               # Zod 数据模型
├── lib/
│   ├── apiClient.ts                             # API 请求封装
│   ├── auth.ts                                  # 认证工具函数
│   ├── constants.ts                             # 常量定义
│   ├── queryClient.ts                           # React Query 配置
│   └── utils.ts                                 # 工具函数
├── mocks/
│   └── seed.ts                                  # Mock 数据生成器
├── package.json                                 # 依赖配置
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.example                                 # 环境变量模板
├── .gitignore
└── README.md                                    # 完整使用文档
```

**环境变量**:
```env
# Mock 模式（默认）
NEXT_PUBLIC_ADMIN_API_BASE=
NEXT_PUBLIC_USE_MOCK=true

# 真实后端模式
NEXT_PUBLIC_ADMIN_API_BASE=https://api.cohe.capital
NEXT_PUBLIC_USE_MOCK=false
```

**API 契约（与后端对齐）**:
- `GET /admin/policies?status=&q=&page=&limit=` → `{ items, total, page, limit }`
- `GET /admin/policies/:id` → `Policy`
- `PATCH /admin/policies/:id` → `{ status, reviewerNote }` (审核接口)
- `GET /admin/stats` → `{ total, underReview, approvedToday, rejectedToday }`

**测试方法**:
```bash
# 安装依赖
cd apps/admin
pnpm install

# 启动开发服务器（端口 3002）
pnpm dev

# 访问 http://localhost:3002

# 登录凭据（demo）
Email: admin@cohe.capital
Password: admin123

# 构建生产版本
pnpm build
pnpm start
```

**功能验收**:
- ✅ 登录页面可正常登录/登出
- ✅ Dashboard 显示实时统计数据
- ✅ 保单列表支持搜索（ID/钱包/邮箱）、筛选（按状态）、分页
- ✅ 点击保单可查看详情（Overview/Payments/Timeline）
- ✅ 审核队列默认筛选 `under_review` 状态
- ✅ 审核对话框支持 Approve/Reject + 备注
- ✅ 审核后自动刷新列表和详情，Toast 提示成功
- ✅ 审核通过后自动设置 `startAt`/`endAt`（基于 termDays）
- ✅ 所有页面有 Loading/Empty State
- ✅ 无 TypeScript 编译错误

**注意事项**:
- 🔒 **安全性**: 当前使用 localStorage 存储 token，仅适用于 demo。生产环境需实现真实 JWT 认证
- 💾 **数据持久化**: Mock 数据存储在内存中，服务器重启后重置。真实环境需连接数据库
- 📁 **文件上传**: 合同/附件当前为 Mock URL，需实现真实文件存储（S3/OSS）
- 🔄 **切换后端**: 修改 `.env.local` 中的 `NEXT_PUBLIC_ADMIN_API_BASE` 即可切换为真实 API
- 📊 **图表功能**: Dashboard 暂未实现趋势图（可使用 Recharts/ECharts 扩展）

**待优化（TODO）**:
- [ ] Dark Mode 切换
- [ ] 导出 CSV 功能
- [ ] 批量审核操作
- [ ] 高级筛选（日期范围、金额范围）
- [ ] 邮件通知集成
- [ ] 审核操作审计日志
- [ ] 实时更新（WebSocket）

**Epic 6 已全部完成** ✨ - Web Admin 后台已可演示，支持完整的保单管理和审核流程

---

## [2025-10-30] - Epic 3 SIWE (Sign-In with Ethereum) 完整实现 ✅ 完成

### ✅ Added - 完整的 SIWE 钱包登录流程

**功能**: 实现从钱包连接到 JWT 认证的完整 SIWE 登录流程

**实现细节**:
- **SIWE 消息格式化**: 实现 EIP-4361 标准的消息格式化工具
- **认证状态管理**: 使用 Zustand 实现全局认证状态，配合 expo-secure-store 安全存储 JWT
- **登录主流程**: 完整的 5 步登录流程（连接钱包 → 获取 nonce → 格式化消息 → 签名 → 验证）
- **UI 集成**: ConnectScreen 支持多种状态展示（未连接、连接中、签名中、已认证）
- **错误处理**: 覆盖所有失败场景，包括用户拒绝、网络错误、验证失败等
- **持久化**: JWT 和用户信息安全存储，支持自动登录

**技术栈**:
- `@reown/appkit-react-native`: WalletConnect v2 官方 SDK
- `@reown/appkit-ethers-react-native`: Ethers.js 适配器
- `zustand`: 状态管理
- `expo-secure-store`: 安全存储 JWT
- `viem`: 链配置

**相关文件**:
```
apps/mobile/src/lib/siweUtil.ts (SIWE 消息格式化工具)
apps/mobile/src/store/authStore.ts (认证状态管理)
apps/mobile/src/features/auth/siweLogin.ts (登录主流程)
apps/mobile/src/screens/auth/ConnectScreen.tsx (UI 集成)
apps/mobile/docs/SIWE_TESTING_GUIDE.md (测试指南)
```

**API 端点**:
- `GET /auth/siwe/nonce`: 获取登录 nonce
- `POST /auth/siwe/verify`: 验证签名并返回 JWT

**测试方法**:
```bash
# 启动后端
pnpm --filter api dev

# 启动移动应用
pnpm --filter mobile start -- --clear

# 测试登录流程
1. 点击 "Connect Wallet" 按钮
2. 选择钱包并连接
3. 在钱包中签名消息
4. 验证成功后自动跳转到产品页面
```

**错误类型处理**:
- `WALLET_NOT_CONNECTED`: 钱包未连接
- `NONCE_FETCH_FAILED`: 获取 nonce 失败
- `USER_REJECTED`: 用户拒绝签名
- `SIGNATURE_FAILED`: 签名失败
- `VERIFICATION_FAILED`: 验证失败
- `NETWORK_ERROR`: 网络错误

**注意事项**:
- 需要安装 MetaMask 或 Trust Wallet 等支持 WalletConnect 的钱包
- 使用 BSC Testnet (chainId: 97) 进行测试
- PROJECT_ID: e1d4344896342c6efb5aab6396d3ae24
- pulse.walletconnect.org 的 400 错误为遥测服务，不影响核心功能
- JWT 存储在 SecureStore 中，应用重启后自动恢复认证状态

---

## [2025-10-29] - Epic 3 修复 SafeAreaView Deprecation 警告 ✅ 完成

### ✅ Fixed - 迁移到 react-native-safe-area-context

**功能**: 修复 React Native deprecated SafeAreaView 警告

**实现细节**:
- **问题**: React Native 核心库的 SafeAreaView 已被标记为 deprecated
  ```
  SafeAreaView has been deprecated and will be removed in a future release.
  Please use 'react-native-safe-area-context' instead.
  ```

- **解决方案**:
  - ✅ 将 ConnectScreen.tsx 的 SafeAreaView import 从 `react-native` 迁移到 `react-native-safe-area-context`
  - ✅ 在 RootNavigator.tsx 添加 `SafeAreaProvider` 包裹整个导航容器
  - ✅ 确保所有 SafeAreaView 使用官方推荐的库（已预装版本 5.6.1）

**相关文件**:
```
apps/mobile/src/screens/auth/ConnectScreen.tsx (更新 import)
apps/mobile/src/navigation/RootNavigator.tsx (添加 SafeAreaProvider)
```

**测试结果**:
- ✅ 警告消失
- ✅ 应用正常运行
- ✅ SafeAreaView 功能保持一致

**注意事项**:
- `react-native-safe-area-context` 版本 5.6.1 已安装
- SafeAreaProvider 必须包裹 NavigationContainer
- 其他 screen 如使用 SafeAreaView，也需要迁移

---

## [2025-10-29] - Epic 3 ConnectScreen 重新设计 ✅ 完成

### ✅ Updated - 欢迎页面 UI 重构（ConnectScreen）

**功能**: 重新设计移动端欢迎页面，完全匹配设计稿 `docs/designs/欢迎页面.png`

**实现细节**:
- **UI 组件完全重写**:
  - ✅ 头部区域：Logo（cohe-capitl-app-logo.png）+ Contact us 按钮
  - ✅ Hero 区域：中心盾牌图标（welcome-logo.png）响应式布局
  - ✅ 标题区域："THE **FIRST** CRYPTO INSURANCE ALTERNATIVE"（FIRST 高亮金色）
  - ✅ 副标题："COVERING CRYPTO SINCE 2025"
  - ✅ 底部 Connect Wallet 按钮（金色高亮 + 阴影效果）

- **技术实现**:
  - ✅ 使用原生 React Native 组件（SafeAreaView, StatusBar, TouchableOpacity）
  - ✅ 移除 React Native Paper 依赖（此页面使用纯原生组件）
  - ✅ 响应式图片尺寸（使用 Dimensions API，适配不同屏幕）
  - ✅ 精确还原设计稿颜色：#0F111A（背景）、#FFD54F（金色）、#FFFFFF（标题）、#9CA3AF（副标题）
  - ✅ 静态 UI 实现（钱包连接逻辑保留 TODO，暂时导航到 Products 页面）

- **目录结构优化**:
  - ✅ screens/ 按功能分类为 auth/, policy/, payment/ 三个子目录
  - ✅ 批量修复所有 screen 文件的 import 路径（从 `../` 改为 `../../`）
  - ✅ RootNavigator.tsx 更新所有 screen import 路径

**相关文件**:
```
apps/mobile/src/screens/auth/ConnectScreen.tsx (完全重写)
apps/mobile/src/navigation/RootNavigator.tsx (更新 import 路径)
apps/mobile/src/screens/policy/*.tsx (修复 import 路径)
apps/mobile/src/screens/payment/*.tsx (修复 import 路径)
apps/mobile/assets/cohe-capitl-app-logo.png (已验证存在)
apps/mobile/assets/welcome-logo.png (已验证存在)
```

**测试方法**:
```bash
# 启动开发服务器
pnpm --filter mobile dev

# 访问 http://localhost:8081
# 在 Expo Go 或 Web 浏览器中查看欢迎页面
```

**注意事项**:
- ⚠️ ConnectScreen 当前为静态 UI，钱包连接功能待 Issue #12 实现
- ⚠️ Contact us 按钮当前仅 console.log，实际功能待后续实现
- ⚠️ 临时行为：点击 Connect Wallet → 导航到 Products 页面（用于测试）
- ✅ UI 完全还原设计稿要求
- ✅ 移动端适配完成（使用 Dimensions API 实现响应式）

---

## [Unreleased]

### 待开发功能
- Admin 审核前端（Epic 6 - Issue #25-31）⭐ 新增
- 移动端 DApp UI（Epic 3 - Issue #12-16）
- 前后端联调与测试（Epic 4 - Issue #17-20）
- 部署与演示环境（Epic 5 - Issue #21-24）

### 📋 规划变更
- **2025-10-27**: 新增 Epic 6 - Admin 审核前端（Web Admin Panel），包含 7 个 Issue (#25-31)

---

## [2025-10-27] - Epic 3 移动端项目初始化 ✅ 完成

### ✅ Added - React Native (Expo) 项目初始化 (Issue #11)

**功能**: 初始化 Expo React Native 移动端应用基础架构

**实现细节**:
- **项目结构**:
  - ✅ Expo TypeScript 项目（blank-typescript 模板）
  - ✅ 完整的 src/ 目录结构（components, screens, navigation, hooks, services, store, utils, types）
  - ✅ pnpm workspace 集成（@cohe-capital/mobile）

- **依赖包安装**:
  - ✅ **导航**: @react-navigation/native, @react-navigation/native-stack, react-native-screens, react-native-safe-area-context
  - ✅ **状态管理**: zustand
  - ✅ **数据请求**: @tanstack/react-query, axios
  - ✅ **表单**: react-hook-form, zod, @hookform/resolvers
  - ✅ **UI 组件**: react-native-paper
  - ✅ **工具库**: dayjs, expo-constants, dotenv

- **环境变量配置**:
  - ✅ `.env.example` 示例文件（EXPO_PUBLIC_API_BASE, EXPO_PUBLIC_CHAIN_ID）
  - ✅ `app.config.ts` 动态读取环境变量
  - ✅ `src/utils/config.ts` 配置工具函数

- **TypeScript 配置**:
  - ✅ `tsconfig.json` 严格模式 + 路径别名（@/* → src/*）
  - ✅ `src/types/env.d.ts` 环境变量类型定义

**相关文件**:
```
apps/mobile/
├── package.json           (新增 - pnpm workspace 配置)
├── app.json               (新增 - Expo 基础配置)
├── app.config.ts          (新增 - 动态环境变量配置)
├── App.tsx                (新增 - 根组件)
├── tsconfig.json          (新增 - TypeScript 配置)
├── babel.config.js        (新增 - Babel 配置)
├── .env.example           (新增 - 环境变量示例)
├── .gitignore             (新增)
├── README.md              (新增 - 项目文档)
└── src/
    ├── components/        (新增 - 可复用组件目录)
    ├── screens/           (新增 - 页面组件目录)
    ├── navigation/        (新增 - 导航配置目录)
    ├── hooks/             (新增 - 自定义 Hook 目录)
    ├── services/          (新增 - API 服务层目录)
    ├── store/             (新增 - Zustand 状态管理目录)
    ├── types/             (新增 - TypeScript 类型定义目录)
    │   └── env.d.ts       (新增 - 环境变量类型)
    └── utils/             (新增 - 工具函数目录)
        └── config.ts      (新增 - 配置读取工具)
```

**环境变量**:
```bash
# .env.example
EXPO_PUBLIC_API_BASE=http://localhost:3001
EXPO_PUBLIC_CHAIN_ID=97  # BSC Testnet
```

**测试命令**:
```bash
# 使用 pnpm workspace 启动
pnpm --filter mobile dev

# 或直接在 apps/mobile 目录下
npm run dev

# 其他平台
pnpm --filter mobile android  # Android 模拟器
pnpm --filter mobile ios      # iOS 模拟器
pnpm --filter mobile web      # Web 浏览器
```

**验证结果**:
- ✅ `pnpm --filter mobile dev` 成功执行并显示 Expo help
- ✅ TypeScript 配置正确
- ✅ src/ 目录结构完整（8 个子目录）
- ✅ 所有依赖包安装成功（1311 个包已解析）
- ✅ pnpm workspace 正确识别 @cohe-capital/mobile 包

**注意事项**:
- 项目使用 Expo 52.x + React Native 0.76.6
- 环境变量必须以 `EXPO_PUBLIC_` 前缀才能在运行时访问
- 使用 `expo-constants` 读取配置，不使用 react-native-dotenv
- 首次运行需要扫描 QR 码或使用模拟器

**下一步 (Epic 3 Issue #12)**:
- [ ] 集成 WalletConnect / MetaMask 登录
- [ ] 创建登录页面 UI
- [ ] 实现钱包连接逻辑

---

## [2025-10-27] - Epic 2 保单倒计时接口 ✅ 完成

### ✅ Added - 保单倒计时接口 (Policy Countdown)

**功能**: GET /policy/:id/countdown - 保单倒计时查询接口

**实现细节**:
- **业务规则**:
  - ✅ 如果 status !== 'active'：返回当前状态，secondsRemaining=0
  - ✅ 如果 status === 'active'：
    - 计算 secondsRemaining = max(0, endAt - now（秒）)
    - 计算 daysRemaining = floor(secondsRemaining / 86400)
    - 如果 now >= endAt：返回 status='expired', secondsRemaining=0
  - ✅ 不持久化 'expired' 状态到数据库（注释说明原因）

- **计算逻辑**:
  - 使用服务器当前时间（Date.now()）
  - 毫秒级精度转换为秒
  - 向下取整计算天数

- **响应格式**:
  ```json
  {
    "policyId": "uuid",
    "status": "active|expired|under_review|pending|rejected",
    "now": "2025-10-27T00:00:00.000Z",
    "startAt": "2025-10-27T00:00:00.000Z",  // 可选
    "endAt": "2026-01-25T00:00:00.000Z",    // 可选
    "secondsRemaining": 7776000,
    "daysRemaining": 90
  }
  ```

**为什么不持久化 expired 状态**（详见代码注释）:
1. 过期状态是时间相关的，可以实时计算
2. 避免每次请求都进行数据库写操作
3. 防止并发请求的竞争条件
4. 如需持久化，建议使用独立的批处理任务

**相关文件**:
```
apps/api/src/modules/policy/
├── policy.controller.ts           # 新增 GET /policy/:id/countdown 端点
├── policy.service.ts              # 新增 getCountdown() 方法
└── dto/
    └── countdown-response.dto.ts  # 倒计时响应 DTO
```

**API 示例**:
```bash
# Active policy (还有90天)
GET /policy/{policyId}/countdown
Response: {
  "policyId": "uuid",
  "status": "active",
  "now": "2025-10-27T00:00:00.000Z",
  "startAt": "2025-10-27T00:00:00.000Z",
  "endAt": "2026-01-25T00:00:00.000Z",
  "secondsRemaining": 7776000,
  "daysRemaining": 90
}

# Expired policy (已过期)
GET /policy/{policyId}/countdown
Response: {
  "policyId": "uuid",
  "status": "expired",
  "now": "2026-02-01T00:00:00.000Z",
  "startAt": "2025-10-27T00:00:00.000Z",
  "endAt": "2026-01-25T00:00:00.000Z",
  "secondsRemaining": 0,
  "daysRemaining": 0
}

# Non-active policy (待审核)
GET /policy/{policyId}/countdown
Response: {
  "policyId": "uuid",
  "status": "under_review",
  "now": "2025-10-27T00:00:00.000Z",
  "secondsRemaining": 0,
  "daysRemaining": 0
}
```

**错误处理**:
- ✅ 400 - Invalid UUID format
- ✅ 404 - Policy not found
- ✅ Zod 验证错误

**测试验证**:
```bash
# 测试不存在的保单 (404)
curl http://localhost:3001/policy/550e8400-e29b-41d4-a716-446655440000/countdown
# 返回: {"message":"Policy with ID ... not found","error":"Not Found","statusCode":404}

# 测试无效UUID (400)
curl http://localhost:3001/policy/invalid-uuid/countdown
# 返回: {"message":"Invalid policy ID format",...}
```

**Swagger 文档**: http://localhost:3001/api#/Policy

---

## [2025-10-27] - Epic 2 Admin 审核接口 ✅ 完成

### ✅ Added - Admin 审核模块 (Admin Module)

**功能**: Admin 保单审核接口，支持列表查询与批准/拒绝操作

**实现细节**:
- **GET /admin/policies** - 保单列表接口
  - ✅ 分页支持（page, pageSize，默认 20 条/页）
  - ✅ 状态过滤（status: pending/under_review/active/rejected/expired）
  - ✅ 按创建时间倒序排序
  - ✅ 返回总数、分页元数据和保单列表

- **PATCH /admin/policies/:id** - 保单审核接口
  - ✅ 支持两种操作：approve（批准）和 reject（拒绝）
  - ✅ 批准逻辑：
    - 设置 status = 'active'
    - 计算 startAt = now()
    - 计算 endAt = startAt + SKU.termDays（默认 90 天）
    - 返回激活后的保单信息（包含 startAt 和 endAt）
  - ✅ 拒绝逻辑：
    - 设置 status = 'rejected'
    - 不设置承保时间
  - ✅ 业务规则验证：
    - 只能审核 status='under_review' 的保单
    - 保单不存在返回 404
    - 状态错误返回 400（INVALID_STATUS）

- **数据库更新**:
  - ✅ Policy 模型新增 startAt 和 endAt 字段（DateTime?）
  - ✅ 创建迁移 20251027032700_add_policy_start_end_dates

**相关文件**:
```
apps/api/src/modules/admin/
├── admin.module.ts              # Admin 模块定义
├── admin.controller.ts          # 控制器（GET /admin/policies, PATCH /admin/policies/:id）
├── admin.service.ts             # 业务逻辑（列表查询、审核操作）
└── dto/
    ├── list-admin-policies.query.ts        # 查询参数 DTO
    ├── review-policy.dto.ts                # 审核请求 DTO
    ├── admin-policy-list-response.dto.ts   # 列表响应 DTO
    └── review-policy-response.dto.ts       # 审核响应 DTO

apps/api/prisma/
├── schema.prisma                # 更新 Policy 模型（添加 startAt/endAt）
└── migrations/
    └── 20251027032700_add_policy_start_end_dates/
        └── migration.sql        # 数据库迁移脚本

apps/api/src/app.module.ts       # 注册 AdminModule
```

**API 示例**:
```bash
# 获取待审核保单列表
GET /admin/policies?status=under_review&page=1&pageSize=20
Response: {
  "total": 10,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "uuid",
      "walletAddress": "0x...",
      "skuId": "uuid",
      "premiumAmt": "100.0",
      "status": "under_review",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}

# 批准保单
PATCH /admin/policies/{policyId}
Request: { "action": "approve" }
Response: {
  "id": "uuid",
  "status": "active",
  "startAt": "2025-10-27T00:00:00.000Z",
  "endAt": "2026-01-25T00:00:00.000Z"
}

# 拒绝保单
PATCH /admin/policies/{policyId}
Request: { "action": "reject" }
Response: {
  "id": "uuid",
  "status": "rejected"
}
```

**错误处理**:
- ✅ 400 INVALID_STATUS - 保单状态不是 'under_review'
- ✅ 404 NOT_FOUND - 保单不存在
- ✅ Zod 验证错误 - 请求参数格式错误

**注意事项**:
- termDays 从 SKU 中读取，默认为 90 天
- 批准后保单立即生效（startAt = now()）
- 所有金额使用 Decimal 类型，返回时转为字符串
- 接口已在 Swagger 文档中完整注释

**Swagger 文档**: http://localhost:3001/api#/Admin

---

## [2025-10-26] - 项目文档重组 📚

### ✅ Updated - 项目状态追踪文档重组

**目标**: 对齐 ChatGPT 的 Epic 与 Issue 规划，优化文档结构与可读性

**变更内容**:
- 重新组织 5 个 Epic 结构（原 4 个）：
  - **Epic 1**: 后端基础与认证（NestJS + SIWE）- ✅ 100% 完成
  - **Epic 2**: 保单购买闭环（无合约）- 🟡 66.7% 完成
  - **Epic 3**: 前端 Mobile DApp（React Native）- 🟡 16.7% 完成
  - **Epic 4**: 前后端联调与测试 - ⚪ 0% 完成
  - **Epic 5**: 部署与演示环境（Infra）- ⚪ 0% 完成

- 统一 Issue 编号（#1-24）：
  - Epic 1: Issue #1-4（全部完成）
  - Epic 2: Issue #5-10（4/6 完成）
  - Epic 3: Issue #11-16（1/6 完成）
  - Epic 4: Issue #17-20（0/4 完成）
  - Epic 5: Issue #21-24（0/4 完成）

- 修复 Markdown 表格对齐问题（所有 `|` 符号对齐）

**相关文件**:
```
docs/project_state.md    # 完全重写，新增整体进度总结表
docs/CHANGELOG.md        # 本次更新记录
```

**改进点**:
- ✅ Epic 与 Issue 描述更精确，与 ChatGPT 规划一致
- ✅ 新增"整体进度总结"表格（Epic 数量、Issue 数量、完成率）
- ✅ 修复所有表格 Markdown 格式问题（对齐 `|` 符号）
- ✅ 优化截止日期与状态标识（✅ 🟡 ⚪）
- ✅ 明确下一步任务（Epic 2 的 #9, #10 为优先级）

**注意事项**:
- 所有已完成功能保持不变，仅调整文档结构
- Epic 1 已 100% 完成，可以开始 Epic 2 剩余任务（Admin 审核 + 倒计时）

---

## [2024-10-26] - Epic 1 后端基础设施 ✅ 完成

### ✅ Added - 支付验证模块 (Payment Module)

**功能**: POST /payment/confirm - 链上支付验证与保单状态更新

**实现细节**:
- 使用 ethers v6 连接 BSC RPC 节点
- 获取交易回执并解析 ERC20 Transfer 事件
- 多层验证：
  - ✅ 交易状态成功 (receipt.status === 1)
  - ✅ 代币地址匹配 SKU 配置
  - ✅ 接收方为 treasury 地址
  - ✅ 发送方为保单钱包地址
  - ✅ 转账金额精确匹配保费（Wei 单位）
- Payment 记录 upsert（幂等性保证）
- 更新 Policy.status 为 "under_review"

**相关文件**:
```
apps/api/src/modules/payment/
├── payment.controller.ts      # POST /payment/confirm 端点
├── payment.service.ts         # 业务逻辑与 Prisma 操作
├── blockchain.service.ts      # ethers v6 链上验证
├── payment.module.ts          # 模块定义
└── dto/
    ├── confirm-payment.dto.ts
    └── payment-response.dto.ts

apps/api/prisma/
└── migrations/20251026041226_add_payment_model/
```

**环境变量**:
- `RPC_BSC`: BSC RPC 节点地址
- `TREASURY_ADDRESS`: 收款钱包地址

**测试方法**:
```bash
# 示例请求
POST /payment/confirm
{
  "policyId": "uuid",
  "txHash": "0x..."
}
```

**注意事项**:
- 确保 RPC_BSC 稳定可用（生产环境建议使用付费 RPC）
- txHash 必须是已确认的链上交易
- 金额验证严格，必须精确匹配到 Wei

---

### ✅ Added - 保单模块 (Policy Module)

**功能**:
- POST /policy - 创建保单草稿
- POST /policy/contract-sign - 数字签名合同

**实现细节**:
- 保单创建：
  - 从 JWT 提取用户信息（userId, walletAddress）
  - 从 SKU 复制保费金额
  - 唯一约束：一个钱包 + 一个 SKU = 一个保单
  - 初始状态：pending
- 合同签名：
  - 规范化 JSON (canonical JSON)
  - 计算 SHA256 哈希
  - 存储 contractPayload, contractHash, userSig
  - 更新状态为 under_review

**相关文件**:
```
apps/api/src/modules/policy/
├── policy.controller.ts       # POST /policy, POST /policy/contract-sign
├── policy.service.ts          # 业务逻辑
├── policy.module.ts
└── dto/
    ├── create-policy.dto.ts
    ├── policy-response.dto.ts
    ├── contract-sign.dto.ts
    └── contract-sign-response.dto.ts

apps/api/prisma/
└── migrations/
    ├── 20251026024805_add_policy_model/
    └── 20251026035230_add_contract_hash_and_user_sig_to_policy/
```

**业务流程**:
1. 用户选择 SKU → 创建 pending 保单
2. 构造合同数据 → 钱包签名
3. 提交签名 → 后端验证并存储
4. 状态变更：pending → under_review

---

### ✅ Added - 产品模块 (Products Module)

**功能**: GET /products - 获取所有活跃的保险产品 SKU

**实现细节**:
- 查询 status = "active" 的 SKU
- 返回产品信息：
  - 保费/保额（Decimal → string）
  - 代币信息（chainId, tokenAddress, decimals）
  - 保险期限（termDays）

**相关文件**:
```
apps/api/src/modules/products/
├── products.controller.ts     # GET /products
├── products.service.ts        # Prisma 查询
├── products.module.ts
└── dto/product-response.dto.ts

apps/api/prisma/
└── migrations/20251025033919_add_sku_model/
```

**Prisma Schema**:
```prisma
model SKU {
  id           String   @id @default(uuid())
  name         String
  chainId      Int      // 56 = BSC
  tokenAddress String   // USDT 合约地址
  decimals     Int      @default(18)
  premiumAmt   Decimal  @db.Decimal(38, 18)
  coverageAmt  Decimal  @db.Decimal(38, 18)
  termDays     Int      // 保险期限
  status       String   @default("active")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

### ✅ Added - SIWE 认证系统 (Auth Module)

**功能**:
- POST /auth/siwe/nonce - 生成签名 nonce
- POST /auth/siwe/verify - 验证签名并颁发 JWT
- GET /auth/siwe/me - 获取当前用户信息

**实现细节**:
- 使用 siwe 库验证以太坊签名
- JWT 有效期：15 分钟
- 用户首次登录自动创建 User 记录
- Passport JWT Strategy 保护受限端点

**相关文件**:
```
apps/api/src/modules/auth/
├── auth.controller.ts         # SIWE 端点
├── auth.service.ts            # 签名验证 + JWT 生成
├── jwt.strategy.ts            # Passport JWT 策略
├── jwt.guard.ts               # JWT 授权守卫
├── auth.module.ts
└── dto/
    ├── request-nonce.dto.ts
    ├── nonce-response.dto.ts
    ├── verify-signature.dto.ts
    ├── verify-response.dto.ts
    └── me-response.dto.ts
```

**安全考虑**:
- Nonce 唯一且一次性使用
- 签名消息包含 domain, uri, chainId 防重放
- JWT secret 通过环境变量配置
- 所有需要认证的端点使用 @UseGuards(JwtAuthGuard)

---

### ✅ Added - Swagger API 文档

**功能**: 自动生成的交互式 API 文档

**访问地址**: http://localhost:3001/api

**特性**:
- 完整的端点说明和示例
- Request/Response DTO 自动生成
- JWT Bearer Token 认证配置
- 错误响应文档

**配置文件**: apps/api/src/main.ts

---

### ✅ Added - Prisma 数据库架构

**数据模型**:
- User - 用户（钱包地址 + nonce）
- SKU - 保险产品
- Policy - 保单
- Payment - 支付记录

**迁移历史**:
```
20251024191154_init/                              # 初始化 User
20251024221203_add_nonce_to_user/                 # User.nonce
20251025033919_add_sku_model/                     # SKU 模型
20251026024805_add_policy_model/                  # Policy 模型
20251026035230_add_contract_hash_and_user_sig_to_policy/  # 合同字段
20251026041226_add_payment_model/                 # Payment 模型
```

**关系**:
```
User 1 ──< ∞ Policy
SKU  1 ──< ∞ Policy
Policy 1 ──< ∞ Payment
```

---

### ✅ Added - 项目文档

**新增文档**:
- `apps/api/README.md` - 完整的 API 文档（中英双语）
  - 快速开始指南
  - API 功能模块详解
  - 完整业务流程（时序图）
  - 环境变量配置
  - 故障排查

- `scripts/README.md` - Review Bundle 脚本使用说明
  - 快速开始
  - Bundle 内容说明
  - 验证方法
  - 故障排查

- `CLAUDE.md` - AI 协作指南
  - Prompt 模板
  - 代码风格要求
  - 安全规范
  - 测试要求

---

### ✅ Added - Review Bundle 生成系统

**功能**: 创建可离线审查的代码包

**脚本**:
- `scripts/make_review_bundle.sh` (Linux/macOS)
- `scripts/make_review_bundle.ps1` (Windows)
- `.github/workflows/review-bundle.yml` (GitHub Actions)

**输出**:
- `.review_bundles/cohe-capitl-review-YYYYMMDD-HHMMSS.zip`
- 包含 manifest.json (SHA256 哈希)
- 包含 TREE.txt (目录结构)

**排除项**:
- ❌ node_modules, dist, build
- ❌ .env, *.pem, *.key (密钥)
- ✅ 仅包含源代码和配置

---

## [2024-10-24] - 项目初始化

### ✅ Added - 项目基础架构

**完成内容**:
- ✅ Monorepo 结构 (pnpm workspace)
- ✅ Turborepo 配置
- ✅ NestJS 11 + Fastify
- ✅ PostgreSQL + Prisma ORM
- ✅ TypeScript 严格模式
- ✅ Docker Compose 开发环境

**相关文件**:
```
pnpm-workspace.yaml
turbo.json
apps/api/
  ├── src/
  ├── prisma/
  ├── package.json
  └── tsconfig.json
infra/docker/docker-compose.yml
```

---

## 📊 统计数据

### Epic 1: 后端基础设施 - ✅ 100% 完成

| 功能模块 | 状态 | 完成时间 |
|---------|------|---------|
| 项目初始化 | ✅ | 2024-10-24 |
| SIWE 认证 | ✅ | 2024-10-24 |
| Swagger 文档 | ✅ | 2024-10-25 |
| JWT Guard | ✅ | 2024-10-25 |
| SKU 模块 | ✅ | 2024-10-25 |
| Policy 模块 | ✅ | 2024-10-26 |
| Payment 模块 | ✅ | 2024-10-26 |
| Admin 审核 | ⚪ 待开发 | - |

### Epic 2: 移动端 DApp - ⚪ 未开始

### Epic 3: 管理后台 - ⚪ 未开始

### Epic 4: DevOps - ⚪ 未开始

---

## 📋 下一步计划

### 立即执行 (本周)
- [ ] Admin 审核系统 API
  - GET /admin/policies?status=under_review
  - PATCH /admin/policies/:id (approve/reject)
- [ ] 保单状态机完善
  - pending → under_review → active/rejected

### 短期计划 (下周)
- [ ] 移动端 Expo 项目初始化
- [ ] React Navigation 路由搭建
- [ ] 钱包连接页面（Mock WalletConnect）

### 中期计划 (本月)
- [ ] 完整的移动端购买流程
- [ ] Admin 管理后台基础功能
- [ ] Docker 部署配置

---

## 🔧 技术债务 & 改进点

### 已知问题
- [ ] Payment 模块缺少单元测试
- [ ] Policy 状态机缺少状态转换验证
- [ ] 缺少 E2E 测试

### 性能优化
- [ ] RPC 调用添加缓存和重试机制
- [ ] 数据库查询优化（索引分析）
- [ ] API 响应时间监控

### 安全加固
- [ ] 添加 Rate Limiting
- [ ] 实现 CORS 白名单
- [ ] 敏感操作审计日志

---

## 📚 参考资源

- [NestJS 文档](https://docs.nestjs.com/)
- [Prisma 文档](https://www.prisma.io/docs)
- [ethers.js v6 文档](https://docs.ethers.org/v6/)
- [SIWE 规范](https://docs.login.xyz/)

---

**更新规则**：
1. 每完成一个功能模块，在顶部添加新条目
2. 包含：功能描述、实现细节、相关文件、注意事项
3. 更新统计数据和下一步计划
4. 记录技术债务和改进点
5. 与 `docs/project_state.md` 保持同步
