# 生产环境部署指南

## 📋 部署架构概览

### 文件结构

```
project/
├── docker-compose.yml           # 基础配置（所有环境共享）
├── docker-compose.override.yml  # 本地开发配置（自动加载）
├── docker-compose.prod.yml      # 生产环境配置（显式指定）
├── deploy.sh                    # 一键部署脚本
├── .env                         # 本地开发环境变量
├── .env.production              # 生产环境变量（不提交 git）
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

## 🚀 生产环境部署步骤

### 第一步：准备生产环境变量

```bash
# 1. 复制生产环境变量模板
cp .env.production.example .env.production

# 2. 编辑生产环境变量
nano .env.production
```

**必须修改的关键配置**：

```bash
# ============================================
# 安全密钥（使用强随机值）
# ============================================
# 生成方法：openssl rand -base64 32
JWT_SECRET=生成的强随机密钥
JWT_REFRESH_SECRET=生成的另一个强随机密钥
ADMIN_TOKEN=生成的管理员令牌
POSTGRES_PASSWORD=强数据库密码

# ============================================
# 域名配置（生产环境）
# ============================================
# Web 服务域名（用户前端）
SIWE_DOMAIN=yourdomain.com
SIWE_URI=https://yourdomain.com

# CORS 配置（严格限制）
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com

# ============================================
# 数据库持久化路径
# ============================================
# 生产环境：建议使用绝对路径或挂载点
DB_DATA_PATH=/var/lib/cohe-capital/db-data
UPLOADS_PATH=/var/lib/cohe-capital/uploads

# ============================================
# Nginx 端口
# ============================================
NGINX_HTTP_PORT=80
# NGINX_HTTPS_PORT=443  # 配置 SSL 后取消注释
```

---

### 第二步：配置域名和 DNS

#### 方案 A：使用子域名（推荐）

**DNS 配置**：
```
A    yourdomain.com        → 服务器IP
A    www.yourdomain.com    → 服务器IP
A    admin.yourdomain.com  → 服务器IP
```

**Nginx 配置（已在 nginx.prod.conf 中配置）**：
- `yourdomain.com` / `www.yourdomain.com` → Web 前端
- `admin.yourdomain.com` → Admin 后台

**优点**：
- ✅ 完全隔离，不会冲突
- ✅ 可以独立部署和扩展
- ✅ 更好的安全性

#### 方案 B：使用路径路由

**DNS 配置**：
```
A    yourdomain.com        → 服务器IP
```

**Nginx 配置（需要使用 nginx.conf）**：
- `yourdomain.com/` → Web 前端
- `yourdomain.com/admin` → Admin 后台

**缺点**：
- ⚠️ `/admin` 路径与 Next.js 路由可能冲突
- ⚠️ 不推荐用于生产环境

---

### 第三步：配置 SSL/TLS 证书（推荐）

#### 使用 Let's Encrypt（免费）

```bash
# 1. 安装 Certbot
sudo apt-get update
sudo apt-get install certbot

# 2. 停止 Nginx（临时）
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop nginx

# 3. 获取证书（使用 standalone 模式）
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d admin.yourdomain.com \
  --email your@email.com \
  --agree-tos

# 4. 证书会被保存到：
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# 5. 复制证书到项目目录
sudo mkdir -p infra/nginx/certs
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infra/nginx/certs/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infra/nginx/certs/
sudo chown $(whoami):$(whoami) infra/nginx/certs/*

# 6. 更新 docker-compose.prod.yml（取消注释 HTTPS 端口）
# ports:
#   - "80:80"
#   - "443:443"  # ← 取消注释
# volumes:
#   - ./infra/nginx/certs:/etc/nginx/certs:ro  # ← 取消注释

# 7. 更新 nginx.prod.conf（取消注释 HTTPS server 块）
```

#### 更新 nginx.prod.conf 启用 HTTPS

在 `infra/nginx/nginx.prod.conf` 中：

1. 找到注释的 HTTPS server 块（第 228-316 行）
2. 取消注释并更新域名：
   ```nginx
   server {
       listen 443 ssl http2;
       listen [::]:443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;  # 改为你的域名

       ssl_certificate /etc/nginx/certs/fullchain.pem;
       ssl_certificate_key /etc/nginx/certs/privkey.pem;

       # ... 其他配置保持不变
   }
   ```

3. 取消注释 HTTP → HTTPS 重定向（第 227-237 行）

---

### 第四步：部署到生产服务器

#### 方法 A：使用部署脚本（推荐）

```bash
# 1. 一键生产部署
./deploy.sh --prod

# 2. 生产部署 + 强制重新构建镜像
./deploy.sh --prod --build

# 3. 查看日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

#### 方法 B：手动部署

```bash
# 1. 确保 .env.production 存在
ls -la .env.production

# 2. 创建符号链接（脚本会自动做）
ln -sf .env.production .env

# 3. 构建镜像
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# 4. 启动服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. 检查服务状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 6. 查看日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api
```

---

### 第五步：验证部署

#### 健康检查

```bash
# 1. 检查所有容器运行状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 应该看到所有服务都是 healthy 状态：
# cohe-db      healthy
# cohe-api     healthy
# cohe-web     healthy
# cohe-admin   healthy
# cohe-nginx   healthy

# 2. 测试 Nginx 健康端点
curl http://yourdomain.com/health
# 应返回: healthy

# 3. 测试 API 健康端点
curl https://yourdomain.com/api/healthz
# 应返回: "ok"

# 4. 测试 API 文档
curl -I https://yourdomain.com/api-docs
# 应返回: 200 OK
```

#### 功能测试

1. **Web 前端**：
   ```
   访问: https://yourdomain.com
   - 应该看到首页
   - 连接钱包测试登录
   ```

2. **Admin 后台**：
   ```
   访问: https://admin.yourdomain.com
   - 应该看到登录页
   - 使用 ADMIN_TOKEN 登录
   ```

3. **API 调用**：
   ```bash
   # 测试公开接口
   curl https://yourdomain.com/api/skus

   # 应返回 SKU 列表 JSON
   ```

---

## 🔐 生产环境安全检查清单

### 必须完成的安全配置

- [ ] ✅ **强密码和密钥**
  - JWT_SECRET 使用 256-bit 随机值
  - JWT_REFRESH_SECRET 使用不同的 256-bit 随机值
  - POSTGRES_PASSWORD 使用强密码
  - ADMIN_TOKEN 使用安全令牌

- [ ] ✅ **CORS 严格限制**
  - 不要使用 `CORS_ORIGIN=*`
  - 只允许实际域名：`https://yourdomain.com,https://admin.yourdomain.com`

- [ ] ✅ **HTTPS/TLS 启用**
  - 配置 SSL 证书
  - 强制 HTTP → HTTPS 重定向
  - 启用 HSTS 头

- [ ] ✅ **数据库端口不暴露**
  - `docker-compose.prod.yml` 中 `db.ports: []`
  - 只允许 Docker 内部网络访问

- [ ] ✅ **API/Web/Admin 端口不暴露**
  - 生产环境所有服务 `ports: []`
  - 只通过 Nginx 访问

- [ ] ✅ **环境变量不提交**
  - `.env.production` 加入 `.gitignore`
  - 密钥不出现在代码中

- [ ] ✅ **防火墙配置**
  ```bash
  # 只开放必要端口
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw allow 22/tcp    # SSH
  sudo ufw enable
  ```

### 推荐的安全加固

- [ ] 🔒 **Rate Limiting**
  - Nginx 已配置基础限流
  - API: 10 req/s
  - General: 30 req/s

- [ ] 🔒 **定期备份数据库**
  ```bash
  # 自动备份脚本
  crontab -e
  # 每天凌晨 2 点备份
  0 2 * * * docker exec cohe-db pg_dump -U postgres web3_insurance > /backup/db-$(date +\%Y\%m\%d).sql
  ```

- [ ] 🔒 **日志监控**
  ```bash
  # 配置日志收集和告警
  docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=100 > /var/log/cohe-capital.log
  ```

- [ ] 🔒 **定期更新依赖**
  ```bash
  # 定期重新构建镜像（更新安全补丁）
  docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
  ```

---

## 🔄 生产环境运维

### 重启服务

```bash
# 重启单个服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api

# 重启所有服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# 重新部署（拉取最新代码）
./deploy.sh --prod --build
```

### 查看日志

```bash
# 实时查看所有日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api

# 查看最近 100 行
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 api
```

### 数据库维护

```bash
# 进入数据库容器
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U postgres -d web3_insurance

# 手动备份
docker exec cohe-db pg_dump -U postgres web3_insurance > backup-$(date +%Y%m%d).sql

# 恢复备份
cat backup-20250115.sql | docker exec -i cohe-db psql -U postgres -d web3_insurance
```

### 数据库迁移

```bash
# 仅运行迁移（不重启服务）
./deploy.sh --prod --migrate

# 或手动运行
docker compose -f docker-compose.yml -f docker-compose.prod.yml up db-init
```

### 更新代码部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建并部署
./deploy.sh --prod --build

# 或分步操作：
# docker compose -f docker-compose.yml -f docker-compose.prod.yml build
# docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 📊 性能优化（可选）

### 资源限制

取消 `docker-compose.prod.yml` 中的 `deploy.resources` 注释：

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 扩展服务（负载均衡）

```bash
# 运行多个 API 实例
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale api=3

# 需要配置 Nginx upstream 负载均衡
```

---

## ⚠️ 常见问题

### Q1: 部署后 CORS 错误

**症状**：浏览器控制台显示 CORS 错误

**解决方案**：
1. 检查 `.env.production` 中的 `CORS_ORIGIN`
2. 确保使用完整 URL（包括 `https://`）
3. 多个域名用逗号分隔，**不要有空格**
4. 重启 API 服务：
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api
   ```

### Q2: 钱包登录失败（SIWE 错误）

**症状**：签名验证失败

**解决方案**：
1. 检查 `SIWE_DOMAIN` 是否与访问域名一致
2. 检查 `SIWE_URI` 协议（https:// 还是 http://）
3. 清除浏览器缓存
4. 重启 API 服务

### Q3: 数据库连接失败

**症状**：API 容器无法启动，日志显示数据库连接错误

**解决方案**：
```bash
# 1. 检查数据库容器状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps db

# 2. 查看数据库日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs db

# 3. 检查 DATABASE_URL 配置
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec api env | grep DATABASE_URL

# 4. 手动测试连接
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db pg_isready -U postgres
```

### Q4: Nginx 502 Bad Gateway

**症状**：访问网站显示 502 错误

**解决方案**：
```bash
# 1. 检查后端服务是否运行
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 2. 查看 Nginx 日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs nginx

# 3. 查看后端服务日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api web admin

# 4. 检查服务健康状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nc -zv api 3001
```

---

## 📝 部署检查清单

部署前检查：
- [ ] `.env.production` 已正确配置
- [ ] DNS 记录已添加并生效
- [ ] SSL 证书已获取（如果使用 HTTPS）
- [ ] `nginx.prod.conf` 中的域名已更新
- [ ] 防火墙规则已配置

部署后验证：
- [ ] 所有容器状态为 healthy
- [ ] `/health` 端点返回 healthy
- [ ] `/api/healthz` 端点返回 ok
- [ ] Web 前端可访问
- [ ] Admin 后台可访问
- [ ] 钱包登录功能正常
- [ ] API 调用正常
- [ ] HTTPS 证书有效
- [ ] HTTP 自动重定向到 HTTPS

---

## 🎯 下一步

1. **配置监控**：
   - 使用 Prometheus + Grafana
   - 配置告警规则

2. **设置 CI/CD**：
   - GitHub Actions 自动部署
   - 自动化测试

3. **数据备份策略**：
   - 自动化备份脚本
   - 异地备份

4. **性能优化**：
   - 启用 CDN
   - Redis 缓存
   - 数据库查询优化

---

**祝你部署顺利！** 🚀
