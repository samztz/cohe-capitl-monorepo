# 🧭 Project State - Cohe Capital 项目状态追踪

> **MVP 版本**: v0.2.0
> **最后更新**: 2025-11-16 (Admin 数据完整性修复完成)
> **管理工具**: Claude Code 自动同步
> **协作规划**: ChatGPT (Epic 设计) + Claude Code (实现)
> **协作规则**: 详见 [CLAUDE.md](../CLAUDE.md) 第 11 章
> **重要变更**: ⚠️ **项目已从 Mobile 转向 Web** - Mobile 端暂停开发，专注于 Next.js Web DApp

**说明**: 本文件记录项目的整体进度和任务状态。每次完成功能模块后，Claude Code 会自动更新此文件和 [CHANGELOG.md](./CHANGELOG.md)。

---

## 🏁 项目总览

| Epic                          | 描述                                        | 状态      | 进度       | 截止日期       |
| ----------------------------- | ------------------------------------------- | --------- | ---------- | -------------- |
| **E1. 后端基础与认证**        | NestJS + Prisma + SIWE 登录与 JWT 鉴权      | ✅ 100%   | 4/4 完成   | 2025-10-28     |
| **E2. 保单购买闭环**          | Products / Policy / Payment / Admin 模块    | ✅ 100%   | 10/10 完成 | 2025-11-15     |
| **E3. ~~Mobile DApp~~** (已废弃) | ~~React Native (Expo) 移动端~~ ⚠️ 已暂停    | 🔴 废弃   | 3/6 (暂停) | -              |
| **E4. 前端 Web DApp**         | Next.js 14 Web 应用（钱包登录 + 保单购买）   | 🟡 80%    | 4/5 完成   | 2025-01-20     |
| **E5. 前后端联调与测试**      | E2E 测试 / API 对接 / Bug 修复              | ⚪ 0%      | 0/4 完成   | 2025-01-25     |
| **E6. 部署与演示环境**        | Docker / CI/CD / Staging 部署               | ⚪ 0%      | 0/4 完成   | 2025-01-30     |
| **E7. Admin 审核前端**        | Next.js Web Admin Panel 保单审核与管理      | ✅ 100%   | 8/8 完成   | 2025-11-15     |

---

## ⚙️ Epic 1：后端基础与认证（NestJS + SIWE）

**目标**：搭建 NestJS 后端骨架，集成 Prisma ORM，实现 SIWE 钱包登录与 JWT 鉴权。

**状态**: ✅ 100% 完成 (4/4 任务完成)

### Issues

| ID     | 子任务                                              | 状态   | Owner  | 完成时间       |
| ------ | --------------------------------------------------- | ------ | ------ | -------------- |
| #1     | 初始化项目骨架（NestJS + Fastify + Swagger）         | ✅ 完成 | Samztz | 2024-10-24     |
| #2     | 集成 Prisma + PostgreSQL                            | ✅ 完成 | Samztz | 2024-10-24     |
| #3     | 实现 SIWE 登录（/auth/siwe/nonce + verify）         | ✅ 完成 | Samztz | 2024-10-24     |
| #4     | JWT 鉴权 + 用户表                                   | ✅ 完成 | Samztz | 2024-10-25     |

---

## 🛒 Epic 2：保单购买闭环（无合约）

**目标**：实现从产品选择到支付确认的完整业务流程，支持 Admin 审核与倒计时。

**状态**: ✅ 100% 完成 (10/10 任务完成)

### Issues

| ID     | 子任务                                              | 状态     | Owner  | 完成时间       |
| ------ | --------------------------------------------------- | -------- | ------ | -------------- |
| #5     | 建立 Products 模块（Mock + CRUD）                   | ✅ 完成   | Samztz | 2024-10-25     |
| #6     | Policy 模块：创建与查询保单                         | ✅ 完成   | Samztz | 2024-10-26     |
| #7     | Policy 签署接口                                     | ✅ 完成   | Samztz | 2024-10-26     |
| #8     | 支付模块（模拟支付 / 链上验证）                     | ✅ 完成   | Samztz | 2024-10-26     |
| #9     | Admin 审核接口                                      | ✅ 完成   | Samztz | 2025-10-27     |
| #10    | 倒计时接口                                          | ✅ 完成   | Samztz | 2025-10-27     |
| #11    | Policy 状态机迁移（枚举 + paymentDeadline）         | ✅ 完成   | Samztz | 2025-11-15     |
| #12    | GET /policy/:id 接口 + PolicyResponseDto 枚举对齐   | ✅ 完成   | Samztz | 2025-11-15     |
| #13    | Admin 审核 API 改为"先审核再支付"                   | ✅ 完成   | Samztz | 2025-11-15     |
| #14    | Payment 确认 API 限制 + 激活策略                    | ✅ 完成   | Samztz | 2025-11-15     |

---

## 📱 Epic 3：~~前端 Mobile DApp（React Native）~~ ⚠️ **已废弃**

**状态**: 🔴 **废弃** - 项目已转向 Web，Mobile 端暂停开发

**原目标**：在 Expo 环境下实现完整的 UI 演示流。

**已完成功能** (保留作为参考):
- ✅ Expo 项目初始化（TypeScript + React Navigation）
- ✅ WalletConnect v2 集成（@reown/appkit-react-native）
- ✅ SIWE 完整登录流程
- ✅ Auth Store 全局状态管理（Zustand）
- ✅ ConnectScreen UI（多状态支持）

**废弃原因**:
- Web 端更易于开发和部署
- 用户可直接通过浏览器访问，无需下载 APP
- 钱包集成在 Web 端更成熟（Reown AppKit React）

**代码保留**: `apps/mobile/` 目录保留作为参考，但不再维护

---

## 🌐 Epic 4：前端 Web DApp（Next.js 14）

**目标**：构建 Next.js 14 Web 应用，实现完整的用户端保险购买流程（替代 Mobile 端）。

**状态**: 🟡 83.3% 完成 (5/6 任务完成)

### Issues

| ID     | 子任务                                              | 状态     | Owner  | 完成时间       |
| ------ | --------------------------------------------------- | -------- | ------ | -------------- |
| #32    | 初始化 Web 项目结构（Next.js 14 + TypeScript）       | ✅ 完成   | Samztz | 2025-01-15     |
| #33    | 集成 Reown AppKit React + SIWE 登录 + 路由保护      | ✅ 完成   | Samztz | 2025-01-15     |
| #34    | 产品列表页（/products）真实 API 对接 + 适配器       | ✅ 完成   | Samztz | 2025-11-15     |
| #35    | 保单表单页（/policy/form）完整重构 + 真实 API      | ✅ 完成   | Samztz | 2025-11-15     |
| #37    | 合同签署页（/policy/contract-sign）钱包签名 + 状态流转 | ✅ 完成 | Samztz | 2025-11-15     |
| #36    | 保单详情页（/policy/:id）+ 倒计时                   | ⚪ 待做   | Samztz | -              |

**已完成功能**:
- ✅ Next.js 14 (App Router) + TypeScript 完整项目结构
- ✅ Tailwind CSS 样式系统
- ✅ Reown AppKit React 钱包连接集成
- ✅ SIWE 完整登录流程（apps/web/src/hooks/useSiweAuth.ts）
- ✅ Auth Store 全局状态管理（Zustand + localStorage）
- ✅ 智能路由（/ → 自动跳转到 /auth/connect）
- ✅ **全站路由保护系统**（useRequireAuth Hook）- **已完善** 🆕
  - ✅ 根路由（/）服务端重定向到 /auth/connect（零延迟，bundle size -92%）
  - ✅ /auth/connect 三态分流逻辑完善（已连接未登录 / 已登录未连接 / 已登录已连接）
  - ✅ 全部受保护页面统一使用 useRequireAuth 钩子：
    - `/dashboard` - 仪表板
    - `/products` - 产品列表页
    - `/my-policies` - 我的保单页
    - `/policy/form/[productId]` - 保单表单页
    - `/policy/contract-sign/[policyId]` - 合同签署页
    - `/policy/detail/[id]` - 保单详情页
    - `/policy/success/[policyId]` - 购买成功页
  - ✅ 未登录自动重定向到 /auth/connect
  - ✅ Loading 状态避免 UI 闪烁
  - ✅ 统一的 Loading 界面样式
- ✅ 钱包连接页面（/auth/connect）- **已优化**
  - Connect Wallet 按钮
  - 网络检测（BSC Testnet/Mainnet）
  - **自动 SIWE 登录**（钱包已连接时）
  - 已登录时立即跳转 Dashboard
  - 错误提示与状态管理
- ✅ Logout 功能（清除认证缓存 + 断开钱包）
- ✅ 环境变量配置（.env.local + .env.production.example）

**技术栈**:
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Reown AppKit React (@reown/appkit/react)
- Zustand (状态管理)
- Ethers.js v6
- React Query (数据获取)

**最新完成** (2025-11-15):
- ✅ **保单表单页完整重构**（Issue #35）
  - ✅ 9 个核心问题全部修复
  - ✅ 钱包地址自动填充（从 authStore，只读）
  - ✅ 字段命名修正（Insurance Amount vs Cost）
  - ✅ 币种单位 + Max 动态显示（取自真实 API）
  - ✅ 完整表单验证（react-hook-form + zod）
  - ✅ Overview 实时同步（watch + 费率计算）
  - ✅ UI 对齐设计稿（spacing、border、color）
  - ✅ 真实 API 接入（GET /products + POST /policy）
  - ✅ Loading Skeleton（避免 UI 闪烁）
  - ✅ 跳转签署页携带 query（coverage/period/symbol/premium）

- ✅ 产品列表页真实 API 对接（Issue #34）
  - 后端字段适配器（premiumAmt/coverageAmt → premiumAmount/coverageAmount）
  - TanStack Query 数据获取
  - Loading/Error/Empty 三态 UI
  - 跳转链接携带产品信息参数

**下一步**:
- ⚪ 实现保单详情页与倒计时（Issue #36）
- ⚪ 完善签署页接收 query 参数（M3-P3）

---

## 🧪 Epic 5：前后端联调与测试

**目标**：建立完整的测试体系，确保前后端接口对接顺畅。

**状态**: ⚪ 0% 完成 (0/4 任务完成)

### Issues

| ID     | 子任务                                              | 状态   | Owner  | 完成时间       |
| ------ | --------------------------------------------------- | ------ | ------ | -------------- |
| #17    | Swagger → Postman 导出测试集                        | ⚪ 待做 | Samztz | -              |
| #18    | E2E 测试（supertest + Jest）                        | ⚪ 待做 | Samztz | -              |
| #19    | Web DApp 与 API 接口对接                            | ⚪ 待做 | Samztz | -              |
| #20    | Bug 修复与稳定性优化                                | ⚪ 待做 | Samztz | -              |

---

## ☁️ Epic 6：部署与演示环境（Infra）

**目标**：建立可部署的最小化运行环境，支持演示与测试。

**状态**: ⚪ 0% 完成 (0/4 任务完成)

### Issues

| ID     | 子任务                                              | 状态   | Owner  | 完成时间       |
| ------ | --------------------------------------------------- | ------ | ------ | -------------- |
| #21    | Dockerfile 与 docker-compose.yml                    | ⚪ 待做 | Samztz | -              |
| #22    | CI/CD（GitHub Actions）                             | ⚪ 待做 | Samztz | -              |
| #23    | Staging 环境部署（Vercel + Railway）                | ⚪ 待做 | Samztz | -              |
| #24    | Demo 演示版打包（Web 前端 + 后端）                   | ⚪ 待做 | Samztz | -              |

---

## 🖥️ Epic 7：Admin 审核前端（Web Admin Panel）

**目标**：构建 Next.js 管理后台，实现保单审核、状态追踪与数据可视化功能。

**状态**: ✅ 100% 完成 (8/8 任务完成)

### Issues

| ID     | 子任务                                              | 状态    | Owner  | 完成时间       |
| ------ | --------------------------------------------------- | ------- | ------ | -------------- |
| #25    | 初始化 Admin Web 项目结构                           | ✅ 完成 | Samztz | 2025-10-30     |
| #26    | 实现 Admin 登录页（JWT 鉴权）                       | ✅ 完成 | Samztz | 2025-10-30     |
| #27    | 创建保单审核列表页                                  | ✅ 完成 | Samztz | 2025-10-30     |
| #28    | 审核详情页                                          | ✅ 完成 | Samztz | 2025-10-30     |
| #29    | 审核通过/拒绝操作                                   | ✅ 完成 | Samztz | 2025-10-30     |
| #30    | 保单状态追踪页                                      | ✅ 完成 | Samztz | 2025-10-30     |
| #31    | 数据可视化模块（可选）                              | ✅ 完成 | Samztz | 2025-10-30     |
| #32    | 任务 M2：API 修补 + Deadline UI + i18n + 真实后端对接 | ✅ 完成 | Samztz | 2025-11-15     |

---

## 🧩 附加元信息

```yaml
project_name: cohe-capitl
version: 0.2.0
architecture: Web (Primary) + Admin (Management)
deadline: 2025-01-30
repository: https://github.com/samztz/cohe-capitl-monorepo
project_manager: Samztz
ai_agents:
  - ChatGPT: 架构规划 / Epic 设计 / 文档维护
  - Claude Code: 代码实现 / 测试 / 文档同步
  - Human: Samztz（工程主导者）
update_policy: Claude Code 自动同步 project_state.md 和 CHANGELOG.md
```

---

## 🧠 更新规则

**Claude Code 自动更新规则** (详见 [CLAUDE.md](../CLAUDE.md) 第 11 章):

1. ✅ 每次完成功能模块，在 [CHANGELOG.md](./CHANGELOG.md) 顶部添加详细条目
2. ✅ 更新对应 Epic 下的任务状态（⚪ 待做 → 🟡 进行中 → ✅ 完成）
3. ✅ 更新项目总览表格中的进度百分比
4. ✅ 更新"最后更新"时间戳
5. ✅ 如果 Epic 全部完成，更新 CHANGELOG.md 统计数据

**状态图例**:
- ⚪ 待做 - 未开始
- 🟡 进行中 - 正在实现
- ✅ 完成 - 已完成并测试通过
- 🔴 废弃 - 已暂停或废弃

---

## 📊 整体进度总结

| 状态       | Epic 数量 | Issue 数量 | 完成率     |
| ---------- | --------- | ---------- | ---------- |
| ✅ 完成     | 3         | 23         | 63.9%      |
| 🟡 进行中   | 1         | 1          | 2.8%       |
| ⚪ 待做     | 2         | 8          | 22.2%      |
| 🔴 废弃     | 1         | 4          | 11.1%      |
| **总计**   | **7**     | **37**     | **70.3%**  |

**说明**：
- 完成率 = (已完成 Issue 数量 + 已完成 Epic 的部分进度) / 总 Issue 数量
- Epic 1（后端基础）: ✅ 100% 完成（4/4 Issues）
- Epic 2（保单购买闭环）: ✅ 100% 完成（10/10 Issues）
- Epic 7（Admin 前端）: ✅ 100% 完成（8/8 Issues）+ 5 个 P0/P1 bug 修复
- Epic 4（Web DApp）: 🟡 83.3% 进行中（5/6 Issues）← 新增 Issue #37 合同签署页完成
- Epic 3（Mobile DApp）: 🔴 废弃（3/6 Issues 暂停）
- **当前优先级**: 完成 Epic 4 (Web DApp) Issue #36 保单详情页，开启前后端联调测试
- **最新进展**:
  - ✅ **Admin 数据完整性修复** - 修复 5 个关键 Bug（搜索、SKU 数据、统计 API、reviewerNote 字段、Schema 不匹配）（2025-11-16）
  - ✅ 合同签署页完整实现 + 钱包签名 + 状态流转完成（Issue #37, 2025-11-15）
  - ✅ Policy 表单页完整重构 + 9 个问题修复完成（Issue #35, 2025-11-15）
  - ✅ Products 页面真实 API 对接 + 适配器完成（Issue #34, 2025-11-15）
  - ✅ Payment 确认 API 限制 + 激活策略完成（Issue #14, 2025-11-15）
  - ✅ Admin 审核 API 改为"先审核再支付"完成（Issue #13, 2025-11-15）
  - ✅ GET /policy/:id 接口 + DTO 枚举对齐完成（Issue #12, 2025-11-15）

---

**参考文档**:
- [CHANGELOG.md](./CHANGELOG.md) - 详细开发日志
- [CLAUDE.md](../CLAUDE.md) - AI 协作规范
- [apps/api/README.md](../apps/api/README.md) - API 文档
- [apps/web/README.md](../apps/web/README.md) - Web DApp 文档
