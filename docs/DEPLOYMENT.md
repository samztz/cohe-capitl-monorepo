# 🚀 部署指南 - Cohe Capital 保险平台

> **使用 Docker Compose 的生产级部署指南**

---

## 📋 目录

1. [部署架构](#部署架构)
2. [前置要求](#前置要求)
3. [快速开始](#快速开始)
4. [详细部署步骤](#详细部署步骤)
5. [安全加固](#安全加固)
6. [运维指南](#运维指南)
7. [故障排除](#故障排除)

---

## 部署架构

### 文件结构

```
project/
├── docker-compose.yml           # 基础配置（所有环境共享）
├── docker-compose.override.yml  # 本地开发配置（自动加载）
├── docker-compose.prod.yml      # 生产环境配置（显式指定）
├── deploy.sh                    # 一键部署脚本
├── .env                         # 本地开发环境变量
├── .env.production              # 生产环境变量（不提交 git）
├── .env.production.example      # 生产环境变量模板
└── infra/nginx/
    ├── nginx.conf               # 路径路由配置（/admin）
    ├── nginx.dev.conf           # 开发子域名配置（*.localhost）
    └── nginx.prod.conf          # 生产子域名配置（*.domain.com）
```

### 配置文件选择逻辑

| 环境 | 命令 | 使用的配置文件 | Nginx 配置 |
|------|------|---------------|------------|
| **本地开发** | `docker compose up -d` | base + override (自动) | nginx.dev.conf (子域名) |
| **生产环境** | `./deploy.sh --prod` | base + prod (显式) | nginx.prod.conf (子域名) |
| **本地测试生产配置** | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` | base + prod | nginx.prod.conf |

---

## 前置要求

### 服务器配置

**最低规格**：
- **操作系统**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **CPU**: 2 核（生产建议 4 核+）
- **内存**: 4GB（生产建议 8GB+）
- **存储**: 20GB SSD（生产建议 50GB+）
- **网络**: 公网 IP，开放 80/443 端口

**软件依赖**：
- Docker Engine 24.0+
- Docker Compose 2.0+
- Git 2.0+

### 安装 Docker

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 一键安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

### 配置防火墙

```bash
# Ubuntu/Debian (使用 ufw)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL (使用 firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 快速开始

### 方法 1：使用自动化脚本（推荐）

```bash
# 1. 运行准备脚本
./scripts/prepare-production.sh

# 脚本会：
# - 生成强随机密钥（JWT_SECRET, ADMIN_TOKEN 等）
# - 创建 .env.production
# - 更新 nginx.prod.conf 中的域名
# - 显示 Admin Token（请保存！）

# 2. 执行部署
./deploy.sh --prod --build
```

### 方法 2：手动配置

```bash
# 1. 复制环境变量模板
cp .env.production.example .env.production

# 2. 编辑环境变量
nano .env.production
# 修改所有 CHANGE_ME 项

# 3. 更新 Nginx 配置中的域名
sed -i 's/your-domain.com/yourdomain.com/g' infra/nginx/nginx.prod.conf

# 4. 执行部署
./deploy.sh --prod --build
```

---

## 详细部署步骤

### 第一步：准备环境变量

#### 使用自动化脚本（推荐）

```bash
./scripts/prepare-production.sh
```

**脚本会询问你**：
1. 域名（如 `example.com`）
2. WalletConnect Project ID（从 https://cloud.reown.com/ 获取）

**脚本会生成**：
- `.env.production`（环境变量文件）
- 更新 `nginx.prod.conf`（自动替换域名）
- 显示 **Admin Token**（记得保存！）

#### 手动配置环境变量

```bash
# 1. 复制模板
cp .env.production.example .env.production

# 2. 生成密钥
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET (不同值)
openssl rand -hex 32     # ADMIN_TOKEN

# 3. 编辑 .env.production
nano .env.production
```

**必须修改的配置**：

```bash
# 数据库密码（强密码）
POSTGRES_PASSWORD=<强密码>

# JWT 密钥（使用上面生成的值）
JWT_SECRET=<生成的密钥1>
JWT_REFRESH_SECRET=<生成的密钥2>

# 管理员令牌（使用上面生成的值）
ADMIN_TOKEN=<生成的hex值>

# 域名配置（你的实际域名）
SIWE_DOMAIN=example.com
SIWE_URI=https://example.com
CORS_ORIGIN=https://example.com,https://admin.example.com

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<你的项目ID>
```

### 第二步：配置 DNS

在域名服务商（如 Cloudflare、阿里云）添加 A 记录：

| 类型 | 主机名 | 值（IP） | 说明 |
|------|--------|---------|------|
| A | @ | 服务器IP | 主域名（example.com） |
| A | www | 服务器IP | www 子域名 |
| A | admin | 服务器IP | Admin 后台子域名 |

**验证 DNS 生效**（等待 5-10 分钟）：
```bash
nslookup example.com
nslookup admin.example.com
```

### 第三步：执行部署

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 首次部署（包含构建）
./deploy.sh --prod --build

# 后续更新（不重新构建）
./deploy.sh --prod
```

**部署脚本会自动**：
1. 检查 Docker 和 Docker Compose
2. 验证 `.env.production` 存在
3. 构建 Docker 镜像（如使用 --build）
4. 启动数据库
5. 运行数据库迁移
6. 启动所有服务
7. 执行健康检查

### 第四步：验证部署

```bash
# 检查容器状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 期望输出：所有服务 STATUS 为 "Up (healthy)"
# cohe-db      Up (healthy)
# cohe-api     Up (healthy)
# cohe-web     Up (healthy)
# cohe-admin   Up (healthy)
# cohe-nginx   Up (healthy)
```

**测试健康检查端点**：

```bash
# Nginx 健康检查
curl http://example.com/health
# 期望输出: healthy

# API 健康检查
curl http://example.com/api/healthz
# 期望输出: "ok"
```

**浏览器测试**：
- Web 前端：`http://example.com`
- Admin 后台：`http://admin.example.com`
- API 文档：`http://example.com/api-docs`

---

## 安全加固

### 1. 配置 HTTPS（强烈推荐）

#### 使用 Let's Encrypt（免费）

```bash
# 1. 安装 Certbot
sudo apt-get install certbot

# 2. 临时停止服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop nginx

# 3. 获取证书
sudo certbot certonly --standalone \
  -d example.com \
  -d www.example.com \
  -d admin.example.com \
  --email your@email.com \
  --agree-tos

# 4. 复制证书到项目
sudo mkdir -p infra/nginx/certs
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem infra/nginx/certs/
sudo cp /etc/letsencrypt/live/example.com/privkey.pem infra/nginx/certs/
sudo chown -R $USER:$USER infra/nginx/certs/

# 5. 配置 Docker Compose（取消注释）
nano docker-compose.prod.yml
# 取消注释以下行：
# - "443:443"
# - ./infra/nginx/certs:/etc/nginx/certs:ro

# 6. 配置 Nginx（取消注释 HTTPS 配置）
nano infra/nginx/nginx.prod.conf

# 7. 重启服务
./deploy.sh --prod
```

#### 证书自动续期

```bash
# 添加定时任务
sudo crontab -e

# 每月 1 号凌晨 3 点自动续期
0 3 1 * * certbot renew --quiet && docker compose -f /path/to/project/docker-compose.yml -f /path/to/project/docker-compose.prod.yml restart nginx
```

### 2. 修改默认端口（可选）

```bash
# 编辑 docker-compose.prod.yml
nano docker-compose.prod.yml

# 修改 Nginx 映射端口（例如改为 8080:80）
# 然后更新防火墙规则
```

### 3. 限制 CORS Origin

确保 `.env.production` 中：
```bash
CORS_ORIGIN=https://example.com,https://admin.example.com
# 不要使用 CORS_ORIGIN=*（不安全）
```

### 4. 启用 Rate Limiting（可选）

编辑 `infra/nginx/nginx.prod.conf`，添加：
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api {
    limit_req zone=api_limit burst=20 nodelay;
    # ... 其他配置
}
```

---

## 运维指南

### 日志查看

```bash
# 所有服务日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# 特定服务日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api

# 最近 100 行
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 api
```

### 重启服务

```bash
# 重启所有服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# 重启单个服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api
```

### 数据库备份

```bash
# 手动备份
docker exec cohe-db pg_dump -U cohe_user cohe_capital > backup-$(date +%Y%m%d).sql

# 自动备份（添加到 crontab）
0 2 * * * docker exec cohe-db pg_dump -U cohe_user cohe_capital > /backup/db-$(date +\%Y\%m\%d).sql
```

### 更新代码

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建并部署
./deploy.sh --prod --build
```

### 数据库迁移

```bash
# 查看迁移状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api pnpm prisma migrate status

# 应用迁移
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api pnpm prisma migrate deploy
```

---

## 故障排除

### Q1: 部署后访问域名显示 502

**原因**: 后端服务未启动或 Nginx 配置错误

**解决**:
```bash
# 检查服务状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 查看 API 日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api

# 检查 Nginx 配置
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -t
```

### Q2: CORS 错误

**原因**: `CORS_ORIGIN` 配置不正确

**解决**:
```bash
# 检查 .env.production
grep CORS_ORIGIN .env.production

# 应该是：
CORS_ORIGIN=https://example.com,https://admin.example.com

# 修改后重启 API
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api
```

### Q3: 数据库连接失败

**原因**: 数据库未启动或密码错误

**解决**:
```bash
# 检查数据库容器
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps db

# 检查数据库日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs db

# 测试数据库连接
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U cohe_user -d cohe_capital
```

### Q4: SSL 证书问题

**原因**: 证书路径不正确或未挂载

**解决**:
```bash
# 检查证书文件
ls -la infra/nginx/certs/

# 检查 Nginx 容器内证书
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx ls -la /etc/nginx/certs/

# 查看 Nginx 错误日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs nginx | grep -i ssl
```

### Q5: 钱包登录失败

**原因**: `SIWE_DOMAIN` 配置不正确

**解决**:
```bash
# 检查 .env.production
grep SIWE_DOMAIN .env.production

# 应该是你的实际域名（不带 https://）
# 如果不对，修改后重启 API
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api
```

---

## 部署后清单

- [ ] 所有容器状态为 healthy
- [ ] 可以通过域名访问 Web 前端
- [ ] 可以通过子域名访问 Admin 后台
- [ ] API 健康检查返回正常
- [ ] HTTPS 证书有效（如已配置）
- [ ] HTTP 自动重定向到 HTTPS（如已配置）
- [ ] 钱包登录功能正常
- [ ] Admin Token 登录正常
- [ ] 数据库备份策略已配置
- [ ] 防火墙规则已配置
- [ ] DNS 记录已生效
- [ ] 所有密钥已更换为强随机值
- [ ] `.env.production` 未提交到 Git

---

## 相关文档

- [本地开发指南](./LOCAL_DEVELOPMENT.md)
- [运维指南](./OPERATIONS.md)
- [变更日志](./CHANGELOG.md)
- [项目路线图](./ROADMAP.md)

---

**最后更新**: 2025-11-26
