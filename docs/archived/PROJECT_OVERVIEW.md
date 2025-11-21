# 📋 Cohe Capital 项目概览

**一句话描述**: 基于区块链的 Web3 保险 DApp 平台，支持钱包登录、在线购买、数字签约、链上支付

**版本**: v1.0 MVP
**最后更新**: 2025-01-20

---

## 目录

1. [项目简介](#项目简介)
2. [系统架构](#系统架构)
3. [核心模块](#核心模块)
4. [技术栈](#技术栈)
5. [数据模型](#数据模型)
6. [核心功能](#核心功能)
7. [术语表](#术语表)
8. [快速链接](#快速链接)

---

## 项目简介

### 背景

Cohe Capital 是一个面向 Web3 用户的去中心化保险平台，旨在通过区块链技术提供透明、安全、高效的保险服务。平台实现了从用户注册、产品选购、合同签署到链上支付的完整业务闭环。

### 核心价值

- **去中心化身份**: 基于 SIWE (EIP-4361) 的钱包登录，无需注册账号
- **透明可信**: 所有交易记录上链，公开透明
- **高效流程**: 传统保险 7-14 天流程缩短至 1-2 天
- **全球化**: 支持多语言（英文/繁体中文）、多链（BSC/Ethereum/Polygon）

### 项目数据

| 指标 | 数值 |
|------|------|
| **开发周期** | 35 天 (2025-10-17 ~ 2025-11-20) |
| **完成度** | 71.6% (53/74 任务) |
| **代码总量** | 17,500+ 行 TypeScript |
| **API 端点** | 23 个 REST API |
| **支持链** | BSC Mainnet/Testnet |
| **支持语言** | 英文、繁体中文 |

---

## 系统架构

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                       用户层                                 │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │   用户浏览器     │         │  管理员浏览器    │           │
│  │  (Web DApp)     │         │  (Admin Panel)  │           │
│  └────────┬────────┘         └────────┬────────┘           │
└───────────┼──────────────────────────┼────────────────────┘
            │                          │
            │         HTTP/HTTPS       │
            │                          │
┌───────────▼──────────────────────────▼────────────────────┐
│                    接入层 (Nginx)                          │
│          反向代理 + 负载均衡 + SSL/TLS                      │
└───────────┬──────────────────────────┬────────────────────┘
            │                          │
      ┌─────▼─────┐            ┌──────▼──────┐
      │  Web App  │            │ Admin Panel │
      │  :3000    │            │   :3002     │
      └─────┬─────┘            └──────┬──────┘
            │                         │
            │      API 调用 (/api)     │
            │                         │
┌───────────▼─────────────────────────▼────────────────────┐
│                  应用层 (API Server)                      │
│                   NestJS + Fastify                        │
│                      :3001                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Auth  │ Products │ Policy │ Payment │ Admin     │   │
│  └──────────────────────────────────────────────────┘   │
└───────────┬──────────────────────────┬───────────────────┘
            │                          │
      ┌─────▼─────┐            ┌──────▼──────┐
      │PostgreSQL │            │ BSC网络      │
      │  :5432    │            │ (区块链)     │
      └───────────┘            └─────────────┘
```

### 三层架构

1. **用户层**: Web DApp (用户端) + Admin Panel (管理员端)
2. **应用层**: NestJS API Server (业务逻辑)
3. **数据层**: PostgreSQL (关系数据) + BSC 区块链 (交易数据)

---

## 核心模块

### 后端模块 (API Server)

| 模块 | 职责 | 关键功能 |
|------|------|---------|
| **Auth** | 用户认证 | SIWE 登录、JWT 签发、nonce 管理 |
| **Products** | 产品管理 | SKU CRUD、产品列表查询 |
| **Policy** | 保单管理 | 保单创建、合同签署、状态管理、手写签名存储 |
| **Payment** | 支付验证 | 链上交易验证、支付记录、保单激活 |
| **Admin** | 后台管理 | 保单审核、数据统计 |
| **Settings** | 系统配置 | 配置项管理（如 Treasury 地址） |

### 前端模块

| 模块 | 技术栈 | 核心页面 |
|------|--------|---------|
| **Web DApp** | Next.js 14 + Reown AppKit | 登录、产品列表、保单表单、合同签署、支付 |
| **Admin Panel** | Next.js 14 + shadcn/ui | 保单列表、审核页、详情页 |

---

## 技术栈

### 前端技术

```
Next.js 14.2.0 (App Router + Server Components)
├── React 18.3.1
├── TypeScript 5.9.3
├── Tailwind CSS 3.4.17
├── Zustand 5.0.8 (状态管理)
├── TanStack Query 5.62.11 (数据获取)
├── react-hook-form 7.54.0 + Zod 3.23.8 (表单验证)
└── Web3 集成
    ├── Reown AppKit 1.8.14 (钱包连接)
    ├── ethers.js 6.13.0 (区块链交互)
    └── viem 2.38.5 (类型化合约)
```

### 后端技术

```
NestJS 11.1.7 (Fastify 5.6.1)
├── TypeScript 5.9.3
├── Prisma 6.18.0 (ORM)
├── PostgreSQL 16 (数据库)
├── 认证
│   ├── SIWE 3.0.0 (EIP-4361)
│   ├── JWT (jsonwebtoken 9.0.2)
│   └── Passport.js 4.0.1
├── Web3
│   └── ethers.js 6.x (链上验证)
├── 日志
│   ├── nestjs-pino 4.3.0
│   └── pino 9.6.0
└── 测试
    ├── Jest 30.2.0
    └── supertest 7.1.4
```

### 基础设施

```
部署
├── Docker + Docker Compose
├── Nginx (反向代理)
├── Node.js 20 LTS (Alpine)
└── pnpm 10.19.0 (包管理)

构建
├── Turbo 2.5.8 (Monorepo 构建)
└── TypeScript 5.9.3 (编译)
```

---

## 数据模型

### 核心实体

```
User (用户)
  ├── id: UUID
  ├── walletAddress: String (唯一)
  ├── nonce: String (SIWE 随机数)
  └── roles: String[] (角色)

SKU (产品)
  ├── id: UUID
  ├── name: String
  ├── chainId: Int (链 ID)
  ├── tokenAddress: String
  ├── premiumAmt: Decimal (保费)
  └── coverageAmt: Decimal (承保金额)

Policy (保单)
  ├── id: UUID
  ├── userId: UUID → User
  ├── skuId: UUID → SKU
  ├── status: PolicyStatus (状态枚举)
  ├── contractHash: String (合同哈希)
  ├── userSig: String (用户签名)
  ├── signatureImageUrl: String (手写签名图片)
  ├── signatureHash: String (签名 SHA256)
  ├── paymentDeadline: DateTime (支付截止时间)
  └── startAt/endAt: DateTime (承保起止时间)

Payment (支付记录)
  ├── id: UUID
  ├── policyId: UUID → Policy
  ├── txHash: String (唯一)
  ├── amount: Decimal
  └── confirmed: Boolean
```

### 保单状态机

```
[创建保单]
     ↓
PENDING_UNDERWRITING (待审核)
     ↓
     ├─[批准]→ APPROVED_AWAITING_PAYMENT (等待支付)
     │                 ↓
     │          [支付成功] → ACTIVE (已激活)
     │                 ↓
     │          [24h 超时] → EXPIRED_UNPAID
     │
     └─[拒绝]→ REJECTED
```

---

## 核心功能

### 1. SIWE 钱包登录

**实现**: 基于 EIP-4361 标准的去中心化登录

**流程**:
1. 用户连接钱包 (MetaMask/WalletConnect)
2. 后端生成 nonce (随机数)
3. 前端构造 SIWE message
4. 用户签名 message
5. 后端验证签名，签发 JWT token

**优势**:
- ✅ 零注册、零密码
- ✅ 私钥不离开用户设备
- ✅ 30 秒完成登录
- ✅ 防重放攻击 (nonce 一次性)

### 2. 手写电子签名

**实现**: Canvas 签名 + Base64 编码 + SHA256 哈希

**流程**:
1. 用户在 SignaturePad 组件上手写签名
2. 导出 PNG 图片 (Base64)
3. 后端保存图片到本地文件系统
4. 计算 SHA256 哈希值
5. 记录签名元数据 (IP、User-Agent、时间戳、钱包地址)

**安全特性**:
- ✅ 完整性校验 (SHA256)
- ✅ 审计追踪 (IP、UA、timestamp)
- ✅ 防篡改 (前端锁定 + 后端哈希)

### 3. 数字合同签署

**实现**: 对合同哈希进行钱包签名

**流程**:
1. 生成合同 payload (包含保单详情)
2. 计算 SHA256 哈希
3. 用户用钱包签名哈希值
4. 后端验证签名合法性
5. 存储签名到数据库

**优势**:
- ✅ 防篡改 (任何修改导致哈希变化)
- ✅ 可验证 (第三方可验证签名真实性)
- ✅ 全流程数字化

### 4. 链上支付验证

**实现**: 监听 BSC 链上转账，自动验证并激活保单

**流程**:
1. 用户发起链上转账 (USDT/BNB → Treasury)
2. 用户提交 txHash 到后端
3. 后端通过 RPC 查询交易详情
4. 验证四要素: 发送地址、接收地址、金额、代币
5. 验证通过后激活保单

**优势**:
- ✅ 实时确认 (几分钟内)
- ✅ 防伪造 (链上数据不可篡改)
- ✅ 自动化 (无需人工对账)

### 5. 管理员审核

**实现**: Admin Panel 审核保单，批准/拒绝 + 备注

**功能**:
- 保单列表 (分页、筛选、搜索)
- 保单详情 (查看手写签名、合同内容)
- 审核操作 (批准 → 等待支付，拒绝 → 终止)
- 支付倒计时 (24 小时支付窗口)

---

## 术语表

| 术语 | 全称 | 说明 |
|------|------|------|
| **SIWE** | Sign-In with Ethereum | 基于 EIP-4361 的去中心化登录标准 |
| **EIP-4361** | Ethereum Improvement Proposal 4361 | SIWE 协议规范 |
| **JWT** | JSON Web Token | 无状态认证令牌 |
| **SKU** | Stock Keeping Unit | 产品库存单位 (保险产品) |
| **BEP-20** | Binance Smart Chain Token Standard | BSC 代币标准 (类似 ERC-20) |
| **Treasury** | 资金库 | 收款地址，用于接收保费 |
| **Nonce** | Number Once | 一次性随机数，防重放攻击 |
| **TxHash** | Transaction Hash | 区块链交易哈希值 |
| **RPC** | Remote Procedure Call | 区块链节点通信协议 |
| **SSR** | Server-Side Rendering | 服务端渲染 |
| **DApp** | Decentralized Application | 去中心化应用 |

---

## 快速链接

### 📚 文档

- [本地开发指南](./LOCAL_DEVELOPMENT.md) - 如何在本地运行项目
- [部署指南](./DEPLOYMENT.md) - 如何部署到生产环境
- [运维指南](./OPERATIONS.md) - 如何运维和监控
- [架构白皮书](./Cohe-Capital-架构系统白皮书.md) - 完整技术文档 (71,000+ 字)
- [路线图](./ROADMAP.md) - 项目进度和未来规划
- [变更日志](./CHANGELOG.md) - 开发历史记录

### 🔗 在线服务

| 服务 | 本地地址 | 生产地址 |
|------|---------|---------|
| **Web DApp** | http://localhost:3000 | https://yourdomain.com |
| **Admin Panel** | http://localhost:3002/admin | https://yourdomain.com/admin |
| **API Server** | http://localhost:3001 | https://yourdomain.com/api |
| **Swagger 文档** | http://localhost:3001/api-docs | https://yourdomain.com/api-docs |
| **健康检查** | http://localhost:3001/healthz | https://yourdomain.com/healthz |
| **Prisma Studio** | http://localhost:5555 | (仅本地) |

### 🛠️ 开发工具

- **代码仓库**: (私有仓库)
- **问题追踪**: GitHub Issues
- **编码规范**: [CODEX.md](../CODEX.md)
- **AI 协作**: [CLAUDE.md](../CLAUDE.md)

---

## 项目截图

### Web DApp (用户端)

- 登录页: 钱包连接 + SIWE 签名
- 产品列表: 展示所有可购买产品
- 保单表单: 填写保费和承保金额
- 合同签署: 手写签名 + 钱包签名
- 支付页面: 链上转账确认
- 我的保单: 查看保单列表和状态

### Admin Panel (管理员端)

- 保单列表: 分页、筛选、搜索
- 保单详情: 查看完整信息 + 手写签名
- 审核页面: 批准/拒绝 + 备注
- 倒计时: 24 小时支付窗口

*(截图文件位于 `docs/ui-snapshot/` 目录)*

---

## 常见问题 FAQ

### Q1: 支持哪些钱包？

A: 支持所有兼容 WalletConnect v2 的钱包，包括:
- MetaMask
- Trust Wallet
- Rainbow
- Coinbase Wallet
- 等 300+ 钱包

### Q2: 支持哪些区块链？

A: 当前支持:
- ✅ BSC Mainnet (Chain ID: 56)
- ✅ BSC Testnet (Chain ID: 97)

未来计划支持:
- ⚪ Ethereum Mainnet
- ⚪ Polygon
- ⚪ Arbitrum

### Q3: 支付后多久激活保单？

A: 通常在 **1-5 分钟**内自动激活，取决于区块确认速度。用户提交 txHash 后，后端会验证交易并自动激活保单。

### Q4: 手写签名存储在哪里？

A:
- **开发环境**: 本地文件系统 (`apps/api/uploads/signatures/`)
- **生产环境建议**: Cloudflare R2 或 AWS S3 私有存储

### Q5: 如何切换语言？

A: 点击页面右上角的语言切换器，支持:
- 🇬🇧 English
- 🇹🇼 繁體中文

---

## 贡献指南

### 开发流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交变更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 遵循 [CODEX.md](../CODEX.md) 编码规范
- 使用 TypeScript strict mode
- 所有 API 输入必须 Zod 验证
- 提交前运行 `pnpm lint` 和 `pnpm test`

### AI 协作

- 参考 [CLAUDE.md](../CLAUDE.md) 使用 Claude Code
- 使用 Todo 工具追踪任务
- 完成功能后更新 CHANGELOG.md

---

## 联系方式

- **技术负责人**: samztz
- **文档维护**: 每周同步最新进度
- **问题反馈**: GitHub Issues

---

**最后更新**: 2025-01-20
**文档版本**: v1.0

**© 2025 Cohe Capital. All rights reserved.**
