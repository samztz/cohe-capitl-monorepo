# 🚀 生产环境部署检查清单

## 📋 部署前准备（在本地完成）

### 1. 环境变量配置

```bash
# 复制生产环境变量模板
cp .env.production.example .env.production

# 编辑配置（必须修改所有 CHANGE_ME 项）
nano .env.production
```

**必须修改的配置**：

| 配置项 | 说明 | 生成方法 |
|--------|------|---------|
| `POSTGRES_PASSWORD` | 数据库密码 | 强密码，至少 16 位 |
| `JWT_SECRET` | JWT 密钥 | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | 刷新令牌密钥 | `openssl rand -base64 32`（不同于上面） |
| `ADMIN_TOKEN` | 管理员令牌 | `openssl rand -hex 32` |
| `SIWE_DOMAIN` | 网站域名 | 你的实际域名（如 `example.com`） |
| `SIWE_URI` | 网站 URI | `https://example.com` |
| `CORS_ORIGIN` | CORS 允许域名 | `https://example.com,https://admin.example.com` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect ID | 从 https://cloud.reown.com/ 获取 |

**生成密钥示例**：
```bash
# JWT_SECRET
openssl rand -base64 32
# 输出: Kx7vN2mP9qR3sT5uW8xY1zA4bC6dE0fG2hJ3kL5mN7o=

# JWT_REFRESH_SECRET (必须不同)
openssl rand -base64 32
# 输出: aB3cD5eF7gH9iJ1kL3mN5oP7qR9sT1uV3wX5yZ7aB9c=

# ADMIN_TOKEN
openssl rand -hex 32
# 输出: 4f8a2b9c3d6e1f7a0b5c8d2e9f3a6b1c4d7e0f3a6b9c2d5e8f1a4b7c0d3e6f9a
```

**完整配置示例**：
```bash
# .env.production

# 数据库
POSTGRES_USER=cohe_user
POSTGRES_PASSWORD=Y0urStr0ngP@ssw0rd2024!
POSTGRES_DB=cohe_capital

# JWT
JWT_SECRET=Kx7vN2mP9qR3sT5uW8xY1zA4bC6dE0fG2hJ3kL5mN7o=
JWT_REFRESH_SECRET=aB3cD5eF7gH9iJ1kL3mN5oP7qR9sT1uV3wX5yZ7aB9c=

# 管理员
ADMIN_TOKEN=4f8a2b9c3d6e1f7a0b5c8d2e9f3a6b1c4d7e0f3a6b9c2d5e8f1a4b7c0d3e6f9a

# 域名配置
SIWE_DOMAIN=example.com
SIWE_URI=https://example.com
CORS_ORIGIN=https://example.com,https://admin.example.com

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=e1d4344896342c6efb5aab6396d3ae24

# 其他默认值保持不变...
```

---

### 2. Nginx 域名配置

编辑 `infra/nginx/nginx.prod.conf`，替换所有占位符域名：

```bash
# 查找需要替换的域名
grep -n "your-domain.com" infra/nginx/nginx.prod.conf

# 使用 sed 批量替换（或手动编辑）
sed -i 's/your-domain.com/example.com/g' infra/nginx/nginx.prod.conf
```

**需要替换的位置**（共3处）：
- 第 71 行：`server_name your-domain.com www.your-domain.com;`
- 第 152 行：`server_name admin.your-domain.com;`
- 注释中的示例

---

### 3. 提交代码到 Git

```bash
# 确保 .env.production 不会被提交
echo ".env.production" >> .gitignore

# 提交其他修改
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

---

## 🖥️ 服务器准备（在生产服务器执行）

### 1. 服务器基础要求

- **操作系统**：Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **CPU**：最低 2 核（推荐 4 核）
- **内存**：最低 4GB（推荐 8GB）
- **硬盘**：最低 20GB 可用空间
- **网络**：公网 IP，开放 80/443 端口

### 2. 安装 Docker 和 Docker Compose

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version

# 添加当前用户到 docker 组（可选，避免每次 sudo）
sudo usermod -aG docker $USER
# 重新登录使生效
```

### 3. 配置防火墙

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

### 4. 配置 DNS 解析

在你的域名服务商（如 Cloudflare, Namecheap, GoDaddy）添加 A 记录：

```
类型    主机名    值（服务器 IP）    TTL
A      @         123.45.67.89      自动
A      www       123.45.67.89      自动
A      admin     123.45.67.89      自动
```

**验证 DNS 生效**：
```bash
# 等待 5-10 分钟后检查
nslookup example.com
nslookup admin.example.com
```

---

## 📦 代码部署

### 方法 A：从 Git 克隆（推荐）

```bash
# 1. 克隆代码
git clone https://github.com/your-username/cohe-capital-monorepo.git
cd cohe-capital-monorepo

# 2. 创建生产环境变量文件
cp .env.production.example .env.production

# 3. 编辑环境变量（填写实际值）
nano .env.production

# 4. 确认 nginx.prod.conf 域名已替换
grep "server_name" infra/nginx/nginx.prod.conf
```

### 方法 B：通过 SCP 上传

```bash
# 在本地执行
scp -r ./* user@your-server:/path/to/cohe-capital-monorepo/
```

---

## 🔐 SSL/TLS 证书配置（可选但强烈推荐）

### 使用 Let's Encrypt（免费）

```bash
# 1. 安装 Certbot
sudo apt-get update
sudo apt-get install certbot

# 2. 临时停止服务（如果已运行）
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# 3. 获取证书（standalone 模式）
sudo certbot certonly --standalone \
  -d example.com \
  -d www.example.com \
  -d admin.example.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# 4. 证书路径
# /etc/letsencrypt/live/example.com/fullchain.pem
# /etc/letsencrypt/live/example.com/privkey.pem

# 5. 复制证书到项目
sudo mkdir -p infra/nginx/certs
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem infra/nginx/certs/
sudo cp /etc/letsencrypt/live/example.com/privkey.pem infra/nginx/certs/
sudo chown -R $USER:$USER infra/nginx/certs/
sudo chmod 644 infra/nginx/certs/*

# 6. 配置 Docker Compose 挂载证书
nano docker-compose.prod.yml
# 取消注释以下行：
# - "443:443"
# - ./infra/nginx/certs:/etc/nginx/certs:ro

# 7. 配置 Nginx HTTPS
nano infra/nginx/nginx.prod.conf
# 取消注释 HTTPS server 块（第 228-316 行）
# 取消注释 HTTP->HTTPS 重定向（第 227-237 行）
```

### 证书自动续期

```bash
# 添加定时任务
sudo crontab -e

# 每月 1 号凌晨 3 点自动续期
0 3 1 * * certbot renew --quiet && docker compose -f /path/to/cohe-capital-monorepo/docker-compose.yml -f /path/to/cohe-capital-monorepo/docker-compose.prod.yml restart nginx
```

---

## 🚀 执行部署

### 使用部署脚本（推荐）

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行生产部署
./deploy.sh --prod

# 或带构建（首次部署或代码更新后）
./deploy.sh --prod --build
```

### 手动部署

```bash
# 1. 构建镜像
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# 2. 启动服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. 查看日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

---

## ✅ 部署验证

### 1. 检查容器状态

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 期望输出：所有服务 STATUS 为 "Up" 且 healthy
# cohe-db      Up (healthy)
# cohe-api     Up (healthy)
# cohe-web     Up (healthy)
# cohe-admin   Up (healthy)
# cohe-nginx   Up (healthy)
```

### 2. 测试健康检查端点

```bash
# Nginx 健康检查
curl http://example.com/health
# 期望输出: healthy

# API 健康检查
curl https://example.com/api/healthz
# 期望输出: "ok"
```

### 3. 测试 Web 前端

```bash
# 访问首页
curl -I https://example.com
# 期望: 200 OK

# 在浏览器打开
# https://example.com
# 应该看到 Cohe Capital 首页
```

### 4. 测试 Admin 后台

```bash
# 访问管理面板
curl -I https://admin.example.com
# 期望: 200 OK

# 在浏览器打开
# https://admin.example.com
# 应该看到管理员登录页
```

### 5. 测试 API 文档

```
浏览器访问: https://example.com/api-docs
应该看到 Swagger API 文档
```

### 6. 功能测试

- [ ] Web 端连接钱包登录
- [ ] 浏览保单 SKU 列表
- [ ] 创建保单
- [ ] 签署保单
- [ ] 支付确认
- [ ] Admin 登录（使用 ADMIN_TOKEN）
- [ ] Admin 审核保单

---

## 📊 监控和维护

### 查看日志

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

---

## ⚠️ 常见问题

### Q1: 部署后访问域名显示 502

**原因**：后端服务未启动或 Nginx 配置错误

**解决**：
```bash
# 检查服务状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 查看 API 日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api

# 检查 Nginx 配置
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -t
```

### Q2: CORS 错误

**原因**：`CORS_ORIGIN` 配置不正确

**解决**：
```bash
# 检查 .env.production
grep CORS_ORIGIN .env.production

# 应该是：
CORS_ORIGIN=https://example.com,https://admin.example.com

# 修改后重启 API
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api
```

### Q3: SSL 证书问题

**原因**：证书路径不正确或未挂载

**解决**：
```bash
# 检查证书文件
ls -la infra/nginx/certs/

# 检查 Nginx 容器内证书
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx ls -la /etc/nginx/certs/

# 查看 Nginx 错误日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs nginx | grep -i ssl
```

---

## 📝 部署后清单

- [ ] 所有容器状态为 healthy
- [ ] 可以通过域名访问 Web 前端
- [ ] 可以通过子域名访问 Admin 后台
- [ ] API 健康检查返回正常
- [ ] HTTPS 证书有效
- [ ] HTTP 自动重定向到 HTTPS
- [ ] 钱包登录功能正常
- [ ] Admin Token 登录正常
- [ ] 数据库备份策略已配置
- [ ] 监控告警已配置（可选）
- [ ] 防火墙规则已配置
- [ ] DNS 记录已生效
- [ ] 所有密钥已更换为强随机值
- [ ] `.env.production` 未提交到 Git

---

## 🎯 下一步优化

1. **配置监控**：
   - 部署 Prometheus + Grafana
   - 配置服务健康告警

2. **性能优化**：
   - 启用 CDN（Cloudflare）
   - 配置 Redis 缓存

3. **安全加固**：
   - 配置 WAF（Web Application Firewall）
   - 启用 DDoS 防护

4. **CI/CD**：
   - GitHub Actions 自动部署
   - 自动化测试

---

**祝你部署顺利！** 🚀
