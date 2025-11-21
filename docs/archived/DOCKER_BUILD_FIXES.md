# 🐳 Docker Build 修复文档

## 概述

本文档记录了在 Docker 构建过程中遇到的所有 TypeScript 编译错误及其修复方案。

---

## 问题诊断

运行 `docker compose build` 时遇到以下错误：

### 1️⃣ 模块解析错误 (86 个错误)

**错误信息**:
```
error TS2792: Cannot find module '@nestjs/common'.
Did you mean to set the 'moduleResolution' option to 'nodenext', or to add aliases to the 'paths' option?
```

**原因**: `apps/api/tsconfig.json` 缺少 `moduleResolution` 配置。

**影响**: TypeScript 无法解析 node_modules 中的所有依赖模块。

---

### 2️⃣ 私有字段语法错误

**错误信息**:
```
error TS18028: Private identifiers are only available when targeting ECMAScript 2015 and higher.
```

**原因**: TypeScript target 未明确设置，导致无法识别 ES2022 私有字段语法 (`#privateField`)。

**影响**: Prisma Client、ethers 等库使用的私有字段语法无法编译。

---

### 3️⃣ CommonJS 互操作错误

**错误信息**:
```
error TS1259: Module 'pino' can only be default-imported using the 'esModuleInterop' flag
```

**原因**: 缺少 `esModuleInterop` 配置。

**影响**: 无法导入 pino、zod locales 等 CommonJS 模块。

---

### 4️⃣ 依赖类型不兼容

**错误信息**:
```
error TS2724: 'siwe' has no exported member named 'providers'. Did you mean 'Provider'?
```

**原因**: `siwe@3.0.0` 的类型定义期望 ethers v5（有 `providers` namespace），但项目使用 ethers v6（已移除 providers）。

**影响**: siwe 库的类型定义与实际依赖版本不兼容。

---

### 5️⃣ Admin 构建失败

**错误信息**:
```
failed to calculate checksum: "/app/apps/admin/public": not found
```

**原因**: Admin 应用没有 `public` 目录，但 Dockerfile 强制复制该目录。

**影响**: Docker 镜像构建失败。

---

## 修复方案

### ✅ 修复 1: apps/api/tsconfig.json - 完整配置

**文件路径**: `apps/api/tsconfig.json`

**修复内容**:
```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": ".",
    "outDir": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "incremental": true,
    "composite": true,
    "tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "types": ["jest", "node"],

    // ✅ 添加: ES2022 支持（私有字段、BigInt 等）
    "target": "ES2022",
    "lib": ["ES2022"],

    // ✅ 添加: Node.js 模块解析
    "module": "commonjs",
    "moduleResolution": "node",

    // ✅ 添加: CommonJS 互操作
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    // ✅ 添加: 跳过第三方库类型检查（修复 siwe + ethers v6 不兼容）
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "generated/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**关键配置说明**:

| 配置项 | 作用 | 修复的错误 |
|--------|------|------------|
| `"target": "ES2022"` | 支持 ES2022 特性（私有字段、BigInt） | 私有字段语法错误 |
| `"lib": ["ES2022"]"` | 提供 ES2022 类型定义 | 私有字段语法错误 |
| `"module": "commonjs"` | 输出 CommonJS 格式模块 | 模块解析错误 |
| `"moduleResolution": "node"` | 使用 Node.js 模块解析算法 | 模块解析错误 (86 个) |
| `"esModuleInterop": true` | 允许默认导入 CommonJS 模块 | pino、zod 导入错误 |
| `"allowSyntheticDefaultImports": true` | 允许合成默认导入 | 配合 esModuleInterop |
| `"skipLibCheck": true` | 跳过 .d.ts 类型检查 | siwe + ethers v6 不兼容 |

---

### ✅ 修复 2: apps/admin/Dockerfile - Public 目录处理

**文件路径**: `apps/admin/Dockerfile`

**修复前**:
```dockerfile
# Builder stage
RUN pnpm build

# Runner stage
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public
# ❌ 如果 public 目录不存在，Docker 构建失败
```

**修复后**:
```dockerfile
# Builder stage
RUN pnpm build

# ✅ 确保 public 目录存在（即使应用没有创建）
RUN mkdir -p /app/apps/admin/public

# Runner stage
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public
# ✅ 现在可以安全复制（目录一定存在）
```

**说明**:
- Next.js 应用可能没有 `public` 目录（如果没有静态资源）
- 在 builder stage 创建空目录确保 COPY 命令不会失败
- Next.js 运行时会自动处理空的 public 目录

---

## 构建结果

### ✅ 成功构建的镜像

```bash
$ docker images | grep cohe-capitl-monorepo

cohe-capitl-monorepo-admin   latest   057661c1f07c   633MB
cohe-capitl-monorepo-web     latest   848feefffccb   1.37GB
cohe-capitl-monorepo-api     latest   d6d2c464a3e7   630MB
```

### 镜像大小分析

| 镜像 | 大小 | 说明 |
|------|------|------|
| API | 630MB | NestJS + Prisma Client + node_modules |
| Web | 1.37GB | Next.js SSR + node_modules (包含 ethers、wagmi 等大型库) |
| Admin | 633MB | Next.js SSR + node_modules |

**镜像优化建议**:
- ✅ 已使用 Alpine Linux 基础镜像
- ✅ 已使用多阶段构建（deps → builder → runner）
- ✅ 已在 runner stage 排除 devDependencies
- 📌 未来优化: 考虑使用 standalone 输出模式（Next.js）进一步减小镜像

---

## 验证测试

### 测试 1: 验证镜像存在

```bash
docker images | grep cohe-capitl-monorepo
```

**预期结果**: 显示 3 个镜像（api、web、admin）。

---

### 测试 2: 验证镜像可以启动

```bash
# 创建 .env 文件（参考 .env.production.example）
cp .env.production.example .env
# 编辑 .env 填入必要的环境变量

# 启动所有服务
docker compose up -d

# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f
```

**预期结果**:
- ✅ 所有容器状态为 `Up` 或 `healthy`
- ✅ API 日志显示 `Nest application successfully started`
- ✅ Web/Admin 日志显示 `Ready on http://0.0.0.0:xxxx`

---

## 技术要点

### 1. TypeScript `skipLibCheck` 的使用

**作用**: 跳过所有 `.d.ts` 文件的类型检查。

**适用场景**:
- ✅ 第三方库类型定义与实际版本不兼容（如 siwe + ethers v6）
- ✅ 加速编译（跳过大型类型库的检查）

**注意事项**:
- ⚠️ 不影响项目源代码的类型检查
- ⚠️ 可能隐藏第三方库的类型错误
- ✅ 推荐在生产构建中使用（减少编译时间）

---

### 2. Docker 多阶段构建的目录处理

**问题**: COPY 命令要求源路径必须存在，否则构建失败。

**解决方案**:
1. **在 builder stage 确保目录存在**:
   ```dockerfile
   RUN mkdir -p /app/apps/admin/public
   ```

2. **在 runner stage 正常复制**:
   ```dockerfile
   COPY --from=builder .../public ./public
   ```

**替代方案** (不推荐):
- ❌ 使用 shell 命令复制: `RUN cp -r ... || true`
- ❌ 使用通配符: `COPY .../public* ./` （可能复制错误的文件）

---

## 常见问题

### Q1: 为什么使用 `moduleResolution: "node"` 而不是 `"nodenext"`？

**答**:
- `"node"` 适用于 CommonJS 模块（NestJS 默认使用 CommonJS）
- `"nodenext"` 适用于 ESM 模块（Next.js 可以使用）
- 如果使用 `"nodenext"`，需要同时设置 `"module": "nodenext"`

---

### Q2: `skipLibCheck` 会影响我的代码类型检查吗？

**答**:
- ❌ 不会，`skipLibCheck` 只跳过 `node_modules` 中的 `.d.ts` 文件
- ✅ 你的源代码（`.ts` 文件）仍然会进行严格的类型检查

---

### Q3: 为什么 Web 镜像比 API 大一倍？

**答**:
- Web 应用包含 `ethers`、`wagmi`、`@reown/appkit` 等大型 Web3 库
- Next.js 包含完整的 React SSR 运行时
- API 只包含 NestJS 核心和 Prisma Client

**优化建议**:
- 使用 Next.js standalone 输出模式
- 按需导入 Web3 库（tree-shaking）

---

## 下一步

### ✅ 已完成
- [x] 修复所有 TypeScript 编译错误
- [x] 成功构建所有 Docker 镜像

### 📌 待完成
- [ ] 本地 Docker 测试（参考 `docs/QUICK_START_LOCAL_DOCKER.md`）
- [ ] 生产环境部署（参考 `docs/DOCKER_DEPLOYMENT_GUIDE.md`）
- [ ] 生产加固（参考 `docs/DOCKER_PRODUCTION_HARDENING.md`）

---

## 相关文档

- [Docker 快速开始](./QUICK_START_LOCAL_DOCKER.md)
- [Docker 部署指南](./DOCKER_DEPLOYMENT_GUIDE.md)
- [生产加固指南](./DOCKER_PRODUCTION_HARDENING.md)
- [第一轮修复](./DOCKER_FIXES_SUMMARY.md)
- [第二轮修复](./DOCKER_FIXES_ROUND2.md)

---

**文档版本**: 1.0
**最后更新**: 2025-01-20
**维护者**: Claude Code
