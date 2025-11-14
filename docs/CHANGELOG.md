# 📝 CHANGELOG - Cohe Capital 开发日志

> **规则**：每次完成一个功能模块（task）后，Claude Code 必须在此文件顶部添加新条目，记录完成时间、功能、相关文件和注意事项。

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
