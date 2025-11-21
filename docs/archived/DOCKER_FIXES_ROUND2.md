# 🔧 Docker 配置修复总结（第二轮）

> **根据代码诊断完成的关键修复**

---

## ✅ 修复统计

| 严重程度 | 问题数量 | 已修复 | 完成率 |
|---------|---------|--------|-------|
| **致命问题** | 3 | 3 | ✅ 100% |
| **已修复（第一轮）** | 1 | 1 | ✅ 100% |
| **优化项** | 3 | 3 | ✅ 100% |
| **总计** | **7** | **7** | ✅ **100%** |

---

## 🔴 致命问题修复（阻断性）

### 问题 1: Nginx /api 反代路径不匹配

**诊断结果**:
```
- 现状：Nginx location /api/ 直接 proxy_pass 到 API 根路径
- 浏览器发送：/api/policy
- Nginx 转发到：http://api_backend/policy
- 后端期望：/policy（无全局前缀）
- 结果：404 Not Found
```

**影响**: 所有 API 请求全部失败，服务完全不可用

**修复方案**: 在 NestJS 中添加全局前缀 `api`

**修复位置**: `apps/api/src/main.ts:62-68`

```typescript
// Set global API prefix (default: 'api')
// This allows Nginx to proxy /api/* directly without path manipulation
// Exclude /healthz and /uploads from the prefix for direct access
const apiPrefix = process.env.API_PREFIX ?? 'api';
app.setGlobalPrefix(apiPrefix, {
  exclude: ['healthz', 'uploads/(.*)'],
});
```

**为什么选择这个方案？**
- ✅ Nest 全局前缀是官方推荐的 API 版本控制/分组方式
- ✅ 避免 Nginx 复杂的 rewrite 规则（易出错）
- ✅ 保持 Nginx 配置简洁：`proxy_pass http://api_backend;`
- ✅ 可通过环境变量 `API_PREFIX` 灵活配置

**路由结构变化**:
```diff
# 修复前
- POST /auth/siwe/nonce
- GET  /sku
- POST /policy

# 修复后
+ POST /api/auth/siwe/nonce
+ GET  /api/sku
+ POST /api/policy

# 保持不变（exclude 配置）
  GET  /healthz
  GET  /api-docs
  GET  /uploads/signatures/*
```

**验证测试**:
```bash
# 测试健康检查（无前缀）
curl http://localhost/api/healthz
# 预期: "OK"

# 测试 Swagger 文档（无前缀）
curl http://localhost/api-docs
# 预期: HTTP 200 + Swagger UI HTML

# 测试 API 端点（有前缀）
curl http://localhost/api/sku
# 预期: 产品列表 JSON
```

---

### 问题 2: API 容器 CMD 路径解析错误

**诊断结果**:
```
- WORKDIR: /app/apps/api (Dockerfile:93)
- CMD: ["node", "apps/api/dist/main.js"] (Dockerfile:107)
- 实际解析路径: /app/apps/api/apps/api/dist/main.js (不存在)
- 结果：容器启动失败
```

**影响**: API 容器无法启动，服务完全不可用

**修复方案**: 将 CMD 改为相对路径

**修复位置**: `apps/api/Dockerfile:108`

```dockerfile
# 修复前
CMD ["node", "apps/api/dist/main.js"]

# 修复后
CMD ["node", "dist/main.js"]
```

**为什么？**
- WORKDIR 已经设置为 `/app/apps/api`
- 使用相对路径 `dist/main.js` 会解析为正确的 `/app/apps/api/dist/main.js`
- 简洁明了，避免路径重复

**验证测试**:
```bash
# 检查容器启动
docker compose ps api
# 预期: STATUS = "Up (healthy)"

# 检查容器进程
docker compose exec api ps aux | grep node
# 预期: node dist/main.js
```

---

### 问题 3: Prisma Client 未打包进镜像

**诊断结果**:
```
- deps 阶段：生成 Prisma Client 到 /app/apps/api/generated
- builder 阶段：COPY apps/api ./apps/api (覆盖了 generated 目录)
- runner 阶段：COPY --from=builder /app/apps/api/generated (不存在)
- 运行时导入：require('./generated/prisma') (apps/api/src/modules/prisma/prisma.service.ts:31)
- 结果：Module not found 错误
```

**影响**: 数据库操作全部失败，API 无法运行

**修复方案**: 在 builder 阶段先复制 deps 的 generated 目录

**修复位置**: `apps/api/Dockerfile:50-51`

```dockerfile
# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy Prisma Client generated in deps stage (NEW!)
COPY --from=deps /app/apps/api/generated ./apps/api/generated

# Copy source code (这会覆盖 apps/api，但 generated 已提前复制)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api ./apps/api
```

**为什么这样修复？**
- ✅ deps 阶段已运行 `pnpm prisma generate`，生成了 Prisma Client
- ✅ 在 `COPY apps/api` 之前先复制 `generated`，即使被覆盖也无妨
- ✅ builder 和 runner 阶段都能访问到 Prisma Client

**验证测试**:
```bash
# 检查 generated 目录是否存在
docker compose exec api ls -la /app/apps/api/generated/

# 测试 Prisma 连接
docker compose exec api node -e "const { PrismaClient } = require('./generated/prisma'); const p = new PrismaClient(); p.\$connect().then(() => console.log('DB_CONNECTED')).catch(e => console.error('FAILED:', e.message))"
# 预期: "DB_CONNECTED"
```

---

## ✅ 已修复（第一轮）

### 问题 4: 上传目录挂载路径不一致

**状态**: 已在第一轮修复中完成 ✅

**修复位置**: `docker-compose.yml:117`

```yaml
volumes:
  # Mounted to /app/apps/api/uploads to match the cwd in main.ts
  - ${UPLOADS_PATH:-./docker-volumes/uploads}:/app/apps/api/uploads
```

**验证**: 无需额外修改，已正确配置

---

## 🟡 优化项（非阻断）

### 优化 1: Admin 签名图片预览路径

**问题**: 使用已废弃的 `NEXT_PUBLIC_API_URL`，生产环境会失效

**修复位置**: `apps/admin/app/(dashboard)/policies/[id]/page.tsx:219`

```tsx
// 修复前
src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${policy.signatureImageUrl}`}

// 修复后
src={`${process.env.NEXT_PUBLIC_ADMIN_API_BASE || '/api'}${policy.signatureImageUrl}`}
```

**影响**: 生产环境中签名图片能正确加载

---

### 优化 2: 数据库端口映射默认关闭

**状态**: 已在第一轮修复中完成 ✅

**增强**: 在 `.env.local.example:31` 添加启用说明

```bash
# Database port (exposed to host for local development)
# To enable port mapping, uncomment the ports section in docker-compose.yml (line 48-49)
DB_PORT=5432
```

---

### 优化 3: 文档变量名统一

**问题**: `apps/web/README.md` 仍使用旧变量名，易误导维护者

**修复位置**: `apps/web/README.md:79-99`

```bash
# 修复前
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here

# 修复后
NEXT_PUBLIC_API_BASE=http://localhost:3001   # 开发环境
# NEXT_PUBLIC_API_BASE=/api                  # 生产环境（Docker + Nginx）
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

---

## 📋 测试验证清单

### 前置准备

```bash
# 1. 停止现有服务
docker compose down

# 2. 清理旧镜像（可选）
docker rmi cohe-capitl-monorepo-api cohe-capitl-monorepo-admin

# 3. 重新构建（使用 --no-cache 确保 Prisma Client 重新生成）
docker compose build api --no-cache
docker compose build admin
```

### 启动与验证

```bash
# 4. 启动服务
docker compose up -d

# 5. 等待健康检查通过
sleep 30
docker compose ps
# 预期: 所有服务 "Up (healthy)"

# 6. 运行数据库迁移
./deploy.sh --migrate
```

### 功能测试

#### ✅ Test 1: API 健康检查（无前缀）
```bash
curl http://localhost/api/healthz
# 预期: "OK"
```

#### ✅ Test 2: Swagger 文档（无前缀）
```bash
curl -I http://localhost/api-docs
# 预期: HTTP 200
```

#### ✅ Test 3: API 路由（有前缀）
```bash
curl http://localhost/api/sku
# 预期: 产品列表 JSON 或空数组 []
```

#### ✅ Test 4: Prisma 数据库连接
```bash
docker compose exec api node -e "const { PrismaClient } = require('./generated/prisma'); const p = new PrismaClient(); p.\$connect().then(() => console.log('DB_CONNECTED')).catch(console.error)"
# 预期: "DB_CONNECTED"
```

#### ✅ Test 5: 上传目录持久化
```bash
# 写入测试文件
docker compose exec api sh -c "echo 'test-signature' > /app/apps/api/uploads/test.txt"

# 验证容器内可读
docker compose exec api cat /app/apps/api/uploads/test.txt
# 预期: "test-signature"

# 验证宿主机持久化
cat docker-volumes/uploads/test.txt
# 预期: "test-signature"
```

#### ✅ Test 6: Admin 签名图片预览
```bash
# 检查环境变量是否正确传递
docker compose exec admin env | grep ADMIN_API_BASE
# 预期: NEXT_PUBLIC_ADMIN_API_BASE=/api
```

---

## 📊 修复后的路由结构

### API 路由表

| 路径 | 方法 | 说明 | 前缀 |
|------|------|------|------|
| `/healthz` | GET | 健康检查 | ❌ 无前缀 |
| `/api-docs` | GET | Swagger UI | ❌ 无前缀 |
| `/uploads/signatures/*` | GET | 静态文件 | ❌ 无前缀 |
| `/api/auth/siwe/nonce` | POST | 获取 SIWE nonce | ✅ 有前缀 |
| `/api/auth/siwe/verify` | POST | 验证 SIWE 签名 | ✅ 有前缀 |
| `/api/sku` | GET | 产品列表 | ✅ 有前缀 |
| `/api/policy` | POST | 创建保单 | ✅ 有前缀 |
| `/api/policy/:id` | GET | 保单详情 | ✅ 有前缀 |
| `/api/admin/policies` | GET | 管理员查看保单 | ✅ 有前缀 |

### Nginx 反向代理规则

```nginx
# 健康检查（直连 nginx）
location /health {
    return 200 "healthy\n";
}

# API 反向代理（保持路径）
location /api/ {
    proxy_pass http://api_backend;  # 不剥离前缀
}

# Swagger 文档（直连 API）
location /api-docs {
    proxy_pass http://api_backend;
}

# 上传文件（直连 API）
location /uploads/ {
    proxy_pass http://api_backend;
}

# Web 前端
location / {
    proxy_pass http://web_backend;
}

# Admin 后台
location /admin {
    proxy_pass http://admin_backend;
}
```

---

## ⚠️ 重要提醒

### 1. API 路径变化影响

**修复前后对比**:
```diff
# 前端 API 调用
- fetch('http://localhost:3001/policy')      # 开发环境（旧）
+ fetch('/api/policy')                        # 生产环境（新）

# Swagger 文档测试
- POST /policy                                # 修复前
+ POST /api/policy                            # 修复后
```

**前端配置已正确**:
- ✅ `NEXT_PUBLIC_API_BASE=/api` (docker-compose.yml)
- ✅ `NEXT_PUBLIC_ADMIN_API_BASE=/api` (docker-compose.yml)
- ✅ 所有 API 调用都使用环境变量拼接路径

### 2. 环境变量对照表

| 旧变量名 | 新变量名 | 用途 |
|---------|---------|------|
| `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_API_BASE` | Web 前端 API 基础路径 |
| `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_ADMIN_API_BASE` | Admin 后台 API 基础路径 |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect 项目 ID |

### 3. 数据库端口映射

**默认配置**（生产安全）:
```yaml
# ports:                           # 默认注释
#   - "${DB_PORT:-5432}:5432"     # 生产环境不对外暴露
```

**本地开发启用**（取消注释）:
```yaml
ports:
  - "${DB_PORT:-5432}:5432"       # 本地开发可用 psql 连接
```

---

## ✅ 修复完成标志

完成以下所有验证，表示修复成功：

- ✅ API 容器能正常启动（CMD 路径修复）
- ✅ Prisma 数据库连接成功（Prisma Client 打包）
- ✅ API 路由能正常访问（全局前缀配置）
- ✅ 健康检查返回 200（排除前缀）
- ✅ Swagger 文档可访问（排除前缀）
- ✅ 上传文件能持久化（挂载路径正确）
- ✅ Admin 签名图片能预览（路径配置正确）

---

## 📚 相关文档

- **第一轮修复**: `docs/DOCKER_FIXES_SUMMARY.md`
- **部署指南**: `docs/DEPLOYMENT.md`
- **测试指南**: `docs/DOCKER_TESTING_GUIDE.md`
- **快速上手**: `docs/QUICK_START_LOCAL_DOCKER.md`

---

**修复完成时间**: 2025-01-19
**修复人员**: Claude Code (AI Pair Programmer)
**验证状态**: ✅ 所有关键问题已修复，待本地测试验证
