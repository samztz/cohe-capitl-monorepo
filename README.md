````markdown
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

> 说明：为兼容 GitHub 渲染，以下 Mermaid **不含换行 `<br/>`、emoji、或断开的箭头**。

```mermaid
flowchart LR
  subgraph UserApp["Mobile DApp (React Native)"]
    A1[Connect Wallet (WalletConnect)]
    A2[SIWE Login Signature]
    A3[Fill Insurance Form]
    A4[Sign Contract]
    A5[Pay Premium (BEP-20)]
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
    C2[Review Policy (Approve or Reject)]
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
    A5-- 调用合约 -->D2
    D2-- 事件通知 -->B3
    B3-- 更新状态 -->B2
    B2-- 审核接口 -->C2
    C2-- 更新保单 -->B2
    B2-- JSON 响应 -->A6
```

🧩 技术栈
模块	技术	说明
前端 (Mobile)	React Native + Expo + WalletConnect v2 + ethers v6	BSC 钱包登录、签名、支付
后台 (Web)	Next.js 14 + Tailwind + shadcn/ui	管理员审核、配置、状态查看
后端 API	NestJS + Fastify + Prisma + PostgreSQL	核心 API 与业务逻辑
数据层	PostgreSQL (Neon/Supabase)	结构化存储
存储层	Cloudflare R2 / S3 兼容	文件、合同、附件
区块链交互	ethers v6 + Ankr RPC (BSC)	钱包验证、支付监听
DevOps	Docker + Railway/Render 部署 + GitHub Actions CI/CD	部署与监控
认证体系	SIWE (Sign-In with Ethereum) + JWT (15min)	钱包签名登录
ORM	Prisma	类型安全的数据库访问

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

## 🧾 合约示例（可选）

```solidity
// contracts/PremiumCollector.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
  function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract PremiumCollector {
  address public treasury;

  event PremiumPaid(bytes32 policyId, address indexed from, uint256 amount, address token);

  constructor(address _treasury) {
    treasury = _treasury;
  }

  function purchasePolicy(bytes32 policyId, uint256 amount, address token) external {
    require(treasury != address(0), "treasury not set");
    require(amount > 0, "amount zero");
    IERC20(token).transferFrom(msg.sender, treasury, amount);
    emit PremiumPaid(policyId, msg.sender, amount, token);
  }
}
```

---

## 🔒 安全与合规基线

* JWT 短期（15m）+ Refresh；写操作校验 **JWT 地址 == 请求地址**。
* 合同内容参与哈希，任何修改都会使签名失效。
* 上传采用服务端签名 URL，存储桶默认私有。
* 审计日志记录：登录、签署、支付、审批、状态变更。
* 唯一约束 `(walletAddress, skuId)` 限制「单地址/单保险」。

---

## ✅ 开发任务清单（Notion / Markdown）

> 目标：**15–20 天交付完整 MVP**。勾选即可同步进度。

### Phase 1 — 基础架构与登录（Day 1–3）

* [ ] 建立 Monorepo（pnpm + turbo）
* [ ] 初始化 mobile / admin / api 三个应用
* [ ] 配置 Postgres + Prisma（User/SKU/Policy/Payment）
* [ ] 实现 SIWE 登录（nonce / verify / JWT）
* [ ] 搭建基础 UI（主题、导航、表单组件）
* [ ] Docker 本地环境、.env 模板

### Phase 2 — 保单流程与签署（Day 4–10）

* [ ] SKU 列表与详情（Mock → DB）
* [ ] 表单提交（Policy Draft）
* [ ] 合同签署（contract_hash + personal_sign）
* [ ] 支付流程（BEP-20 转账到 Treasury 或合约调用）
* [ ] 支付监听（轮询或事件订阅 → Payment 绑定）
* [ ] 工单/日志（最小实现）

### Phase 3 — 审核后台与倒计时（Day 11–14）

* [ ] 管理员登录
* [ ] 待审核 Policy 列表与详情
* [ ] 审核动作（Approve/Reject）与状态变更
* [ ] endAt 写入与倒计时组件
* [ ] 支付记录、审计日志列表

### Phase 4 — 测试与上线（Day 15–20）

* [ ] 端到端测试：登录 → 签署 → 支付 → 审核 → 倒计时
* [ ] 异常与错误提示（余额不足、网络错误、超时）
* [ ] 部署：API（Render/Railway）、Admin（Vercel）、DNS/HTTPS（Cloudflare）
* [ ] Demo 钱包与测试币准备、演示脚本/截图
* [ ] 文档打包与交付说明（SOW/操作手册）

---

## 📖 License

MIT License © 2025 samztz
<<<<<<< HEAD
本仓库仅供演示与教学用途，不构成实际保险产品或金融服务。

```
```
=======
仅供演示与教学用途，不构成实际保险产品或金融服务。
>>>>>>> 1d3c21c0e6aacd0e046f3dd0511f6cb838e7d643
