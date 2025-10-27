# 📝 CHANGELOG - Cohe Capital 开发日志

> **规则**：每次完成一个功能模块（task）后，Claude Code 必须在此文件顶部添加新条目，记录完成时间、功能、相关文件和注意事项。

---

## [Unreleased]

### 待开发功能
- 倒计时接口（Epic 2 - Issue #10）
- Admin 审核前端（Epic 6 - Issue #25-31）⭐ 新增
- 移动端 DApp UI（Epic 3 - Issue #12-16）
- 前后端联调与测试（Epic 4 - Issue #17-20）
- 部署与演示环境（Epic 5 - Issue #21-24）

### 📋 规划变更
- **2025-10-27**: 新增 Epic 6 - Admin 审核前端（Web Admin Panel），包含 7 个 Issue (#25-31)

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
