# 🚀 本地 Docker 部署快速上手指南

> **3 分钟完成本地 Docker 环境部署和测试**

---

## 📋 方式一：一键部署（推荐）

### 最简单的方式

```bash
# 1. 运行一键部署脚本
./scripts/local-docker-test.sh

# 脚本会自动完成以下操作：
# ✓ 检查 Docker 环境
# ✓ 创建 .env 配置文件
# ✓ 创建数据目录
# ✓ 构建 Docker 镜像
# ✓ 启动所有服务
# ✓ 运行数据库迁移
# ✓ 执行自动化测试
# ✓ 显示访问地址
```

### 中途会提示输入的内容

1. **WalletConnect Project ID**（必须）
   - 访问 https://cloud.reown.com/
   - 注册并创建项目
   - 复制 Project ID 并粘贴

2. **端口占用确认**（如果有端口被占用）
   - 选择 `y` 继续（会使用被占用的端口）
   - 选择 `N` 退出并手动停止占用端口的进程

### 完成后会看到

```
========================================
    Docker 部署成功！
========================================

📱 访问地址:

  Web 前端:
    http://localhost/

  Admin 后台:
    http://localhost/admin
    Admin Token: demo-admin-token-12345

  API 文档:
    http://localhost/api-docs

  API 健康检查:
    http://localhost/api/healthz

🛠️  常用命令:

  查看日志:
    docker compose logs -f [service]

  查看服务状态:
    docker compose ps

  停止所有服务:
    docker compose down
========================================
```

---

## 📋 方式二：手动部署（学习用）

如果你想了解每一步的细节，可以手动执行：

### Step 1: 获取 WalletConnect Project ID

```bash
# 1. 访问 https://cloud.reown.com/
# 2. 注册/登录账号
# 3. 点击 "Create New Project"
# 4. 填写信息:
#    - Project Name: Cohe Capital Local Test
#    - Homepage URL: http://localhost
# 5. 复制 Project ID (格式: a1b2c3d4e5f6...)
```

### Step 2: 配置环境变量

```bash
# 创建配置文件
cp .env.local.example .env

# 编辑配置
vim .env

# 必须修改的变量：
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=粘贴你的Project_ID

# 可选修改的变量：
# ADMIN_TOKEN=自定义管理员令牌
# JWT_SECRET=自定义JWT密钥（使用 openssl rand -base64 32 生成）
```

### Step 3: 创建数据目录

```bash
mkdir -p docker-volumes/db-data
mkdir -p docker-volumes/uploads/signatures
```

### Step 4: 验证配置

```bash
# 检查 docker-compose.yml 语法
docker compose config

# 如果输出完整配置（无错误），说明配置正确
```

### Step 5: 构建镜像

```bash
# 构建所有服务镜像（需要 5-10 分钟）
docker compose build

# 查看构建的镜像
docker images | grep cohe
```

**预期输出**:
```
cohe-capitl-monorepo-api     latest    xxx    xxx MB
cohe-capitl-monorepo-web     latest    xxx    xxx MB
cohe-capitl-monorepo-admin   latest    xxx    xxx MB
```

### Step 6: 启动服务

```bash
# 启动所有服务（后台运行）
docker compose up -d

# 查看服务状态
docker compose ps

# 等待 30-60 秒，直到所有服务显示 "Up (healthy)"
watch -n 5 docker compose ps
```

**预期输出**:
```
NAME         IMAGE                          STATUS
cohe-db      postgres:16-alpine             Up (healthy)
cohe-api     cohe-capitl-monorepo-api       Up (healthy)
cohe-web     cohe-capitl-monorepo-web       Up (healthy)
cohe-admin   cohe-capitl-monorepo-admin     Up (healthy)
cohe-nginx   nginx:alpine                   Up (healthy)
```

### Step 7: 运行数据库迁移

```bash
# 方式 1: 使用部署脚本
./deploy.sh --migrate

# 方式 2: 手动执行
docker compose run --rm api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"
```

**预期输出**:
```
Applying migration `20240101000000_init`
The following migration(s) have been applied:
...
```

### Step 8: 运行测试

```bash
# 运行自动化测试脚本（12 项测试）
./scripts/tests/docker-verify.sh
```

**预期输出**:
```
======================================
Docker 部署验证测试
======================================

Testing Test 1: API Health Check... ✓ PASS (HTTP 200)
Testing Test 2: API Swagger Docs... ✓ PASS (HTTP 200)
...
Testing Test 10b: Admin Internal Port... ✓ PASS

======================================
测试总结
======================================

✓ 所有测试通过！(12 passed, 0 failed)
```

---

## 🌐 浏览器测试

### 1. Web 前端测试

访问 http://localhost/

**验证清单**:
- ✅ 页面正常加载
- ✅ 点击 "Connect Wallet" 按钮
- ✅ WalletConnect 模态框弹出
- ✅ 可以扫码或选择钱包连接

**浏览器开发者工具检查**:
- 打开 Network 标签
- 刷新页面
- 确认 API 请求发送到 `/api/*` (不是 `localhost:3001`)

### 2. Admin 后台测试

访问 http://localhost/admin

**验证清单**:
- ✅ 登录页面正常显示
- ✅ 输入 Admin Token（从 `.env` 的 `ADMIN_TOKEN` 获取）
- ✅ 可以成功登录
- ✅ 跳转到 Dashboard

**默认 Admin Token**: `demo-admin-token-12345`

### 3. API 文档测试

访问 http://localhost/api-docs

**验证清单**:
- ✅ Swagger UI 正常显示
- ✅ 可以展开 API 端点
- ✅ 可以测试 API 调用（如 GET /healthz）

---

## 🔍 常见问题排查

### 问题 1: 端口被占用

**错误信息**: `Error: port is already allocated`

**解决方案**:

```bash
# 查看占用端口的进程
lsof -i :80
lsof -i :3000

# 停止占用端口的进程
kill -9 <PID>

# 或修改 .env 中的端口配置
vim .env
# 修改 NGINX_HTTP_PORT=8080
# 修改 WEB_PORT=3001
# 等...

# 重新启动
docker compose down
docker compose up -d
```

### 问题 2: 服务启动失败

**症状**: `docker compose ps` 显示 "Exited" 或 "Unhealthy"

**排查步骤**:

```bash
# 1. 查看服务日志
docker compose logs api
docker compose logs web
docker compose logs db

# 2. 常见错误及解决方案:

# 错误: "Cannot find module './generated/prisma'"
# 解决: 重新构建 API 镜像
docker compose build api --no-cache

# 错误: "Connection refused" (API 连接数据库)
# 解决: 等待数据库启动完成
docker compose restart api

# 错误: "Port 3001 is already in use"
# 解决: 修改 .env 中的端口或停止占用进程
```

### 问题 3: WalletConnect 不工作

**症状**: 浏览器控制台显示 "Invalid project id"

**排查步骤**:

```bash
# 1. 检查环境变量是否正确传递
docker compose exec web env | grep WALLETCONNECT

# 预期输出:
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# 2. 如果为空或显示 "YOUR_PROJECT_ID_HERE"
# 编辑 .env 文件
vim .env

# 修改:
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_real_project_id

# 3. 重新构建并启动 Web 服务
docker compose build web
docker compose up -d web

# 4. 清除浏览器缓存并刷新
```

### 问题 4: 数据库迁移失败

**症状**: `prisma migrate deploy` 失败

**排查步骤**:

```bash
# 1. 检查数据库是否就绪
docker compose exec db pg_isready -U postgres

# 2. 检查数据库连接
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma db pull"

# 3. 如果仍然失败，重置数据库
docker compose down
rm -rf docker-volumes/db-data/*
docker compose up -d db
# 等待 30 秒
docker compose run --rm api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"
```

### 问题 5: 上传文件丢失

**症状**: 重启容器后上传的签名图片消失

**排查步骤**:

```bash
# 1. 检查挂载是否正确
docker compose exec api ls -la /app/apps/api/uploads/

# 2. 检查宿主机目录
ls -la docker-volumes/uploads/

# 3. 测试写入
docker compose exec api sh -c "echo 'test' > /app/apps/api/uploads/test.txt"

# 4. 验证持久化
cat docker-volumes/uploads/test.txt

# 如果看到 "test"，说明挂载正确
```

---

## 🛠️ 常用管理命令

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db

# 查看最近 100 行日志
docker compose logs --tail=100 api
```

### 服务管理

```bash
# 停止所有服务
docker compose down

# 停止所有服务并删除数据卷（⚠️ 会删除数据库数据）
docker compose down -v

# 重启特定服务
docker compose restart api
docker compose restart web

# 重新构建并启动服务
docker compose up -d --build api
```

### 进入容器

```bash
# 进入 API 容器
docker compose exec api sh

# 进入数据库容器
docker compose exec db psql -U postgres -d web3_insurance

# 执行单次命令
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma studio"
```

### 数据库操作

```bash
# 从宿主机连接数据库（需要启用端口映射）
psql -h localhost -U postgres -d web3_insurance
# 密码: postgres

# 查看数据库表
docker compose exec db psql -U postgres -d web3_insurance -c "\dt"

# 备份数据库
docker compose exec db pg_dump -U postgres web3_insurance > backup.sql

# 恢复数据库
cat backup.sql | docker compose exec -T db psql -U postgres -d web3_insurance
```

### 清理与重置

```bash
# 停止所有服务
docker compose down

# 清理数据卷
rm -rf docker-volumes/db-data/*
rm -rf docker-volumes/uploads/*

# 重新创建目录
mkdir -p docker-volumes/db-data
mkdir -p docker-volumes/uploads/signatures

# 重新启动
docker compose up -d

# 重新运行迁移
./deploy.sh --migrate
```

---

## 📊 服务访问地址总结

| 服务 | 地址 | 说明 |
|-----|------|------|
| **Web 前端** | http://localhost/ | 用户界面 |
| **Admin 后台** | http://localhost/admin | 管理员面板 |
| **API 文档** | http://localhost/api-docs | Swagger UI |
| **API 健康检查** | http://localhost/api/healthz | 返回 "OK" |
| **Nginx 健康检查** | http://localhost/health | 返回 "healthy" |
| **PostgreSQL** | localhost:5432 | 数据库（需启用端口映射） |

### 直接访问服务（绕过 Nginx）

| 服务 | 地址 | 端口 |
|-----|------|------|
| API | http://localhost:3001 | 3001 |
| Web | http://localhost:3000 | 3000 |
| Admin | http://localhost:3002 | 3002 |

---

## ✅ 测试成功标准

完成部署后，以下所有项目应该通过：

### 自动化测试（12 项）

```bash
./scripts/tests/docker-verify.sh

# 预期所有测试通过:
# ✓ Test 1: API Health Check
# ✓ Test 2: API Swagger Docs
# ✓ Test 3: Web Frontend
# ✓ Test 4: Admin Panel
# ✓ Test 5: Nginx Health
# ✓ Test 6: Database Connection
# ✓ Test 7: Database Port Isolation
# ✓ Test 8: Uploads Directory
# ✓ Test 9: API Internal Port
# ✓ Test 10: Web/Admin Internal Port
```

### 浏览器测试

- ✅ Web 前端加载正常
- ✅ WalletConnect 可以弹出
- ✅ Admin 可以登录
- ✅ API 文档可访问
- ✅ 无浏览器控制台错误

### 服务状态

```bash
docker compose ps

# 所有服务应显示 "Up (healthy)":
# cohe-db      Up (healthy)
# cohe-api     Up (healthy)
# cohe-web     Up (healthy)
# cohe-admin   Up (healthy)
# cohe-nginx   Up (healthy)
```

---

## 🎯 下一步

部署成功后，你可以：

1. **开始开发**
   - 修改代码后重新构建: `docker compose build [service]`
   - 实时查看日志: `docker compose logs -f [service]`

2. **测试 API**
   - 访问 Swagger UI: http://localhost/api-docs
   - 使用 Postman/Thunder Client 测试

3. **测试 Web3 功能**
   - 连接 MetaMask 钱包
   - 测试 SIWE 登录
   - 创建保单流程

4. **查看文档**
   - 完整部署指南: `docs/DEPLOYMENT.md`
   - 测试指南: `docs/DOCKER_TESTING_GUIDE.md`
   - 修复总结: `docs/DOCKER_FIXES_SUMMARY.md`

---

## 📞 获取帮助

如果遇到问题：

1. 查看日志: `docker compose logs -f`
2. 查看本文档的"常见问题排查"章节
3. 查看详细测试指南: `docs/DOCKER_TESTING_GUIDE.md`
4. 检查 GitHub Issues: https://github.com/your-repo/issues

---

**祝部署顺利！🎉**
