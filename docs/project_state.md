# 🧭 Project State - Cohe Capital 项目状态追踪

> **MVP 版本**: v0.1.0
> **最后更新**: 2025-10-30 16:45
> **管理工具**: Claude Code 自动同步
> **协作规划**: ChatGPT (Epic 设计) + Claude Code (实现)
> **协作规则**: 详见 [CLAUDE.md](../CLAUDE.md) 第 11 章

**说明**: 本文件记录项目的整体进度和任务状态。每次完成功能模块后，Claude Code 会自动更新此文件和 [CHANGELOG.md](./CHANGELOG.md)。

---

## 🏁 项目总览

| Epic                          | 描述                                        | 状态      | 进度       | 截止日期       |
| ----------------------------- | ------------------------------------------- | --------- | ---------- | -------------- |
| **E1. 后端基础与认证**        | NestJS + Prisma + SIWE 登录与 JWT 鉴权      | ✅ 100%   | 4/4 完成   | 2025-10-28     |
| **E2. 保单购买闭环**          | Products / Policy / Payment / Admin 模块    | ✅ 100%   | 6/6 完成   | 2025-10-30     |
| **E3. 前端 Mobile DApp**      | React Native (Expo) 移动端 UI 与钱包集成    | 🟡 33.3%  | 2/6 完成   | 2025-11-05     |
| **E4. 前后端联调与测试**      | E2E 测试 / API 对接 / Bug 修复              | ⚪ 0%      | 0/4 完成   | 2025-11-07     |
| **E5. 部署与演示环境**        | Docker / CI/CD / Staging 部署               | ⚪ 0%      | 0/4 完成   | 2025-11-10     |
| **E6. Admin 审核前端**        | Next.js Web Admin Panel 保单审核与管理      | ✅ 100%   | 7/7 完成   | 2025-10-30     |

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

**已完成功能**:
- ✅ NestJS 11 + Fastify 适配器
- ✅ Swagger API 文档自动生成（http://localhost:3001/api）
- ✅ Prisma ORM + PostgreSQL 数据库
- ✅ SIWE 以太坊钱包登录（EIP-4361）
- ✅ JWT 鉴权守卫 + `/auth/siwe/me` 接口
- ✅ User 数据模型（walletAddress + nonce）

---

## 🛒 Epic 2：保单购买闭环（无合约）

**目标**：实现从产品选择到支付确认的完整业务流程，支持 Admin 审核与倒计时。

**状态**: ✅ 100% 完成 (6/6 任务完成)

### Issues

| ID     | 子任务                                              | 状态     | Owner  | 完成时间       |
| ------ | --------------------------------------------------- | -------- | ------ | -------------- |
| #5     | 建立 Products 模块（Mock + CRUD）                   | ✅ 完成   | Samztz | 2024-10-25     |
| #6     | Policy 模块：创建与查询保单                         | ✅ 完成   | Samztz | 2024-10-26     |
| #7     | Policy 签署接口                                     | ✅ 完成   | Samztz | 2024-10-26     |
| #8     | 支付模块（模拟支付 / 链上验证）                     | ✅ 完成   | Samztz | 2024-10-26     |
| #9     | Admin 审核接口                                      | ✅ 完成   | Samztz | 2025-10-27     |
| #10    | 倒计时接口                                          | ✅ 完成   | Samztz | 2025-10-27     |

**已完成功能**:
- ✅ GET /products - 获取活跃保险产品 SKU
- ✅ POST /policy - 创建保单草稿（pending 状态）
- ✅ POST /policy/contract-sign - 数字签名合同
- ✅ POST /payment/confirm - 链上支付验证（ethers v6 + BSC RPC）
- ✅ GET /admin/policies - 保单列表（分页 + 状态过滤）
- ✅ PATCH /admin/policies/:id - 审核通过/拒绝（自动设置承保期）
- ✅ GET /policy/:id/countdown - 保单倒计时查询（秒级精度 + 过期检测）
- ✅ Prisma 数据模型（User, SKU, Policy, Payment）
- ✅ Policy 模型新增 startAt/endAt 字段（承保起止时间）
- ✅ 唯一约束：一个钱包 + 一个 SKU = 一个保单

**Epic 2 已全部完成** ✨ - 后端保单购买闭环功能已齐全，可支持前端集成

---

## 📱 Epic 3：前端 Mobile DApp（React Native）

**目标**：在 Expo 环境下实现完整的 UI 演示流，无需真实合约即可完整交互。

**状态**: 🟡 33.3% 完成 (2/6 任务完成)

### Issues

| ID     | 子任务                                              | 状态     | Owner  | 完成时间       |
| ------ | --------------------------------------------------- | -------- | ------ | -------------- |
| #11    | 初始化 RN 项目结构（Expo + EAS）                    | ✅ 完成   | Samztz | 2025-10-27     |
| #12    | 集成 WalletConnect / MetaMask 登录                  | ✅ 完成   | Samztz | 2025-10-30     |
| #13    | 产品列表页（绑定 /products API）                    | ⚪ 待做   | Samztz | -              |
| #14    | 保单详情页（/policies/:id）                         | ⚪ 待做   | Samztz | -              |
| #15    | 签署与支付交互流（mock 钱包签名）                   | ⚪ 待做   | Samztz | -              |
| #16    | 倒计时与状态展示页面                                | ⚪ 待做   | Samztz | -              |

**已完成功能**:
- ✅ Expo 项目初始化（TypeScript + React Navigation）
- ✅ 完整的 src/ 目录结构（components, screens, navigation, hooks, services, store, utils, types）
- ✅ WalletConnect v2 集成（@reown/appkit-react-native + Ethers 适配器）
- ✅ SIWE 完整登录流程（连接钱包 → 签名消息 → JWT 认证）
- ✅ Auth Store 全局状态管理（Zustand + expo-secure-store）
- ✅ ConnectScreen UI 多状态支持（未连接/连接中/签名中/已认证）
- ✅ 错误处理与用户反馈机制
- ✅ JWT 持久化与自动登录功能
- ✅ pnpm workspace 集成 (@cohe-capital/mobile)
- ✅ 所有核心依赖安装完成（react-navigation, zustand, react-query, react-hook-form, zod, react-native-paper等）
- ✅ 环境变量配置 (.env.example + app.config.ts)
- ✅ TypeScript 严格模式配置 + 路径别名
- ✅ `pnpm --filter mobile dev` 启动脚本验证通过
- ✅ **目录结构优化**: screens/ 按功能分类为 auth/, policy/, payment/ 子目录 (2025-10-29)
- ✅ **ConnectScreen UI 重构**: 完全匹配设计稿 `docs/designs/欢迎页面.png`，使用原生组件实现响应式布局 (2025-10-29)

**下一步**:
- ⚪ 集成 WalletConnect / MetaMask 登录（Issue #12）
- ⚪ 实现产品列表页（SKU 卡片 UI）
- ⚪ 构建保单详情页与倒计时组件

---

## 🧪 Epic 4：前后端联调与测试

**目标**：建立完整的测试体系，确保前后端接口对接顺畅。

**状态**: ⚪ 0% 完成 (0/4 任务完成)

### Issues

| ID     | 子任务                                              | 状态   | Owner  | 完成时间       |
| ------ | --------------------------------------------------- | ------ | ------ | -------------- |
| #17    | Swagger → Postman 导出测试集                        | ⚪ 待做 | Samztz | -              |
| #18    | E2E 测试（supertest + Jest）                        | ⚪ 待做 | Samztz | -              |
| #19    | Mobile DApp 与 API 接口对接                         | ⚪ 待做 | Samztz | -              |
| #20    | Bug 修复与稳定性优化                                | ⚪ 待做 | Samztz | -              |

**计划内容**:
- ⚪ 导出 Swagger 文档为 Postman Collection
- ⚪ 编写后端 E2E 测试（supertest + Jest）
- ⚪ 前后端 API 联调与数据格式验证
- ⚪ Bug 修复与性能优化

---

## ☁️ Epic 5：部署与演示环境（Infra）

**目标**：建立可部署的最小化运行环境，支持演示与测试。

**状态**: ⚪ 0% 完成 (0/4 任务完成)

### Issues

| ID     | 子任务                                              | 状态   | Owner  | 完成时间       |
| ------ | --------------------------------------------------- | ------ | ------ | -------------- |
| #21    | Dockerfile 与 docker-compose.yml                    | ⚪ 待做 | Samztz | -              |
| #22    | CI/CD（GitHub Actions）                             | ⚪ 待做 | Samztz | -              |
| #23    | Staging 环境部署（Railway/Render）                  | ⚪ 待做 | Samztz | -              |
| #24    | Demo 演示版打包（前端 + 后端 + Mock 钱包）          | ⚪ 待做 | Samztz | -              |

**计划内容**:
- ⚪ Docker 容器化（API + PostgreSQL）
- ⚪ GitHub Actions CI/CD 流程
- ⚪ Staging 环境部署（Railway 或 Render）
- ⚪ 打包移动端 APK/IPA 演示版

---

## 🖥️ Epic 6：Admin 审核前端（Web Admin Panel）

**目标**：构建 Next.js 管理后台，实现保单审核、状态追踪与数据可视化功能。

**状态**: ✅ 100% 完成 (7/7 任务完成)

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

**已完成功能**:
- ✅ Next.js 14 (App Router) + TypeScript 完整项目结构
- ✅ Tailwind CSS + shadcn/ui 组件库集成（Button, Card, Table, Dialog, Badge, Tabs, Select, Toast 等）
- ✅ 认证系统：Email/Password 登录（demo 模式，localStorage 存储）
- ✅ Dashboard 仪表盘：实时统计卡片（总保单数/待审核/今日通过/今日拒绝）
- ✅ 保单列表页：搜索（ID/钱包/邮箱）+ 筛选（按状态）+ 分页功能
- ✅ 审核队列页：专门的待审核保单视图，支持快捷审核按钮
- ✅ 保单详情页：Tabs 展示（Overview/Payments/Timeline），包含完整 Policy 信息
- ✅ 审核流程：对话框式 Approve/Reject + 备注，状态自动流转，Toast 通知
- ✅ Mock API Routes：使用 Next.js API Routes 实现本地 Mock（60 条随机测试数据）
- ✅ React Query 状态管理：请求缓存、自动刷新、乐观更新
- ✅ 完整的 Loading/Empty State 处理
- ✅ 响应式设计（移动端友好）
- ✅ 类型安全（Zod Schema 验证 + TypeScript 严格模式）
- ✅ 可切换 Mock/真实 API（通过 .env 配置）
- ✅ 完整文档（README.md + .env.example）

**技术栈**:
- Next.js 14 + TypeScript
- Tailwind CSS + shadcn/ui
- @tanstack/react-query (状态管理)
- Zod (数据验证)
- Day.js (日期处理)
- Lucide React (图标)

**API 端点**:
- `GET /api/admin/policies` - 保单列表（支持筛选/搜索/分页）
- `GET /api/admin/policies/:id` - 保单详情
- `PATCH /api/admin/policies/:id` - 审核操作（approve/reject）
- `GET /api/admin/stats` - 统计数据

**启动命令**:
```bash
cd apps/admin
pnpm install
pnpm dev  # 启动在 http://localhost:3002
```

**Demo 登录凭据**:
- Email: `admin@cohe.capital`
- Password: `admin123`

**Epic 6 已全部完成** ✨ - Web Admin 后台功能齐全，支持完整的保单管理和审核演示流程

---

## 🧩 附加元信息

```yaml
project_name: cohe-capitl
version: 0.1.0
deadline: 2025-11-05
repository: https://github.com/samztz/cohe-capitl-monorepo
project_manager: Samztz
ai_agents:
  - ChatGPT: 架构规划 / Epic 设计 / 文档维护
  - Claude Code: 代码实现 / 测试 / 文档同步
  - Codex: 自动化脚本生成与修复
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

---

## 📊 整体进度总结

| 状态       | Epic 数量 | Issue 数量 | 完成率     |
| ---------- | --------- | ---------- | ---------- |
| ✅ 完成     | 3         | 17         | 54.8%      |
| 🟡 进行中   | 1         | 4          | 12.9%      |
| ⚪ 待做     | 2         | 10         | 32.3%      |
| **总计**   | **6**     | **31**     | **54.8%**  |

**说明**：
- 完成率 = 已完成 Issue 数量 / 总 Issue 数量
- Epic 1（后端基础）: ✅ 100% 完成（4/4 Issues）
- Epic 2（保单购买闭环）: ✅ 100% 完成（6/6 Issues）
- Epic 6（Admin 前端）: ✅ 100% 完成（7/7 Issues）
- Epic 3（Mobile DApp）: 🟡 33.3% 进行中（2/6 Issues）
- 当前优先级：完成 Epic 3 剩余 Mobile 页面，开启前后端联调测试

---

**参考文档**:
- [CHANGELOG.md](./CHANGELOG.md) - 详细开发日志
- [CLAUDE.md](../CLAUDE.md) - AI 协作规范
- [apps/api/README.md](../apps/api/README.md) - API 文档
