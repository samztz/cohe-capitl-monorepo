# 🌐 Web DApp - Cohe Capital Insurance

Next.js 14 Web 应用，实现完整的 Web3 保险购买流程（钱包登录 + 保单购买 + 倒计时）。

> ✅ **当前状态**: 已完成钱包连接与 SIWE 登录，产品列表和保单购买流程开发中

---

## 🚀 快速开始

### 先决条件

- Node.js ≥ 20.x
- pnpm ≥ 10.x
- 运行中的后端 API (端口 3001)
- BSC Testnet 或 Mainnet RPC

### 启动开发服务器

```bash
# 从项目根目录
pnpm --filter web dev

# 或者进入 apps/web 目录
cd apps/web
pnpm dev
```

访问 http://localhost:3030

---

## 📁 项目结构

```
apps/web/
├── public/
│   └── assets/              # 图片资源
│       ├── cohe-capitl-app-logo.png
│       └── welcome-logo.png
│
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── layout.tsx       # 根布局（AppKit Provider）
│   │   ├── page.tsx         # 首页（智能路由）
│   │   ├── auth/
│   │   │   └── connect/     # 钱包连接页
│   │   │       └── page.tsx
│   │   └── dashboard/       # 用户主页
│   │       └── page.tsx
│   │
│   ├── hooks/               # React Hooks
│   │   └── useSiweAuth.ts   # SIWE 登录逻辑
│   │
│   ├── lib/                 # 工具函数
│   │   ├── siweUtil.ts      # SIWE 消息格式化
│   │   ├── resetAuth.ts     # 登出与缓存清理
│   │   └── appkit.ts        # Reown AppKit 配置
│   │
│   ├── store/               # Zustand 状态管理
│   │   └── authStore.ts     # 认证状态
│   │
│   └── styles/
│       └── globals.css      # Tailwind CSS
│
├── .env.local               # 本地环境变量（不提交）
├── .env.production.example  # 生产环境变量模板
├── next.config.js           # Next.js 配置
├── tailwind.config.ts       # Tailwind 配置
└── tsconfig.json            # TypeScript 配置
```

---

## ⚙️ 环境变量

创建 `.env.local` 文件：

```bash
# API 后端地址
NEXT_PUBLIC_API_URL=http://localhost:3001

# Reown AppKit 项目 ID（从 https://cloud.reown.com 获取）
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here

# BSC 网络配置
NEXT_PUBLIC_CHAIN_ID=97                          # 97 = BSC Testnet, 56 = BSC Mainnet
NEXT_PUBLIC_CHAIN_NAME=BSC Testnet               # 网络显示名称
NEXT_PUBLIC_CHAIN_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/

# SIWE 配置
NEXT_PUBLIC_SIWE_DOMAIN=localhost                # 生产环境改为你的域名
NEXT_PUBLIC_SIWE_URI=http://localhost:3030       # 生产环境改为 https://yourdomain.com
```

**获取 Reown Project ID**:
1. 访问 https://cloud.reown.com
2. 注册并创建新项目
3. 复制 Project ID 到 `NEXT_PUBLIC_REOWN_PROJECT_ID`

---

## 🧩 核心功能

### ✅ 已完成功能

#### 1. 智能路由（`/`）
- 自动检测认证状态
- 已认证用户 → `/dashboard`
- 未认证用户 → `/auth/connect`

#### 2. 钱包连接页（`/auth/connect`）
- **Connect Wallet** 按钮 → 打开 Reown AppKit Modal
- 支持多种钱包：MetaMask, WalletConnect, Coinbase Wallet 等
- 自动网络检测（BSC Testnet/Mainnet）
- 错误提示与状态管理

#### 3. SIWE 登录流程
- **流程**: 连接钱包 → 获取 nonce → 签名消息 → 后端验证 → 获取 JWT
- **安全性**: EIP-4361 标准签名，防重放攻击
- **持久化**: JWT 和用户信息存储到 localStorage
- **自动恢复**: 刷新页面后自动恢复登录状态

#### 4. 登出功能
- 清除 localStorage（JWT、用户数据）
- 清除 WalletConnect 缓存（wc@2:*, @reown, @w3m 等）
- 断开钱包连接
- 重置全局状态

#### 5. 响应式设计
- Tailwind CSS 样式系统
- 移动端优先设计
- 深色主题（#0F111A 背景）

### ⚪ 待开发功能

#### Issue #34: 产品列表页（`/products`）
- 从 API 获取 SKU 列表
- 展示保险产品卡片（名称、保费、保额、期限）
- 选择产品 → 跳转到购买流程

#### Issue #35: 保单购买流程（`/policy/create`）
- 填写保险信息表单（保额、受益人等）
- 签署电子合同（personal_sign）
- 支付保费（BEP-20 USDT 转账）
- 创建保单草稿 → 提交审核

#### Issue #36: 保单详情页（`/policy/:id`）
- 展示保单信息（状态、保额、保费、期限）
- 承保倒计时（90 天）
- 支付状态与交易哈希
- 合同下载

---

## 🔧 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14 (App Router) | React 框架 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 3.x | 样式系统 |
| Reown AppKit | Latest | 钱包连接（前身 WalletConnect） |
| Ethers.js | 6.x | 以太坊交互 |
| Zustand | Latest | 状态管理 |
| TanStack Query | Latest | 数据获取（计划中） |

---

## 🛠️ 开发指南

### 代码规范

遵循 [CLAUDE.md](../../CLAUDE.md) 和 [CODEX.md](../../CODEX.md) 规范：

- **文件命名**: kebab-case（`use-siwe-auth.ts`）
- **组件**: PascalCase（`ConnectPage.tsx`）
- **Hooks**: camelCase with `use` prefix（`useSiweAuth`）
- **严格类型**: 所有函数和变量都要明确类型
- **注释**: 使用 JSDoc 风格

### 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器（端口 3030）

# 构建
pnpm build            # 生产环境构建
pnpm start            # 启动生产服务器

# 代码检查
pnpm lint             # ESLint 检查
pnpm type-check       # TypeScript 类型检查
```

### 调试技巧

1. **查看浏览器控制台**: 所有日志都以 `[ComponentName]` 前缀
2. **检查 localStorage**:
   - `auth_jwt_token` - JWT 令牌
   - `auth_user_data` - 用户信息
   - `wc@2:*` - WalletConnect 会话
3. **网络检查**: 使用 DevTools Network 标签查看 API 请求

---

## 🔐 安全最佳实践

1. **环境变量**:
   - ✅ 使用 `NEXT_PUBLIC_` 前缀暴露到浏览器
   - ❌ 绝不在前端存储私钥或敏感数据
   - ✅ 生产环境使用 HTTPS

2. **SIWE 签名**:
   - ✅ 每次登录都从后端获取新 nonce
   - ✅ 签名消息包含 domain, uri, chainId 防止钓鱼
   - ✅ JWT 有效期 15 分钟，减少被盗用风险

3. **钱包交互**:
   - ✅ 所有签名操作都需要用户确认
   - ✅ 不自动切换网络，仅提示用户手动切换
   - ✅ 清晰展示签名内容

---

## 📊 API 集成

### 认证 API

**获取 Nonce**:
```typescript
POST /auth/siwe/nonce
Body: { walletAddress: "0x..." }
Response: { nonce: "abc123..." }
```

**验证签名**:
```typescript
POST /auth/siwe/verify
Body: {
  message: "localhost wants you to sign in...",
  signature: "0xabc...",
  walletAddress: "0x..."
}
Response: {
  accessToken: "eyJhbG...",
  user: { id: "...", walletAddress: "0x..." }
}
```

### 产品 API（计划中）

```typescript
GET /sku
Response: [{
  id: "...",
  name: "BSC USDT Insurance",
  chainId: 97,
  tokenAddress: "0x...",
  termDays: 90,
  minPremium: "100.0",
  maxCoverage: "10000.0"
}]
```

---

## 🐛 常见问题

### Q: "Invalid SIWE message format" 错误？
**A**: 确保 `siweUtil.ts` 中的消息格式与后端完全一致，特别是 `statement` 字段（应为可选）。

### Q: 钱包连接后自动打开 MetaMask？
**A**: 检查 `handleConnectWallet` 是否直接调用 `open()`，避免使用 `window.ethereum.request()` 触发钱包。

### Q: 刷新页面后丢失登录状态？
**A**: 检查 `authStore.ts` 的 `persist` 配置，确保 localStorage 正确保存。

### Q: 网络切换后无法登录？
**A**: 确保 `.env.local` 中的 `NEXT_PUBLIC_CHAIN_ID` 与钱包当前网络一致。

---

## 🔗 相关文档

- [API 后端文档](../api/README.md)
- [项目状态追踪](../../docs/project_state.md)
- [开发日志](../../docs/CHANGELOG.md)
- [AI 协作规范](../../CLAUDE.md)

---

## 📝 更新日志

### 2025-01-15 - v0.2.0 初始版本

**已完成**:
- ✅ Next.js 14 项目初始化
- ✅ Reown AppKit 集成
- ✅ SIWE 完整登录流程
- ✅ 智能路由与认证守卫
- ✅ Logout 功能
- ✅ 响应式 UI 设计

**下一步**:
- ⚪ 实现产品列表页
- ⚪ 实现保单购买流程
- ⚪ 实现保单详情与倒计时

---

**开发者**: Samztz
**联系方式**: 查看项目 GitHub Issues
