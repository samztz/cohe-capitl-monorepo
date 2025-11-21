# 🔧 Docker 配置修复总结

> **根据代码审查清单完成的所有修复**

---

## ✅ 已修复的致命问题

### 1. API 健康检查路径错误 ✅
- **问题**: docker-compose.yml 和 Dockerfile 使用 `/health`，实际是 `/healthz`
- **修复**:
  - `apps/api/Dockerfile:101` - 改为 `/healthz`
  - `docker-compose.yml:127` - 改为 `/healthz`

### 2. Prisma Client 未打包 ✅
- **问题**: Dockerfile 未 COPY `apps/api/generated` 目录
- **修复**: `apps/api/Dockerfile:84` - 添加 COPY generated 目录

### 3. Admin 端口不匹配 ✅
- **问题**: package.json 写死 `-p 3000`，但 compose 期望 3002
- **修复**: `apps/admin/Dockerfile:102` - 使用动态端口 `next start -p $PORT`
- **同时修复**: `apps/web/Dockerfile:106` - 也使用动态端口

### 4. API 反向代理前缀错误 ✅
- **问题**: Nginx 将 `/api/` 代理到 `api_backend/api/`，多加了一段路径
- **修复**: `infra/nginx/nginx.conf:163` - 改为 `proxy_pass http://api_backend;`

### 5. 前端 API 基础地址环境变量错误 ✅
- **问题**:
  - Web 代码读取 `NEXT_PUBLIC_API_BASE`，compose 配置的是 `NEXT_PUBLIC_API_URL`
  - Admin 代码读取 `NEXT_PUBLIC_ADMIN_API_BASE`，compose 配置的是 `NEXT_PUBLIC_API_URL`
- **修复**:
  - `docker-compose.yml:157` - Web 使用 `NEXT_PUBLIC_API_BASE=/api`
  - `docker-compose.yml:206` - Admin 使用 `NEXT_PUBLIC_ADMIN_API_BASE=/api`
  - `.env.production.example` - 统一变量名
  - `.env.local.example` - 统一变量名

---

## ✅ 已修复的高优先级问题

### 6. 上传目录挂载不匹配 ✅
- **问题**:
  - 代码 cwd 在 `/app/apps/api`，静态目录为 `process.cwd()/uploads`
  - compose 挂载到 `/app/uploads`，路径不一致
- **修复**:
  - `docker-compose.yml:117` - 挂载到 `/app/apps/api/uploads`
  - `apps/api/Dockerfile:89-90` - 创建 `/app/apps/api/uploads/signatures`

### 7. API 启动命令不正确 ✅
- **问题**: Dockerfile 使用 `pnpm start`（执行 `nest start`），会尝试运行 TS 源码
- **修复**: `apps/api/Dockerfile:106` - 改为 `node apps/api/dist/main.js`

---

## ✅ 已修复的中等优先级问题

### 8. 数据库对外暴露 ✅
- **问题**: db 映射了宿主 5432，生产环境不安全
- **修复**: `docker-compose.yml:48-49` - 默认注释端口映射，仅保留内网访问

### 9. Reown/WC 项目 ID 环境变量名不一致 ✅
- **问题**:
  - Web 代码使用 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
  - compose 使用 `NEXT_PUBLIC_REOWN_PROJECT_ID`
- **修复**:
  - `docker-compose.yml:160` - 统一为 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
  - `.env.production.example:106` - 统一变量名
  - `.env.local.example:78` - 统一变量名

### 10. Admin 前端注入 NEXT_PUBLIC_ADMIN_TOKEN ✅
- **问题**: Admin 从 localStorage 取 token，环境变量暴露无意义且有泄露风险
- **修复**: `docker-compose.yml:206` - 移除 `NEXT_PUBLIC_ADMIN_TOKEN`

---

## 📊 修复统计

| 严重程度 | 问题数量 | 已修复 | 状态 |
|---------|---------|--------|------|
| 致命问题 | 5 | 5 | ✅ 100% |
| 高优先级 | 2 | 2 | ✅ 100% |
| 中等优先级 | 3 | 3 | ✅ 100% |
| **总计** | **10** | **10** | ✅ **100%** |

---

## 📝 修改的文件清单

```
# Dockerfiles
apps/api/Dockerfile (7 处修改)
apps/web/Dockerfile (1 处修改)
apps/admin/Dockerfile (1 处修改)

# Docker Compose
docker-compose.yml (10 处修改)

# Nginx 配置
infra/nginx/nginx.conf (2 处修改)

# 环境变量模板
.env.production.example (5 处修改)
.env.local.example (4 处修改)
```

---

## 🧪 本地测试验证清单

### 前置准备

1. **配置环境变量**
   ```bash
   cp .env.local.example .env

   # 编辑 .env，至少设置：
   # - POSTGRES_USER/PASSWORD/DB
   # - JWT_SECRET (可用 openssl rand -base64 32 生成)
   # - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID (从 cloud.reown.com 获取)
   ```

2. **创建必需目录**
   ```bash
   mkdir -p docker-volumes/db-data
   mkdir -p docker-volumes/uploads/signatures
   ```

### 构建与启动

```bash
# 1. 验证配置语法
docker compose config

# 2. 构建所有镜像
docker compose build

# 3. 启动所有服务
docker compose up -d

# 4. 等待服务健康检查通过
sleep 30
docker compose ps
```

**期望输出**: 所有服务状态为 `Up (healthy)`

### 验证测试

#### ✅ Test 1: API 健康检查
```bash
curl http://localhost/api/healthz
# 期望: "OK" 或 {"status":"ok"}
```

#### ✅ Test 2: API Swagger 文档
```bash
curl -I http://localhost/api-docs
# 期望: HTTP 200
```

#### ✅ Test 3: Web 前端可访问
```bash
curl -I http://localhost/
# 期望: HTTP 200
```

#### ✅ Test 4: Admin 后台可访问
```bash
curl -I http://localhost/admin
# 期望: HTTP 200
```

#### ✅ Test 5: Nginx 健康检查
```bash
curl http://localhost/health
# 期望: "healthy"
```

#### ✅ Test 6: 数据库内网访问（从 API 容器）
```bash
docker compose exec api sh -c "cd /app/apps/api && node -e \"const { PrismaClient } = require('./generated/prisma'); const prisma = new PrismaClient(); prisma.\\\$connect().then(() => console.log('DB connected')).catch(console.error)\""
# 期望: "DB connected"
```

#### ✅ Test 7: 数据库外网隔离（从宿主机）
```bash
nc -zv localhost 5432
# 期望: Connection refused (端口已关闭)
```

#### ✅ Test 8: 上传目录可写
```bash
docker compose exec api sh -c "echo 'test' > /app/apps/api/uploads/test.txt && cat /app/apps/api/uploads/test.txt"
# 期望: "test"

# 验证持久化
ls docker-volumes/uploads/test.txt
# 期望: 文件存在
```

#### ✅ Test 9: API 端口正确
```bash
docker compose exec api sh -c "wget -q -O- http://localhost:3001/healthz"
# 期望: "OK"
```

#### ✅ Test 10: Web/Admin 端口正确
```bash
docker compose exec web sh -c "wget -q -O- http://localhost:3000/"
docker compose exec admin sh -c "wget -q -O- http://localhost:3002/"
# 期望: HTTP 200 + HTML 内容
```

---

## 🚀 测试脚本

创建 `scripts/tests/docker-verify.sh`:

```bash
#!/bin/bash

set -e

echo "======================================"
echo "Docker 部署验证测试"
echo "======================================"
echo ""

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

passed=0
failed=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"

    echo -n "Testing $name... "

    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_code"; then
        echo -e "${GREEN}PASS${NC}"
        ((passed++))
    else
        echo -e "${RED}FAIL${NC}"
        ((failed++))
    fi
}

# 等待服务启动
echo "Waiting for services to be healthy..."
sleep 15

# 运行测试
test_endpoint "API Health" "http://localhost/api/healthz"
test_endpoint "API Docs" "http://localhost/api-docs"
test_endpoint "Web Frontend" "http://localhost/"
test_endpoint "Admin Panel" "http://localhost/admin"
test_endpoint "Nginx Health" "http://localhost/health"

echo ""
echo "======================================"
echo "Results: $passed passed, $failed failed"
echo "======================================"

if [ $failed -gt 0 ]; then
    exit 1
fi
```

运行测试：
```bash
chmod +x scripts/tests/docker-verify.sh
./scripts/tests/docker-verify.sh
```

---

## 📌 重要提醒

1. **首次运行需要运行数据库迁移**:
   ```bash
   ./deploy.sh --migrate
   ```

2. **获取 WalletConnect Project ID**:
   - 访问 https://cloud.reown.com/
   - 免费注册并创建项目
   - 复制 Project ID 到 .env

3. **生产环境额外步骤**:
   - 配置 SSL/TLS 证书
   - 更改所有默认密码
   - 设置 CORS 为具体域名
   - 配置备份策略

---

## ✅ 验证完成

所有 10 个问题已修复，可以进行本地测试。

如果测试通过，Docker 部署方案即可用于生产环境！
