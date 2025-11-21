# 🧪 Docker Compose 本地与生产环境测试指南

## 📋 目录
- [文件架构说明](#文件架构说明)
- [本地与生产的区别](#本地与生产的区别)
- [本地开发测试流程](#本地开发测试流程)
- [生产环境测试流程](#生产环境测试流程)
- [完整部署测试清单](#完整部署测试清单)

---

## 📁 文件架构说明

### 三文件架构

```
项目根目录/
├── docker-compose.yml           # 共性配置（所有环境通用）
├── docker-compose.override.yml  # 本地开发配置（自动加载）
└── docker-compose.prod.yml      # 生产环境配置（显式指定）
```

### 如何区分本地与生产

| 环境 | 命令 | 加载的文件 | 说明 |
|------|------|------------|------|
| **本地开发** | `docker compose up -d` | `docker-compose.yml` + `docker-compose.override.yml` | **自动合并**，无需 `-f` 参数 |
| **生产环境** | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` | `docker-compose.yml` + `docker-compose.prod.yml` | **显式指定**，覆盖 override |

---

## 🔍 本地与生产的区别

### 配置差异对比表

| 配置项 | 本地开发 (override.yml) | 生产环境 (prod.yml) |
|--------|-------------------------|---------------------|
| **NODE_ENV** | development | production |
| **restart** | unless-stopped | always |
| **数据库端口** | 5432 暴露 | ports: [] (禁止暴露) |
| **API 端口** | 3001 暴露 | ports: [] (禁止暴露) |
| **Web 端口** | 3000 暴露 | ports: [] (禁止暴露) |
| **Admin 端口** | 3002 暴露 | ports: [] (禁止暴露) |
| **Nginx 端口** | 80 暴露 | 80/443 暴露 |
| **CORS** | * (允许所有) | 白名单（实际域名） |
| **API_PORT 注入** | ✅ 注入（localhost 访问） | ❌ 不注入（相对路径） |

---

## 🏠 本地开发测试流程

### 1. 首次设置

```bash
# 1.1 运行设置脚本
./setup-local-dev.sh

# 1.2 验证 .env 文件
cat .env | grep -E "(POSTGRES_|API_PORT|WEB_PORT|ADMIN_PORT)"
```

### 2. 构建镜像

```bash
# 2.1 构建所有服务
docker compose build

# 2.2 验证镜像
docker images | grep cohe-capitl-monorepo
```

**预期输出**:
```
cohe-capitl-monorepo-api     latest
cohe-capitl-monorepo-web     latest
cohe-capitl-monorepo-admin   latest
```

### 3. 启动服务

```bash
# 3.1 启动所有服务（自动加载 override.yml）
docker compose up -d

# 3.2 查看启动日志
docker compose logs -f

# 按 Ctrl+C 退出日志查看
```

### 4. 验证服务健康

```bash
# 4.1 检查服务状态
docker compose ps

# 4.2 验证所有服务都是 healthy
docker compose ps --format "table {{.Service}}\t{{.Status}}"
```

**预期输出**:
```
SERVICE   STATUS
admin     Up (healthy)
api       Up (healthy)
db        Up (healthy)
nginx     Up (healthy)
web       Up (healthy)
```

### 5. 测试端点访问

```bash
# 5.1 测试数据库连接（本地开发可访问）
psql -h localhost -U postgres -d web3_insurance -c "SELECT COUNT(*) FROM \"User\";"
# 输入密码: postgres

# 5.2 测试 API 健康检查
curl http://localhost:3001/healthz
# 预期: ok

# 5.3 测试 API 端点（直接访问）
curl http://localhost:3001/api/products
# 预期: JSON 数组

# 5.4 测试 Web 前端（直接访问）
curl -I http://localhost:3000/
# 预期: HTTP/1.1 307 Temporary Redirect

# 5.5 测试 Admin 后台（直接访问）
curl -I http://localhost:3002/
# 预期: HTTP/1.1 307 Temporary Redirect

# 5.6 测试 Nginx 反向代理
curl http://localhost/health
# 预期: healthy

# 5.7 测试通过 Nginx 访问 API
curl http://localhost/api/products
# 预期: JSON 数组
```

### 6. 验证本地开发特性

```bash
# 6.1 验证数据库端口暴露（本地开发特有）
nc -zv localhost 5432
# 预期: succeeded

# 6.2 验证所有服务端口都暴露
nc -zv localhost 3000  # Web
nc -zv localhost 3001  # API
nc -zv localhost 3002  # Admin
nc -zv localhost 80    # Nginx
```

### 7. 浏览器测试

```bash
# 7.1 打开浏览器测试（Linux/macOS）
open http://localhost:3000          # Web 用户端
open http://localhost:3002          # Admin 后台
open http://localhost:3001/api-docs # API 文档

# Windows
start http://localhost:3000
start http://localhost:3002
start http://localhost:3001/api-docs
```

### 8. 停止服务

```bash
# 8.1 停止所有服务
docker compose down

# 8.2 停止并删除所有数据（谨慎使用）
docker compose down -v
```

---

## 🚀 生产环境测试流程

### 阶段 1: 本地模拟生产（压测）

> ⚠️ 这一步在**本地**执行，用于在部署到真实服务器前进行完整测试

#### 1.1 准备生产环境变量

```bash
# 1.1.1 创建 .env.production
cp .env.production.example .env.production

# 1.1.2 编辑生产配置（重要！）
nano .env.production
```

**必须修改的变量**:
```bash
# 数据库
POSTGRES_PASSWORD=STRONG_PRODUCTION_PASSWORD

# JWT 密钥（生成强随机密钥）
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Admin Token
ADMIN_TOKEN=$(openssl rand -hex 32)

# 域名配置
SIWE_DOMAIN=yourdomain.com
SIWE_URI=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com

# Reown Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id
```

#### 1.2 构建生产镜像

```bash
# 1.2.1 清理旧镜像（可选）
docker compose down -v
docker system prune -af

# 1.2.2 构建生产镜像
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# 1.2.3 验证镜像
docker images | grep cohe-capitl-monorepo
```

#### 1.3 启动生产模式（本地）

```bash
# 1.3.1 启动生产配置
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 1.3.2 查看日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

#### 1.4 验证生产安全配置

```bash
# 1.4.1 检查服务状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 1.4.2 ⚠️ 验证数据库端口不可访问（生产特性）
nc -zv localhost 5432
# 预期: Connection refused ✅

# 1.4.3 ⚠️ 验证 API 端口不可访问（生产特性）
nc -zv localhost 3001
# 预期: Connection refused ✅

# 1.4.4 ⚠️ 验证 Web 端口不可访问（生产特性）
nc -zv localhost 3000
# 预期: Connection refused ✅

# 1.4.5 ⚠️ 验证 Admin 端口不可访问（生产特性）
nc -zv localhost 3002
# 预期: Connection refused ✅

# 1.4.6 ✅ 验证仅 Nginx 端口可访问
nc -zv localhost 80
# 预期: succeeded ✅
```

#### 1.5 测试通过 Nginx 访问

```bash
# 1.5.1 测试 Nginx 健康检查
curl http://localhost/health
# 预期: healthy

# 1.5.2 测试通过 Nginx 访问 API（唯一入口）
curl http://localhost/api/products
# 预期: JSON 数组

# 1.5.3 测试 Web 前端（通过 Nginx）
curl -I http://localhost/
# 预期: HTTP/1.1 200 或 307

# 1.5.4 测试 API 文档（通过 Nginx）
curl -I http://localhost/api-docs
# 预期: HTTP/1.1 200
```

#### 1.6 验证环境变量注入

```bash
# 1.6.1 检查 API 的 NODE_ENV
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api sh -c 'echo $NODE_ENV'
# 预期: production

# 1.6.2 检查 Web 的 NODE_ENV
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec web sh -c 'echo $NODE_ENV'
# 预期: production

# 1.6.3 验证 NEXT_PUBLIC_API_PORT 为空（生产特性）
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec web sh -c 'echo "API_PORT=[$NEXT_PUBLIC_API_PORT]"'
# 预期: API_PORT=[] （空值）
```

#### 1.7 停止本地生产测试

```bash
# 停止服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

---

### 阶段 2: 真实服务器部署

> ⚠️ 这一步在**生产服务器**上执行

#### 2.1 服务器准备

```bash
# 2.1.1 SSH 登录服务器
ssh user@your-production-server

# 2.1.2 安装 Docker 和 Docker Compose（如果未安装）
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2.1.3 克隆代码
git clone <your-repo-url>
cd cohe-capitl-monorepo
```

#### 2.2 配置生产环境

```bash
# 2.2.1 创建 .env.production
cp .env.production.example .env.production

# 2.2.2 编辑配置（使用生产密钥）
nano .env.production

# 2.2.3 创建必要目录
mkdir -p docker-volumes/db-data
mkdir -p docker-volumes/uploads/signatures
mkdir -p infra/nginx/certs  # 如果使用 HTTPS
```

#### 2.3 使用部署脚本

```bash
# 2.3.1 使用部署脚本（推荐）
./deploy.sh --prod --build

# 或手动执行
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

#### 2.4 验证生产部署

```bash
# 2.4.1 检查所有服务
docker compose ps

# 2.4.2 查看日志
docker compose logs -f

# 2.4.3 验证健康状态
docker compose ps --format "table {{.Service}}\t{{.Status}}"
```

#### 2.5 测试生产端点

```bash
# 2.5.1 测试 Nginx
curl http://your-domain.com/health
# 或本地测试
curl http://localhost/health

# 2.5.2 测试 API
curl http://your-domain.com/api/products

# 2.5.3 验证数据库不可从外部访问
telnet your-server-ip 5432
# 预期: Connection refused ✅
```

---

## ✅ 完整部署测试清单

### 本地开发环境测试 ✓

```bash
# 1. 构建和启动
[ ] docker compose build
[ ] docker compose up -d
[ ] docker compose ps (所有服务 healthy)

# 2. 端口测试
[ ] curl http://localhost:3001/healthz
[ ] curl http://localhost:3000/
[ ] curl http://localhost:3002/
[ ] curl http://localhost/health
[ ] psql -h localhost -U postgres (可连接)

# 3. 功能测试
[ ] 打开 http://localhost:3000（Web 正常）
[ ] 打开 http://localhost:3002（Admin 正常）
[ ] 打开 http://localhost:3001/api-docs（API 文档正常）
[ ] API 端点返回正确数据
```

### 本地模拟生产测试 ✓

```bash
# 1. 构建和启动
[ ] 创建 .env.production
[ ] docker compose -f docker-compose.yml -f docker-compose.prod.yml build
[ ] docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
[ ] docker compose ps (所有服务 healthy)

# 2. 安全验证（重要！）
[ ] nc -zv localhost 5432 (Connection refused ✅)
[ ] nc -zv localhost 3001 (Connection refused ✅)
[ ] nc -zv localhost 3000 (Connection refused ✅)
[ ] nc -zv localhost 3002 (Connection refused ✅)
[ ] nc -zv localhost 80 (Connected ✅)

# 3. 环境验证
[ ] docker exec cohe-api sh -c 'echo $NODE_ENV' (production)
[ ] docker exec cohe-web sh -c 'echo $NODE_ENV' (production)
[ ] docker exec cohe-web sh -c 'echo $NEXT_PUBLIC_API_PORT' (空值)

# 4. 功能测试
[ ] curl http://localhost/health (healthy)
[ ] curl http://localhost/api/products (正常返回)
[ ] curl http://localhost/ (Web 正常)
```

### 生产服务器部署测试 ✓

```bash
# 1. 服务器准备
[ ] SSH 连接成功
[ ] Docker 已安装
[ ] 代码已克隆
[ ] .env.production 已配置

# 2. 部署
[ ] ./deploy.sh --prod --build
[ ] docker compose ps (所有服务 healthy)
[ ] docker compose logs (无错误)

# 3. 外部访问测试
[ ] curl http://your-domain.com/health
[ ] curl http://your-domain.com/api/products
[ ] 浏览器访问 https://your-domain.com
[ ] 浏览器访问 https://admin.your-domain.com

# 4. 安全验证
[ ] telnet server-ip 5432 (refused)
[ ] telnet server-ip 3001 (refused)
[ ] telnet server-ip 3000 (refused)
[ ] telnet server-ip 3002 (refused)
[ ] 仅 80/443 端口可访问
```

---

## 🔧 常用命令速查

### 本地开发

```bash
# 启动
docker compose up -d

# 停止
docker compose down

# 重启某个服务
docker compose restart api

# 查看日志
docker compose logs -f api

# 重新构建
docker compose build --no-cache api

# 进入容器
docker compose exec api sh
```

### 生产环境

```bash
# 启动
./deploy.sh --prod

# 停止
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# 查看日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# 更新部署
./deploy.sh --prod --build

# 仅运行迁移
./deploy.sh --migrate

# 进入容器
docker compose exec api sh
```

---

## 🐛 故障排查

### 服务启动失败

```bash
# 查看详细日志
docker compose logs <service-name>

# 查看容器退出原因
docker compose ps -a

# 检查健康状态
docker inspect <container-name> | grep -A 10 Health
```

### 端口冲突

```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :5432

# 修改 .env 中的端口配置
```

### 镜像构建失败

```bash
# 清理缓存重新构建
docker system prune -af
docker compose build --no-cache
```

---

## 📚 相关文档

- [Docker Compose 三文件架构指南](./DOCKER_COMPOSE_GUIDE.md)
- [安全修复报告](./SECURITY_FIXES_2025-11-21.md)
- [部署指南](./DEPLOYMENT.md)
- [运维手册](./OPERATIONS.md)

---

**最后更新**: 2025-11-21  
**版本**: 1.0  
**维护者**: Cohe Capital DevOps Team
