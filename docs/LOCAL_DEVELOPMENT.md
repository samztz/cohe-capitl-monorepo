# 🖥️ 本地开发指南 - Docker Compose

> **快速在本地运行完整的 Cohe Capital 平台**

---

## 📋 前提条件

- **Docker Desktop** 或 **Docker Engine** 24.0+
- **Docker Compose** 2.0+
- **至少 4GB 可用内存**
- **至少 10GB 可用磁盘空间**

---

## 🚀 快速启动（3 步）

### 方法 1：使用自动化脚本（推荐）

```bash
# 1. 运行自动配置脚本
./setup-local-dev.sh

# 2. 构建并启动所有服务
docker compose build
docker compose up -d

# 3. 运行数据库迁移
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"
```

**完成！** 访问 http://localhost/

---

### 方法 2：手动配置

```bash
# 1. 创建环境文件
cp .env.local.example .env

# 2. （可选）编辑 .env 文件
# 如果有端口冲突或想使用自己的 Reown Project ID
nano .env

# 3. 创建必需的目录
mkdir -p docker-volumes/db-data
mkdir -p docker-volumes/uploads/signatures

# 4. 构建 Docker 镜像
docker compose build

# 5. 启动所有服务
docker compose up -d

# 6. 运行数据库迁移
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"

# 7. （可选）查看日志
docker compose logs -f
```

---

## 🌐 访问服务

Docker Compose 启动后，您可以访问以下地址：

| 服务 | URL | 说明 |
|------|-----|------|
| **Web 用户端** | http://localhost/ | Next.js 前端（通过 Nginx） |
| **Admin 管理后台** | http://localhost/admin | 管理面板（通过 Nginx） |
| **API 后端** | http://localhost/api | NestJS API（通过 Nginx） |
| **API 文档** | http://localhost/api-docs | Swagger 文档 |

**直接访问（绕过 Nginx）**：
- Web: http://localhost:3000
- Admin: http://localhost:3002
- API: http://localhost:3001
- PostgreSQL: localhost:5432

---

## 📊 检查服务状态

```bash
# 查看所有服务状态
docker compose ps

# 期望输出（所有服务应为 "Up" 且 "healthy"）
# NAME         STATUS
# cohe-db      Up (healthy)
# cohe-api     Up (healthy)
# cohe-web     Up (healthy)
# cohe-admin   Up (healthy)
# cohe-nginx   Up (healthy)
```

---

## 🔧 常用命令

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

### 重启服务

```bash
# 重启所有服务
docker compose restart

# 重启特定服务
docker compose restart api
docker compose restart web
```

### 停止/启动服务

```bash
# 停止所有服务（保留容器）
docker compose stop

# 启动已停止的服务
docker compose start

# 完全停止并移除容器
docker compose down

# 停止并删除所有数据（包括数据库）
docker compose down -v  # ⚠️ 谨慎使用！
```

### 更新代码后重新构建

```bash
# 方法 1：使用部署脚本
./deploy.sh --build

# 方法 2：手动重建
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 🗄️ 数据库操作

### 访问 PostgreSQL CLI

```bash
# 通过 Docker 容器访问
docker compose exec db psql -U postgres -d web3_insurance

# 或从宿主机访问（如果安装了 psql）
psql -h localhost -U postgres -d web3_insurance
# 密码: postgres
```

### 运行数据库迁移

```bash
# 应用所有待执行的迁移
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"

# 查看迁移状态
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma migrate status"
```

### 打开 Prisma Studio（数据库 GUI）

```bash
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma studio"
```

然后访问 http://localhost:5555

### 重置数据库（开发环境）

```bash
# ⚠️ 警告：这会删除所有数据！

# 方法 1：重新创建容器和卷
docker compose down -v
docker compose up -d
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"

# 方法 2：仅重置数据库
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma migrate reset"
```

---

## 🐛 故障排查

### 问题 1：端口已被占用

**错误信息**:
```
Error: Bind for 0.0.0.0:3000 failed: port is already allocated
```

**解决方案**:

1. 检查端口占用：
```bash
# Linux/Mac
lsof -i :3000
lsof -i :3001
lsof -i :80

# Windows
netstat -ano | findstr :3000
```

2. 修改 `.env` 文件中的端口：
```bash
WEB_PORT=3100
API_PORT=3101
NGINX_HTTP_PORT=8080
```

3. 重启服务：
```bash
docker compose down
docker compose up -d
```

---

### 问题 2：数据库连接失败

**错误信息**:
```
Error: P1001: Can't reach database server at `db:5432`
```

**解决方案**:

1. 检查数据库容器是否健康：
```bash
docker compose ps db
```

2. 查看数据库日志：
```bash
docker compose logs db
```

3. 重启数据库：
```bash
docker compose restart db
```

4. 等待健康检查通过（约 10-20 秒）：
```bash
# 持续检查状态
watch -n 1 'docker compose ps'
```

---

### 问题 3：镜像构建失败

**错误信息**:
```
ERROR [builder X/Y] RUN pnpm install --frozen-lockfile
```

**解决方案**:

1. 清理 Docker 缓存：
```bash
docker builder prune -a
```

2. 重新构建（无缓存）：
```bash
docker compose build --no-cache
```

3. 检查磁盘空间：
```bash
df -h
docker system df
```

4. 清理未使用的镜像和容器：
```bash
docker system prune -a
```

---

### 问题 4：Nginx 502 Bad Gateway

**原因**: 上游服务（api/web/admin）未启动或未健康

**解决方案**:

1. 检查所有服务状态：
```bash
docker compose ps
```

2. 查看 API/Web/Admin 日志：
```bash
docker compose logs api
docker compose logs web
docker compose logs admin
```

3. 重启有问题的服务：
```bash
docker compose restart api web admin
```

4. 验证 Nginx 配置：
```bash
docker compose exec nginx nginx -t
```

---

### 问题 5：磁盘空间不足

**检查空间使用**:
```bash
docker system df
```

**清理策略**:

```bash
# 1. 清理未使用的容器
docker container prune

# 2. 清理未使用的镜像
docker image prune -a

# 3. 清理未使用的卷（⚠️ 会删除数据）
docker volume prune

# 4. 一键清理所有未使用资源
docker system prune -a --volumes
```

---

## ⚙️ 配置说明

### 环境变量

所有配置在 `.env` 文件中：

```bash
# 数据库
POSTGRES_USER=postgres          # 数据库用户名
POSTGRES_PASSWORD=postgres      # 数据库密码
POSTGRES_DB=web3_insurance      # 数据库名称

# API
API_PORT=3001                   # API 端口
JWT_SECRET=xxx                  # JWT 密钥

# Web
WEB_PORT=3000                   # Web 端口
NEXT_PUBLIC_REOWN_PROJECT_ID=xxx  # Reown 项目 ID（必填）

# Admin
ADMIN_PORT=3002                 # Admin 端口
ADMIN_TOKEN=demo-admin-token    # Admin 认证令牌

# Nginx
NGINX_HTTP_PORT=80              # Nginx HTTP 端口
```

### 获取 Reown Project ID（免费）

钱包连接功能需要 Reown（前 WalletConnect）Project ID：

1. 访问 https://cloud.reown.com/
2. 注册/登录账号
3. 创建新项目
4. 复制 Project ID
5. 更新 `.env` 文件：
```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=你的项目ID
```

---

## 🔄 开发工作流

### 典型的开发流程

```bash
# 1. 启动服务
docker compose up -d

# 2. 查看日志（确保无错误）
docker compose logs -f

# 3. 修改代码（在宿主机上编辑）

# 4. 重新构建并重启（如果修改了代码）
docker compose build api  # 或 web, admin
docker compose restart api

# 5. 测试修改

# 6. 完成后停止服务
docker compose down
```

### 仅运行特定服务

```bash
# 仅启动数据库和 API
docker compose up -d db api

# 仅启动前端
docker compose up -d web admin nginx
```

---

## 📝 与原生开发对比

| 操作 | 原生开发 | Docker Compose |
|------|---------|----------------|
| 安装依赖 | `pnpm install` | `docker compose build` |
| 启动 API | `pnpm --filter api dev` | `docker compose up -d api` |
| 启动 Web | `pnpm --filter web dev` | `docker compose up -d web` |
| 数据库迁移 | `pnpm --filter api prisma:migrate:dev` | `docker compose exec api sh -c "..."` |
| 查看日志 | `tail -f logs/*.log` | `docker compose logs -f` |

**优势**:
- ✅ 环境一致性（本地 = 生产）
- ✅ 无需安装 Node.js、PostgreSQL 等依赖
- ✅ 一键启动所有服务
- ✅ 服务隔离，互不干扰

**劣势**:
- ⚠️ 构建时间较长（首次）
- ⚠️ 热重载需要重新构建（或使用卷挂载）

---

## 🔥 热重载开发（高级）

如果需要代码修改后自动重载（类似 `pnpm dev`），可以修改 `docker-compose.yml` 挂载源代码：

```yaml
# docker-compose.override.yml (创建此文件)
services:
  api:
    volumes:
      - ./apps/api/src:/app/apps/api/src
    command: ["pnpm", "dev"]  # 使用 dev 而不是 start

  web:
    volumes:
      - ./apps/web/src:/app/apps/web/src
    command: ["pnpm", "dev"]
```

然后运行：
```bash
docker compose up -d
```

---

## ✅ 验证部署成功

运行以下检查清单：

```bash
# 1. 所有服务都在运行
docker compose ps
# 期望：5 个服务都是 "Up (healthy)"

# 2. 数据库可访问
docker compose exec db psql -U postgres -d web3_insurance -c "SELECT 1;"
# 期望：返回 "1"

# 3. API 健康检查
curl http://localhost/api/health
# 期望：HTTP 200

# 4. Web 前端可访问
curl -I http://localhost/
# 期望：HTTP 200

# 5. Admin 可访问
curl -I http://localhost/admin
# 期望：HTTP 200

# 6. API 文档可访问
curl -I http://localhost/api-docs
# 期望：HTTP 200
```

全部通过 ✅ = 部署成功！

---

## 📚 相关文档

- [完整部署文档](./DEPLOYMENT.md) - 生产环境部署指南
- [项目状态](./project_state.md) - 开发进度追踪
- [更新日志](./CHANGELOG.md) - 功能变更记录

---

## 🆘 获取帮助

如遇到问题：

1. 查看本文档的「故障排查」章节
2. 检查日志：`docker compose logs -f`
3. 搜索 GitHub Issues
4. 联系开发团队

---

**祝开发愉快！** 🚀
