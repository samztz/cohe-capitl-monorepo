
# 🛡️ Web3 Insurance MVP

一个面向 Web3 用户的 **去中心化登录 + 中心化管理** 的保险 DApp MVP。  
支持 **BSC 链钱包登录、电子合同签署、保费支付、后台审核与倒计时承保状态**。  
由单人全栈完成（React Native + Next.js + NestJS + PostgreSQL）。

---

## 🚀 项目简介

本项目在 15–20 天内交付一个可运行的演示版本（MVP）：
- 用户通过钱包登录（SIWE）
- 填写保险信息并签署电子合同
- 使用 USDT（BEP-20）支付保费
- 后台审核通过后，激活 90 天承保状态
- 用户端查看保单状态与倒计时

---

## 🧭 系统架构图（Mermaid）

```mermaid
flowchart LR
  subgraph UserApp["Mobile DApp (React Native)"]
    A1[Connect Wallet WalletConnect]
    A2[SIWE Login Signature]
    A3[Fill Insurance Form]
    A4[Sign Contract]
    A5[Pay Premium BEP-20]
    A6[View Policy Status & Countdown]
    A1 --> A2 --> A3 --> A4 --> A5 --> A6
  end
  subgraph API["Backend API (NestJS + Prisma)"]
    B1[Auth: SIWE + JWT]
    B2[Policy Service: CRUD]
    B3[Payment Listener: BSC RPC or Contract Events]
    B4[File Storage: R2 or S3]
    B5[Audit Log and Risk Rules]
  end
  subgraph Admin["Admin Dashboard (Next.js)"]
    C1[Admin Login]
    C2[Review Policy Approve or Reject]
    C3[View Payments]
    C4[Monitoring and Reports]
  end
  subgraph Chain["BSC Blockchain"]
    D1[Verify Wallet Signature]
    D2[PremiumCollector.sol Event]
    D3[Treasury Address]
  end
    A1-- personal_sign -->B1
    A3-- REST API -->B2
    A5-- Call Contract -->D2
    D2-- Event Notice -->B3
    B3-- Update Status -->B2
    B2-- Review API -->C2
    C2-- Update Policy -->B2
    B2-- JSON Response -->A6
```

---

## 🧩 技术栈

| 模块          | 技术                                                                            | 说明             |
| ----------- | ----------------------------------------------------------------------------- | -------------- |
| 前端 (Mobile) | React Native + Expo + WalletConnect v2 + ethers v6 + Zustand + TanStack Query | BSC 钱包连接、签名与支付 |
| 后台 (Web)    | Next.js 14 + Tailwind CSS + shadcn/ui                                         | 审核操作、配置、报表     |
| 后端 API      | NestJS (Fastify) + Prisma + PostgreSQL                                        | 核心业务 API、鉴权、存储 |
| 数据层         | PostgreSQL (Neon/Supabase/Railway)                                            | 结构化数据          |
| 存储层         | Cloudflare R2 / S3 兼容                                                         | 合同、附件、KYC 资料   |
| 区块链         | ethers v6 + BSC RPC (Ankr/QuickNode)                                          | 钱包签名、支付监听      |
| DevOps      | Docker + GitHub Actions + Render/Railway/Vercel + Cloudflare                  | 部署与监控          |
| 认证          | SIWE (EIP-4361) + JWT（短期 15m）                                                 | 登录票据           |
| 其他          | OpenTelemetry/Sentry（可选）                                                      | 观测与错误监控        |

---

## 📦 Monorepo 结构（pnpm + turbo）

```
.
├── apps/
│   ├── mobile/                # React Native (Expo)
│   ├── admin/                 # Next.js 审计后台
│   └── api/                   # NestJS 服务端
│
├── packages/
│   ├── ui/                    # 共享 UI 组件
│   ├── types/                 # 共享 TS 类型 (User, Policy, Payment)
│   └── config/                # tsconfig / eslint / prettier
│
├── contracts/
│   └── PremiumCollector.sol   # 可选：保费收款合约 (BEP-20)
│
├── infra/
│   ├── docker/                # docker-compose 等
│   └── scripts/               # 启动/监听/迁移脚本
│
└── README.md
```

---

## 🧱 核心数据模型（Prisma 摘要）

```prisma
model User {
  id            String   @id @default(uuid())
  walletAddress String   @unique
  email         String?
  createdAt     DateTime @default(now())
  lastLoginAt   DateTime?
  policies      Policy[]
}

model SKU {
  id           String   @id @default(uuid())
  name         String
  chainId      Int
  tokenAddress String
  termDays     Int      @default(90)
  minPremium   Decimal  @db.Decimal(38, 18)
  maxCoverage  Decimal  @db.Decimal(38, 18)
  termsUrl     String
  status       String
}

model Policy {
  id            String   @id @default(uuid())
  user          User     @relation(fields: [userId], references: [id])
  userId        String
  skuId         String
  walletAddress String
  coverageAmt   Decimal  @db.Decimal(38, 18)
  premiumAmt    Decimal  @db.Decimal(38, 18)
  contractHash  String
  userSig       String
  status        String   // Draft | UnderReview | Active | Expired | Rejected
  startAt       DateTime?
  endAt         DateTime?
  createdAt     DateTime @default(now())

  @@unique([walletAddress, skuId]) // 单地址/单保险
}

model Payment {
  id          String   @id @default(uuid())
  policyId    String
  chainId     Int
  tokenAddr   String
  amount      Decimal  @db.Decimal(38, 18)
  from        String
  to          String
  txHash      String   @unique
  blockNumber Int
  confirmed   Boolean  @default(false)
  detectedAt  DateTime @default(now())
}
```

---

## 🔗 区块链交互设计

* **登录**：SIWE（EIP-4361），前端 `personal_sign`，后端校验并签发短期 JWT。
* **合同签署**：对 `contract_hash = sha256(合同内容 + 表单数据 + SKU + premium)` 做 `personal_sign` 并存证。
* **支付**：BEP-20 转账至金库地址，或调用 `PremiumCollector.sol`（推荐，事件可监听）。
* **监听**：后端通过 RPC 轮询或事件订阅，写入 `Payment` 并绑定到 `Policy`。
* **激活**：后台审核通过 → `Policy.status = Active`，写 `startAt / endAt`（90 天）。

---

## ⚙️ 本地开发

### 先决条件

* Node.js ≥ 20.x
* pnpm ≥ 9.x
* Docker（用于本地 Postgres）
* 可选：BSC Testnet RPC

### 安装与启动

```bash
# 1) 安装依赖
pnpm i

# 2) 启动本地数据库
docker compose up -d

# 3) 初始化数据库
pnpm --filter api prisma migrate dev

# 4) 分别启动服务
pnpm --filter api dev
pnpm --filter admin dev
pnpm --filter mobile start
```

### 环境变量示例（根目录 `.env` 或分别配置）

```
DATABASE_URL=postgresql://user:pass@localhost:5432/web3_insurance
JWT_SECRET=replace_with_secure_random
RPC_BSC=https://bsc-dataseed.binance.org/
TREASURY_ADDRESS=0xYourTreasuryWallet
STORAGE_BUCKET_URL=https://r2.example.com
STORAGE_ACCESS_KEY=xxx
STORAGE_SECRET_KEY=xxx
```

---

## 🧠 功能流程（端到端）

| 阶段  | 动作          | 触发                             | 结果                        |
| --- | ----------- | ------------------------------ | ------------------------- |
| 登录  | 钱包签名（SIWE）  | personal_sign                  | 生成 JWT，创建/更新用户            |
| 创建  | 选择 SKU + 表单 | REST API                       | 生成 Policy（Draft）          |
| 签署  | 合同哈希签名      | personal_sign                  | 保存 userSig，状态 UnderReview |
| 支付  | 转账/调用合约     | ERC20 transfer 或 contract call | 记录 Payment                |
| 审核  | 后台审核        | Approve/Reject                 | 激活保单或拒绝                   |
| 倒计时 | 到期计算        | endAt - now                    | 展示倒计时与状态                  |

---

## 📡 API 概要

* `GET /auth/siwe/nonce`
* `POST /auth/siwe/verify`
* `GET /sku` / `GET /sku/:id`
* `POST /policy`
* `POST /policy/:id/contract-sign`
* `POST /policy/:id/payment/intent`
* `GET /policy/:id`
* `POST /policy/:id/attachments`

**Admin**

* `POST /admin/login`
* `GET /admin/policies?status=UnderReview`
* `POST /admin/policy/:id/approve`
* `POST /admin/policy/:id/reject`
* `GET /admin/payments?policyId=...`

---

## 🔒 安全与合规基线

* JWT 短期（15m）+ Refresh；写操作校验 **JWT 地址 == 请求地址**。
* 合同内容参与哈希，任何修改都会使签名失效。
* 上传采用服务端签名 URL，存储桶默认私有。
* 审计日志记录：登录、签署、支付、审批、状态变更。
* 唯一约束 `(walletAddress, skuId)` 限制「单地址/单保险」。
