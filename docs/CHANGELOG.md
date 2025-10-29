# 📝 CHANGELOG - Cohe Capital 开发日志

> **规则**：每次完成一个功能模块（task）后，Claude Code 必须在此文件顶部添加新条目，记录完成时间、功能、相关文件和注意事项。

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
