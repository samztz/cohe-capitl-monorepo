# Cohe Capital API

NestJS-based REST API for the Cohe Capital Web3 insurance platform with Sign-In with Ethereum (SIWE) authentication.

## 🚀 Quick Start (10 minutes)

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file to the monorepo root:

```bash
# From monorepo root
cp apps/api/.env.example .env
```

Edit `.env` and update at minimum:
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `DATABASE_URL` - Should match your PostgreSQL credentials

### 3. Start PostgreSQL Database

From the monorepo root:

```bash
docker compose -f infra/docker/docker-compose.yml up -d db
```

Verify the database is running:

```bash
docker compose -f infra/docker/docker-compose.yml ps
```

### 4. Run Database Migrations

```bash
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
```

This will:
- Generate Prisma Client types
- Create/update database schema
- Apply all migrations

### 5. Start the API

Development mode with hot reload:

```bash
pnpm --filter api dev
```

The API will be available at: `http://localhost:3001`

### 6. Verify Installation

Health check:

```bash
curl http://localhost:3001/healthz
```

Request a SIWE nonce:

```bash
curl -X POST http://localhost:3001/auth/siwe/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}'
```

Expected response:
```json
{
  "nonce": "uuid-v4-string"
}
```

Get products list:

```bash
curl http://localhost:3001/products
```

Expected response:
```json
[
  {
    "id": "uuid",
    "name": "Basic Coverage",
    "chainId": 56,
    "tokenAddress": "0x55d398326f99059fF775485246999027B3197955",
    "decimals": 18,
    "premiumAmt": "100.0",
    "coverageAmt": "10000.0",
    "termDays": 90,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## 📚 Development Guide

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm --filter api dev` | Start development server with hot reload |
| `pnpm --filter api build` | Build for production |
| `pnpm --filter api start` | Start production server |
| `pnpm --filter api test` | Run unit tests |
| `pnpm --filter api test:watch` | Run tests in watch mode |
| `pnpm --filter api test:e2e` | Run end-to-end tests |
| `pnpm --filter api test:cov` | Run tests with coverage |

### Prisma & Database Scripts

| Script | Description |
|--------|-------------|
| `pnpm --filter api prisma:generate` | Generate Prisma Client |
| `pnpm --filter api prisma:migrate` | Create and apply migrations (dev) |
| `pnpm --filter api prisma:deploy` | Apply migrations (production) |
| `pnpm --filter api prisma:studio` | Open Prisma Studio (DB GUI) |

### Project Structure

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/              # SIWE authentication
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt.guard.ts
│   │   ├── products/          # Insurance products (SKUs)
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   └── dto/
│   │   ├── policy/            # Policy management
│   │   │   ├── policy.controller.ts
│   │   │   ├── policy.service.ts
│   │   │   └── dto/
│   │   ├── payment/           # Payment verification
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── blockchain.service.ts
│   │   │   └── dto/
│   │   └── prisma/            # Database client
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── test/                      # E2E tests
└── dist/                      # Build output
```

### Tech Stack

- **Framework**: NestJS 11 + Fastify
- **Database**: PostgreSQL 16 + Prisma ORM
- **Authentication**: JWT + Sign-In with Ethereum (SIWE)
- **Blockchain**: ethers v6 (on-chain payment verification)
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Jest + Supertest
- **API Documentation**: Swagger/OpenAPI

### API Documentation

After starting the development server, you can access the interactive API documentation at:

```
http://localhost:3001/api
```

Swagger UI provides:
- Complete API endpoint reference
- Request/response schemas
- Interactive testing interface
- Authentication configuration (JWT Bearer token)

---

## 📊 核心数据模型

### Policy 表结构（最新版本）

```prisma
enum PolicyStatus {
  DRAFT                      // 草稿状态（创建保单后）
  PENDING_UNDERWRITING       // 待审核（签署合同后）
  APPROVED_AWAITING_PAYMENT  // 审核通过，等待支付
  ACTIVE                     // 生效中
  REJECTED                   // 审核拒绝
  EXPIRED_UNPAID             // 逾期未支付
  EXPIRED                    // 保单已过期
}

model Policy {
  id              String        @id @default(uuid())
  userId          String
  skuId           String
  walletAddress   String
  premiumAmt      Decimal       @db.Decimal(38, 18)
  status          PolicyStatus  @default(DRAFT)
  contractHash    String?
  userSig         String?
  paymentDeadline DateTime?     // 支付截止时间（审核通过时设置）
  startAt         DateTime?     // 保障开始时间（支付后设置）
  endAt           DateTime?     // 保障结束时间（startAt + termDays）
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

**重要字段说明**：
- `status`: 严格枚举类型，不再接受任意字符串
- `paymentDeadline`: 审核通过后设置，用户需在此时间前完成支付
- `startAt/endAt`: 仅在保单 ACTIVE 后才有值

---

## 🔄 保单状态机（先审核再支付）

### 状态转换流程

```mermaid
stateDiagram-v2
    [*] --> DRAFT: 用户创建保单

    DRAFT --> PENDING_UNDERWRITING: 签署合同

    PENDING_UNDERWRITING --> APPROVED_AWAITING_PAYMENT: Admin 审核通过<br/>(设置 paymentDeadline)
    PENDING_UNDERWRITING --> REJECTED: Admin 审核拒绝

    APPROVED_AWAITING_PAYMENT --> ACTIVE: 用户完成支付<br/>(设置 startAt, endAt)
    APPROVED_AWAITING_PAYMENT --> EXPIRED_UNPAID: 超过 paymentDeadline 未支付

    ACTIVE --> EXPIRED: 保障期结束 (now > endAt)

    REJECTED --> [*]
    EXPIRED_UNPAID --> [*]
    EXPIRED --> [*]
```

### 状态详细说明

| 状态 | 触发条件 | 业务含义 | 可执行操作 |
|------|---------|---------|-----------|
| **DRAFT** | 用户调用 `POST /policy` | 保单草稿，未签署 | 用户可签署合同 |
| **PENDING_UNDERWRITING** | 用户签署合同 | 等待 Admin 审核 | Admin 可审核（通过/拒绝） |
| **APPROVED_AWAITING_PAYMENT** | Admin 审核通过 | 等待用户支付，设置 `paymentDeadline` | 用户需在截止时间前支付 |
| **ACTIVE** | 用户完成支付 | 保单生效，设置 `startAt`、`endAt` | 可查看倒计时、提交理赔 |
| **REJECTED** | Admin 审核拒绝 | 保单被拒绝 | 终态，无法再操作 |
| **EXPIRED_UNPAID** | 超过 `paymentDeadline` 未支付 | 逾期未支付 | 终态，无法再操作 |
| **EXPIRED** | `now > endAt` | 保障期结束 | 终态，可续保 |

### 关键业务规则

**1. Admin 审核通过时必须设置 `paymentDeadline`**
```typescript
// admin.service.ts - 审核通过示例
await prisma.policy.update({
  where: { id: policyId },
  data: {
    status: PolicyStatus.APPROVED_AWAITING_PAYMENT,
    paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
  },
});
```

**2. 支付确认后设置保障期**
```typescript
// payment.service.ts - 支付确认后
const termDays = policy.sku.termDays || 90;
const startAt = new Date();
const endAt = new Date(startAt);
endAt.setDate(endAt.getDate() + termDays);

await prisma.policy.update({
  where: { id: policyId },
  data: {
    status: PolicyStatus.ACTIVE,
    startAt,
    endAt,
  },
});
```

**3. 状态字段为枚举，不接受任意字符串**
```typescript
// ❌ 错误：直接使用字符串
policy.status = 'active';  // TypeScript 错误

// ✅ 正确：使用枚举值
import { PolicyStatus } from 'generated/prisma/enums';
policy.status = PolicyStatus.ACTIVE;
```

---

## 📋 API 功能模块

### 1. 认证模块 (Auth Module)

基于以太坊的 SIWE (Sign-In with Ethereum) 认证系统。

**核心功能**：
- 生成随机 nonce 用于签名验证
- 验证 SIWE 签名并颁发 JWT token
- 基于 JWT 的身份认证和授权

**API 端点**：
- `POST /auth/siwe/nonce` - 获取签名 nonce
- `POST /auth/siwe/verify` - 验证签名并获取 JWT
- `GET /auth/siwe/me` - 获取当前用户信息 (需要 JWT)

**业务流程**：
1. 用户提供钱包地址，后端生成唯一 nonce
2. 前端使用私钥签名 SIWE 消息（包含 nonce）
3. 后端验证签名，创建或更新用户记录
4. 返回 JWT token 用于后续 API 调用

---

### 2. 产品模块 (Products Module)

管理保险产品 SKU（Stock Keeping Unit）。

**核心功能**：
- 查询所有活跃的保险产品
- 展示产品详情（保费、保额、期限、支持的代币等）

**API 端点**：
- `GET /products` - 获取所有活跃产品列表

**数据结构**：
```typescript
{
  id: string;           // SKU ID
  name: string;         // 产品名称
  chainId: number;      // 区块链 ID (56 = BSC)
  tokenAddress: string; // 支付代币地址 (如 USDT)
  decimals: number;     // 代币精度 (通常为 18)
  premiumAmt: string;   // 保费金额
  coverageAmt: string;  // 保额
  termDays: number;     // 保险期限（天）
  status: string;       // 产品状态 (active/inactive)
}
```

**业务逻辑**：
- 只返回 `status = "active"` 的产品
- 金额使用 Decimal 类型存储，API 返回字符串格式
- 用户购买时选择 SKU，系统自动填充保费等信息

---

### 3. 保单模块 (Policy Module)

处理保险保单的创建和合同签名。

**核心功能**：
- 创建保单草稿（pending 状态）
- 数字签名合同并更新状态为 under_review

**API 端点**：
- `POST /policy` - 创建新保单 **(需要 JWT)**
- `POST /policy/contract-sign` - 签署保单合同 **(需要 JWT)**

#### 3.1 创建保单

**请求**：
```json
POST /policy
Authorization: Bearer <jwt-token>

{
  "skuId": "uuid"
}
```

**响应**：
```json
{
  "id": "uuid",
  "userId": "uuid",
  "skuId": "uuid",
  "walletAddress": "0xabc...",
  "premiumAmt": "100.0",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**业务规则**：
- 同一钱包地址 + 同一 SKU 只能创建一个保单（唯一约束）
- 保费金额自动从 SKU 复制
- 钱包地址从 JWT token 中提取
- 初始状态为 `pending`

**错误场景**：
- 400: SKU ID 无效
- 401: JWT token 缺失或无效
- 404: SKU 不存在或已停用
- 409: 该钱包已为此 SKU 创建过保单

#### 3.2 签署合同

**请求**：
```json
POST /policy/contract-sign
Authorization: Bearer <jwt-token>

{
  "policyId": "uuid",
  "contractPayload": {
    "policyId": "uuid",
    "walletAddress": "0x...",
    "premiumAmount": "100.0",
    "coverageAmount": "10000.0",
    "termDays": 90,
    "timestamp": 1704067200000
  },
  "userSig": "0x1234..."
}
```

**响应**：
```json
{
  "contractHash": "0xa1b2c3..."  // SHA256 哈希
}
```

**业务逻辑**：
1. 验证保单属于当前用户且状态为 `pending`
2. 对 `contractPayload` 进行规范化（canonical JSON）
3. 计算 SHA256 哈希
4. 存储 contractPayload、contractHash 和 userSig
5. 更新保单状态为 `under_review`

**错误场景**：
- 400: 保单已签署或状态不是 pending
- 404: 保单不存在
- 401: 未授权（非保单所有者）

---

### 4. 支付模块 (Payment Module)

**核心功能**：链上支付验证

**API 端点**：
- `POST /payment/confirm` - 验证链上支付交易

#### 4.1 支付确认流程

**业务场景**：
用户在 BSC 链上向 treasury 地址转账 USDT 后，调用此接口验证支付并激活保单。

**请求**：
```json
POST /payment/confirm

{
  "policyId": "uuid",
  "txHash": "0x1234567890abcdef..."
}
```

**响应**：
```json
{
  "id": "uuid",
  "policyId": "uuid",
  "txHash": "0x...",
  "chainId": 56,
  "tokenAddress": "0x55d398326f99059fF775485246999027B3197955",
  "fromAddress": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "toAddress": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
  "amount": "100000000000000000000",  // Wei 单位
  "confirmed": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**链上验证逻辑**：

1. **获取交易回执**
   ```typescript
   const receipt = await provider.getTransactionReceipt(txHash);
   ```

2. **解析 ERC20 Transfer 事件**
   - 使用 ethers v6 Interface 解析日志
   - 提取：from、to、amount

3. **多层验证**
   - ✅ 交易状态成功 (`receipt.status === 1`)
   - ✅ 代币地址匹配 SKU 配置
   - ✅ 接收方是 treasury 地址
   - ✅ 发送方是保单的钱包地址
   - ✅ 转账金额等于保费金额（精确匹配，Wei 单位）

4. **数据持久化**
   - 使用 `txHash` 作为唯一键 upsert Payment 记录
   - 设置 `confirmed = true`
   - 更新保单状态为 `under_review`

**幂等性保证**：
- 同一笔交易可重复提交，不会重复处理
- 使用数据库 unique 约束防止重复记录

**错误场景**：
- 400: 交易哈希格式错误
- 400: 交易未找到或失败
- 400: 未找到转账到 treasury 的 Transfer 事件
- 400: 发送方地址不匹配
- 400: 转账金额不匹配
- 404: 保单不存在

**环境配置**：
```env
RPC_BSC=https://bsc-dataseed.binance.org/
TREASURY_ADDRESS=0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
```

---

## 💼 完整业务流程示例

### 用户购买保险的完整流程

```mermaid
sequenceDiagram
    participant U as 用户 (前端)
    participant A as API 后端
    participant B as BSC 区块链
    participant W as 用户钱包

    U->>A: 1. POST /auth/siwe/nonce (walletAddress)
    A->>U: { nonce }

    U->>W: 2. 签名 SIWE 消息
    W->>U: signature

    U->>A: 3. POST /auth/siwe/verify (message, signature)
    A->>U: { token, address }

    U->>A: 4. GET /products
    A->>U: [ { id, name, premiumAmt, ... } ]

    U->>A: 5. POST /policy (skuId) + JWT
    A->>U: { policyId, status: "pending" }

    U->>W: 6. 构造合同并签名
    W->>U: contractSignature

    U->>A: 7. POST /policy/contract-sign (policyId, contractPayload, userSig) + JWT
    A->>U: { contractHash }
    Note over A: 保单状态 -> "under_review"

    U->>W: 8. 发起链上转账 (USDT -> treasury)
    W->>B: ERC20.transfer(treasury, premiumAmt)
    B->>W: txHash
    W->>U: txHash

    U->>A: 9. POST /payment/confirm (policyId, txHash)
    A->>B: getTransactionReceipt(txHash)
    B->>A: receipt (logs, status)
    A->>A: 验证 Transfer 事件 (token, from, to, amount)
    A->>U: { payment, confirmed: true }
    Note over A: Payment 记录创建<br/>保单状态 -> "under_review"
```

**状态流转**（已更新为枚举）：
1. **DRAFT** - 保单刚创建，未签署合同
2. **PENDING_UNDERWRITING** - 已签署合同，等待人工审核
3. **APPROVED_AWAITING_PAYMENT** - 审核通过，等待支付
4. **ACTIVE** - 支付完成，保单生效
5. **REJECTED** - 审核拒绝
6. **EXPIRED_UNPAID** - 超过支付期限
7. **EXPIRED** - 保障期结束

详见上方 [🔄 保单状态机](#-保单状态机先审核再支付) 章节

---

## 🔐 Authentication Flow

### SIWE (Sign-In with Ethereum) Process

1. **Request Nonce**
   ```
   POST /auth/siwe/nonce
   Body: { "walletAddress": "0x..." }
   Response: { "nonce": "uuid" }
   ```

2. **Sign Message** (Client-side)
   ```typescript
   import { SiweMessage } from 'siwe';
   import { Wallet } from 'ethers';

   const siweMessage = new SiweMessage({
     domain: 'localhost',
     address: wallet.address,
     uri: 'http://localhost:3001',
     version: '1',
     chainId: 1,
     nonce: receivedNonce,
   });

   const message = siweMessage.prepareMessage();
   const signature = await wallet.signMessage(message);
   ```

3. **Verify Signature & Get JWT**
   ```
   POST /auth/siwe/verify
   Body: {
     "message": "SIWE message string",
     "signature": "0x..."
   }
   Response: {
     "token": "jwt-token",
     "address": "0x..."
   }
   ```

4. **Access Protected Endpoints**
   ```
   GET /auth/siwe/me
   Headers: { "Authorization": "Bearer jwt-token" }
   Response: {
     "userId": "uuid",
     "address": "0x..."
   }
   ```

### JWT Configuration

- **Token Lifetime**: 15 minutes
- **Payload**: `{ address: string }`
- **Secret**: Set via `JWT_SECRET` environment variable

---

## 🗄️ Database Management

### View Database

Open Prisma Studio (visual database browser):

```bash
pnpm --filter api prisma:studio
```

Navigate to: `http://localhost:5555`

### Create a Migration

After modifying `prisma/schema.prisma`:

```bash
pnpm --filter api prisma:migrate
```

Prisma will:
1. Generate SQL migration files
2. Apply changes to the database
3. Regenerate Prisma Client

### Reset Database

⚠️ **WARNING**: This will delete all data!

```bash
docker compose -f infra/docker/docker-compose.yml down -v
docker compose -f infra/docker/docker-compose.yml up -d db
pnpm --filter api prisma:migrate
```

### Backup Database

```bash
docker exec cohe-capital-postgres pg_dump -U postgres cohe_capital_dev > backup.sql
```

### Restore Database

```bash
docker exec -i cohe-capital-postgres psql -U postgres cohe_capital_dev < backup.sql
```

---

## 🧪 Testing

### Run All Tests

```bash
# Unit tests
pnpm --filter api test

# E2E tests (requires running database)
pnpm --filter api test:e2e

# All tests with coverage
pnpm --filter api test:cov
```

### E2E Test Setup

E2E tests require a running PostgreSQL database. See `test/README.md` for details.

The tests cover:
- Complete SIWE authentication flow
- JWT token generation and validation
- Protected endpoint access
- Error scenarios (invalid signatures, nonce mismatch, etc.)

---

## 🌍 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `JWT_SECRET` | Secret for signing JWT tokens | Generate with `openssl rand -base64 32` |
| `SIWE_DOMAIN` | Domain for SIWE messages (no protocol) | `localhost` |
| `SIWE_URI` | Full URI of your application | `http://localhost:3001` |
| `SIWE_CHAIN_ID` | Ethereum chain ID | `1` (Mainnet), `56` (BSC), `5` (Goerli) |
| `RPC_BSC` | BSC RPC endpoint for blockchain queries | `https://bsc-dataseed.binance.org/` |
| `TREASURY_ADDRESS` | Treasury wallet address for payments | `0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `HOST` | API server host | `0.0.0.0` |
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |

---

## 🚢 Deployment

### Production Build

```bash
pnpm --filter api build
```

### Run Production Server

```bash
# Apply migrations
pnpm --filter api prisma:deploy

# Start server
NODE_ENV=production pnpm --filter api start
```

### Environment Checklist

- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Configure proper `DATABASE_URL` with credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` to your frontend domain
- [ ] Update `SIWE_DOMAIN` and `SIWE_URI` to production values
- [ ] Set appropriate `SIWE_CHAIN_ID` for your network
- [ ] Configure `RPC_BSC` with reliable RPC endpoint (consider using paid RPC for production)
- [ ] Set `TREASURY_ADDRESS` to your production treasury wallet

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: `Error: P1001: Can't reach database server`

**Solutions**:
1. Verify PostgreSQL is running: `docker compose -f infra/docker/docker-compose.yml ps`
2. Check `DATABASE_URL` in `.env`
3. Restart database: `docker compose -f infra/docker/docker-compose.yml restart db`

### Prisma Client Errors

**Problem**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
pnpm --filter api prisma:generate
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solutions**:
1. Change `PORT` in `.env`
2. Kill process using port 3001:
   ```bash
   # Find process
   lsof -i :3001
   # Kill it
   kill -9 <PID>
   ```

### Migration Conflicts

**Problem**: Migration file conflicts or schema drift

**Solution**:
```bash
# Reset migrations (development only!)
rm -rf prisma/migrations
pnpm --filter api prisma:migrate
```

---

## 📖 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Sign-In with Ethereum](https://docs.login.xyz/)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)

---

## 🤝 Contributing

1. Follow the coding standards in `CODEX.md`
2. Write tests for new features
3. Update documentation as needed
4. Use conventional commits

---

## 📝 License

ISC
