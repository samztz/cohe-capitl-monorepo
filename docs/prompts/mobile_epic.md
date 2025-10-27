太好了，samztz！我们从 **apps/mobile 为空目录** 开始，按你认可的“任务卡”风格，一条条把 Mobile DApp 跑起来。
下面是 **Issue #11 ~ #19** 的提示词，你可以逐条复制给 Claude Code / Codex 执行和验收。

---

## Epic：前端 Mobile DApp（React Native / Expo）

---

### **Issue 11 — 初始化 Expo RN 项目结构（TypeScript）**

#### Goal

在 `apps/mobile` 下初始化 Expo + TypeScript 项目，配置必要依赖与脚本。

#### Scope

* 在 `apps/mobile` 内初始化（保持 monorepo 兼容）
* 安装依赖：

  * Navigation：`@react-navigation/native` `@react-navigation/native-stack` `react-native-screens` `react-native-safe-area-context`
  * UI：`react-native-paper`
  * 状态/数据：`zustand` `@tanstack/react-query` `axios`
  * 表单/验证：`react-hook-form` `zod` `@hookform/resolvers`
  * 工具：`dayjs`
* 新增脚本：

  * `pnpm --filter @app/mobile dev`（或在根 package.json 配置 workspace script）
* 生成 `.env.example`（Expo 用 `app.config.*` 读取）：

  * `EXPO_PUBLIC_API_BASE="http://192.168.0.xxx:3001/api/v1"`
  * `EXPO_PUBLIC_CHAIN_ID="97"`

#### Acceptance

* `pnpm --filter @app/mobile dev` 可成功启动（在手机 Expo Go 预览）
* TypeScript 编译无错误
* 生成基础 `src/` 目录

#### Prompt for Claude/Codex

```
Task: Initialize Expo React Native app in apps/mobile with TypeScript.

Scope:
- Create apps/mobile using Expo (blank-typescript).
- Add deps: @react-navigation/native, @react-navigation/native-stack, react-native-screens, react-native-safe-area-context, react-native-paper, zustand, @tanstack/react-query, axios, react-hook-form, zod, @hookform/resolvers, dayjs
- Add scripts to run with pnpm workspace.
- Create .env.example and app config reading EXPO_PUBLIC_API_BASE, EXPO_PUBLIC_CHAIN_ID.

Acceptance:
- pnpm --filter @app/mobile dev starts the app
- TS compiles
- src/ folder present

Commit: feat(mobile): initialize Expo TS app (#11)
```

---

### **Issue 12 — App Shell & 主题 / 路由骨架**

#### Goal

搭建 Provider 外壳（Paper、React Query）、路由骨架与 7 个页面占位。

#### Scope

* 目录结构：

  ```
  apps/mobile/src/
    screens/
      ConnectWalletScreen.tsx
      ProductListScreen.tsx
      PolicyFormScreen.tsx
      ContractSignScreen.tsx
      PayScreen.tsx
      TicketScreen.tsx
      PolicyStatusScreen.tsx
    components/
      AppCard.tsx
      AppButton.tsx
    stores/
      auth.ts
      policy.ts
    lib/
      api.ts
      navigation.ts
    theme/
      index.ts
  ```
* 在 `App.tsx`：

  * 包裹 `PaperProvider`、`QueryClientProvider`
  * 配置 `NavigationContainer` + `createNativeStackNavigator`
  * `initialRouteName="Connect"`
* 主题：在 `theme/index.ts` 定义主色/圆角/阴影，注入到 `PaperProvider`

#### Acceptance

* App 可运行，能在 7 个空白页面间导航
* 全局按钮/卡片组件可用（简单样式）

#### Prompt for Claude/Codex

```
Task: Build app shell with providers and navigation, create 7 screen stubs.

Scope:
- Add providers: PaperProvider, QueryClientProvider
- Implement native stack navigator with routes:
  Connect → Products → PolicyForm → ContractSign → Pay → Ticket → PolicyStatus
- Create theme tokens in src/theme/index.ts and wire to PaperProvider
- Add simple AppCard/AppButton components

Acceptance:
- All screens render as placeholders and are navigable
- Theme applied to Paper components

Commit: feat(mobile): app shell + navigation skeleton (#12)
```

---

### **Issue 13 — 鉴权与钱包（先 Mock 登录）**

#### Goal

实现“连接钱包/登录”页面：初期使用 Mock 地址登录（后续再接 WalletConnect / SIWE）。

#### Scope

* `stores/auth.ts`：

  * `address?: string`, `jwt?: string`, `setAuth()`, `clear()`
  * 使用 `zustand` + `persist`（`expo-secure-store` 可后续加）
* `lib/api.ts`：

  * `axios.create({ baseURL: process.env.EXPO_PUBLIC_API_BASE })`
  * 在有 `jwt` 时自动附加 `Authorization: Bearer <jwt>`
* `ConnectWalletScreen`：

  * “一键模拟登录”按钮：设置 `address` 为固定 0xmock… 并跳转到 `Products`
  * 预留 TODO：接入 SIWE（/auth/siwe/nonce + /auth/siwe/verify）

#### Acceptance

* 点击“模拟登录”后能进入产品列表页
* 全局 `auth` store 生效，`api.ts` 能读取 `jwt`（即使此刻为空）

#### Prompt for Claude/Codex

```
Task: Implement mock login flow.

Scope:
- Create src/stores/auth.ts using zustand (persist optional)
- Create src/lib/api.ts axios client that reads EXPO_PUBLIC_API_BASE and attaches Authorization if jwt present
- In ConnectWalletScreen: add a "Mock Login" button that sets address (e.g., 0x1111...) and navigates to Products
- Leave TODO comments for SIWE integration

Acceptance:
- Mock login navigates to Products
- axios instance created and reusable

Commit: feat(mobile): mock auth store and api client (#13)
```

---

### **Issue 14 — 产品列表页（绑定 /products）**

#### Goal

展示保险 SKU 列表，点击进入信息表单页。

#### Scope

* `ProductListScreen`：

  * 使用 `react-query` 调 `GET /products`
  * 卡片展示：名称、保费（字符串）、天数
  * 点击卡片：`navigate('PolicyForm', { productId })`
* `types`：定义 `Product` 接口

#### Acceptance

* 空态/加载/错误态处理
* 能加载出至少 3 个 SKU
* 跳转带上 `productId`

#### Prompt for Claude/Codex

```
Task: Implement ProductListScreen and bind to GET /products.

Scope:
- Define Product type
- Use react-query to fetch from /products
- Render cards with name, premium, term days
- On press navigate to PolicyForm with productId

Acceptance:
- Loading/error states handled
- 3+ SKUs render
- Navigation passes productId

Commit: feat(mobile): product list screen (#14)
```

---

### **Issue 15 — 信息表单页（创建保单 /policy）**

#### Goal

用户填写购买信息并创建保单草稿，拿到 `policyId` 并进入签约页。

#### Scope

* `PolicyFormScreen`：

  * 表单字段（示例）：姓名、邮箱、手机号、同意条款
  * `react-hook-form + zod` 校验
  * 点击提交：`POST /policy`（body 至少包含 `skuId`；如果后端需要更多字段按 README 对齐）
  * 成功返回 `policyId`，`navigate('ContractSign', { policyId })`
* `stores/policy.ts`：缓存 `currentPolicyId`, `currentProduct`

#### Acceptance

* 表单验证提示友好
* 成功创建后能拿到 `policyId` 并流转

#### Prompt for Claude/Codex

```
Task: Implement PolicyFormScreen for creating draft policy.

Scope:
- Build form with react-hook-form + zod (name/email/phone/terms)
- On submit call POST /policy with skuId (from route params) and optional form data
- On success navigate to ContractSign with policyId
- Add minimal policy store to hold current policy id/product

Acceptance:
- Validation works
- Draft policy created and policyId obtained
- Navigation continues

Commit: feat(mobile): policy form + create draft (#15)
```

---

### **Issue 16 — 电子合同签署页（/policy/contract-sign）**

#### Goal

展示合同摘要，生成 `contractPayload`，模拟签名并提交签署。

#### Scope

* `ContractSignScreen`：

  * 展示合约摘要（包含产品名、费率、保障期、用户表单信息）
  * `contractPayload = { product, user, createdAt }`
  * 先使用 **Mock 签名**（`userSig = "0xsigned-mock"`）
  * `POST /policy/contract-sign` → body: `{ policyId, contractPayload, userSig }`
  * 成功后进入 `Pay`

#### Acceptance

* 能正确提交签名请求并得到成功响应
* 页面留有 TODO：后续接入钱包 `personal_sign`

#### Prompt for Claude/Codex

```
Task: Implement contract sign screen.

Scope:
- Build ContractSignScreen that shows a summary of contract info
- Create contractPayload JSON, use a mock signature "0xsigned-mock"
- Call POST /policy/contract-sign with { policyId, contractPayload, userSig }
- On success navigate to Pay

Acceptance:
- API call succeeds
- Navigation continues to Pay
- TODO left for wallet-based personal_sign

Commit: feat(mobile): contract sign screen (#16)
```

---

### **Issue 17 — 支付页（模拟支付 + /payment/confirm）**

#### Goal

模拟 USDT 支付并回填交易哈希，完成支付确认。

#### Scope

* `PayScreen`：

  * 显示需支付金额（从产品或 policy 获取）
  * 按钮“模拟支付成功” → 生成假 `txHash = 0xpaymock…`
  * `POST /payment/confirm` → `{ policyId, txHash }`
  * 成功后 `navigate('Ticket', { policyId })`
* 留 TODO：后续 WalletConnect + ethers 集成真实转账

#### Acceptance

* 成功调用确认 API，状态切换到 `under_review`（由后端实现）
* 支持失败重试与错误提示

#### Prompt for Claude/Codex

```
Task: Implement payment screen with simulated transfer and confirmation.

Scope:
- Show premium amount, provide "Simulate Pay" button
- Generate mock txHash and call POST /payment/confirm { policyId, txHash }
- On success navigate to Ticket

Acceptance:
- Confirmation API succeeds
- Errors surfaced with friendly toasts
- TODO added for WalletConnect + ethers

Commit: feat(mobile): simulated payment + confirm (#17)
```

---

### **Issue 18 — 工单页（待审核）**

#### Goal

展示“工单已生成 / 待审核”，引导用户前往状态页。

#### Scope

* `TicketScreen`：

  * 展示 `policyId`、当前状态 `under_review` 的说明
  * 按钮“查看承保状态” → `navigate('PolicyStatus', { policyId })`

#### Acceptance

* UI 清晰，包含返回入口和状态说明
* 跳转状态页正常

#### Prompt for Claude/Codex

```
Task: Implement ticket screen for under_review state.

Scope:
- Render policyId and message "Pending review"
- Button navigates to PolicyStatus with policyId

Acceptance:
- Screen renders clearly
- Navigation to PolicyStatus works

Commit: feat(mobile): ticket screen (#18)
```

---

### **Issue 19 — 承保状态页（倒计时 /policy/:id & /policy/:id/countdown）**

#### Goal

查询保单详情与倒计时接口，展示承保状态与剩余时间。

#### Scope

* `PolicyStatusScreen`：

  * 并行请求：

    * `GET /policy/:id`（拿 status/startAt/endAt）
    * `GET /policy/:id/countdown`（拿 `daysRemaining/secondsRemaining`）
  * UI：

    * `status` 徽章（active/under_review/rejected/expired）
    * 倒计时读秒（`setInterval` 或每 1s 计算剩余秒）
  * `Pull to refresh` 刷新状态

#### Acceptance

* `active` 时显示倒计时并递减
* `under_review` 显示提示文案
* `expired` 时倒计时为 0 且标红

#### Prompt for Claude/Codex

```
Task: Implement policy status screen with countdown.

Scope:
- Fetch GET /policy/:id and GET /policy/:id/countdown
- Show status badge and a dynamic countdown from secondsRemaining
- Provide pull-to-refresh and retry

Acceptance:
- Active policies show ticking countdown
- Under_review and expired states render correct UI
- Robust to API errors

Commit: feat(mobile): policy status screen + countdown (#19)
```

---

如果你愿意，我可以把这些 Issue 直接整理为一个 `docs/prompts/mobile_epic.md`，你就能在 VSCode 一边点、一边复制给 Claude，用最少的切换时间完成开发。
需要的话告诉我“生成文件版”，我马上给你。
