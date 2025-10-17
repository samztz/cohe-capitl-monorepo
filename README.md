# 🛡️ Web3 Insurance MVP

一个面向 Web3 用户的 **去中心化登录 + 中心化管理的保险 DApp MVP**。  
支持 **BSC 链钱包登录、电子合同签署、保费支付、后台审核与倒计时承保状态**。  
由单人全栈完成（React Native + Next.js + NestJS + PostgreSQL）。

---

## 🚀 项目简介

本项目旨在构建一个 **“可落地的 Web3 保险业务 MVP”**  
- 用户通过钱包登录  
- 填写保险信息并签署电子合同  
- 使用 USDT（BEP-20）支付保费  
- 后台审核通过后，激活 90 天承保状态  
- 用户端可查看保单状态与倒计时  

整体结构采用 **中心化业务逻辑 + 链上身份与支付验证** 的混合架构，兼顾可监管性与链上可验证性。

---

## 🧭 系统架构图

```mermaid
flowchart LR
    subgraph UserApp["📱 Mobile DApp (React Native)"]
      A1[连接钱包<br/>WalletConnect] --> A2[SIWE 登录签名]
      A2 --> A3[填写保险表单]
      A3 --> A4[电子合同签署]
      A4 --> A5[支付保费 (BEP-20)]
      A5 --> A6[查看保单状态与倒计时]
    end

    subgraph API["🧠 后端 API (NestJS + Prisma)"]
      B1[认证模块<br/>SIWE + JWT]
      B2[保单管理<br/>Policy CRUD]
      B3[支付监听服务<br/>BSC RPC/合约事件]
      B4[文件存储接口<br/>R2/S3 上传]
      B5[审计日志与风控]
    end

    subgraph Admin["🖥️ 管理后台 (Next.js)"]
      C1[管理员登录]
      C2[审核保单<br/>Approve/Reject]
      C3[查看支付记录]
      C4[监控与导出报表]
    end

    subgraph Chain["🔗 BSC 区块链"]
      D1[钱包签名验证]
      D2[PremiumCollector.sol<br/>事件触发]
      D3[Treasury 收款地址]
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

📦 Monorepo 结构
graphql
Copy code
.
├── apps/
│   ├── mobile/          # React Native DApp (Expo)
│   ├── admin/           # Next.js 审计后台
│   └── api/             # NestJS 服务端
│
├── packages/
│   ├── ui/              # 通用 UI 组件
│   ├── types/           # TS 类型共享 (User, Policy, Payment)
│   └── config/          # tsconfig, eslint, prettier 配置
│
├── contracts/
│   └── PremiumCollector.sol  # 简易保费收款合约 (BEP20)
│
├── infra/
│   ├── docker/          # Docker Compose 与本地环境
│   └── scripts/         # 启动/监听/迁移脚本
│
└── README.md
🧱 核心数据模型（Prisma Schema 摘要）
prisma
Copy code
model User {
  id              String   @id @default(uuid())
  walletAddress   String   @unique
  email           String?
  createdAt       DateTime @default(now())
  lastLoginAt     DateTime?
  policies        Policy[]
}

model SKU {
  id             String   @id @default(uuid())
  name           String
  chainId        Int
  tokenAddress   String
  termDays       Int      @default(90)
  minPremium     Float
  maxCoverage    Float
  termsUrl       String
  status         String
}

model Policy {
  id             String   @id @default(uuid())
  user           User     @relation(fields: [userId], references: [id])
  userId         String
  skuId          String
  walletAddress  String
  premiumAmount  Float
  contractHash   String
  userSig        String
  status         String   // Draft, UnderReview, Active, Expired, Rejected
  startAt        DateTime?
  endAt          DateTime?
  createdAt      DateTime @default(now())
}
⚙️ 本地开发
bash
Copy code
# 安装依赖
pnpm i

# 启动本地数据库
docker compose up -d

# 初始化 Prisma
pnpm --filter api prisma migrate dev

# 启动开发服务
pnpm --filter api dev
pnpm --filter admin dev
pnpm --filter mobile start
环境变量 .env

bash
Copy code
DATABASE_URL=postgresql://user:pass@localhost:5432/web3_insurance
JWT_SECRET=xxxxxx
RPC_BSC=https://bsc-dataseed.binance.org/
TREASURY_ADDRESS=0xYourTreasuryWallet
STORAGE_BUCKET_URL=https://r2.example.com
🧠 功能流程
阶段	模块	动作	结果
登录	钱包签名 (SIWE)	personal_sign + nonce	生成 JWT
签署合同	电子签名	personal_sign(contract_hash)	存储签名
支付	BEP20 转账 / 调用合约	emit PremiumPaid	数据库更新
审核	后台操作	Approve / Reject	更新状态
倒计时	前端展示	now → endAt	动态刷新

🔗 合约：PremiumCollector.sol
solidity
Copy code
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint amount) external returns (bool);
}

contract PremiumCollector {
    address public treasury;

    event PremiumPaid(bytes32 policyId, address indexed from, uint256 amount, address token);

    constructor(address _treasury) {
        treasury = _treasury;
    }

    function purchasePolicy(bytes32 policyId, uint256 amount, address token) external {
        IERC20(token).transferFrom(msg.sender, treasury, amount);
        emit PremiumPaid(policyId, msg.sender, amount, token);
    }
}

🧾 安全与合规
钱包签名绑定用户地址，防止伪造登录；

合同内容计算哈希后存储，防止内容篡改；

文件上传经后端签名 URL，避免暴露存储桶；

审计日志记录所有关键操作；

同一地址同 SKU 仅可持有一份保单。


📖 License
MIT License © 2025 samztz
仅供演示与教学用途，不构成实际保险产品或金融服务。
