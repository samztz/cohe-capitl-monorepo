# ⚙️ Cohe Capital 运维指南

本文档提供 Cohe Capital 平台的日常运维操作指南，包括 Docker Compose 架构、部署流程、日志查看、资源监控、数据库备份、证书管理等常见运维任务。

**适用环境**: Docker Compose 部署
**最后更新**: 2025-11-21

---

## 目录

1. [Docker Compose 架构](#docker-compose-架构)
2. [部署与测试流程](#部署与测试流程)
3. [日志管理](#日志管理)
4. [资源监控](#资源监控)
5. [数据库备份与恢复](#数据库备份与恢复)
6. [容器管理](#容器管理)
7. [健康检查](#健康检查)
8. [证书管理](#证书管理)
9. [常见运维操作](#常见运维操作)
10. [故障排查](#故障排查)

---

## Docker Compose 架构

### 📁 三文件架构

```
项目根目录/
├── docker-compose.yml          # 共性配置（所有环境通用）
├── docker-compose.override.yml # 本地开发配置（自动加载）
└── docker-compose.prod.yml     # 生产环境配置（显式指定）
```

### 🎯 三种使用场景

#### 1. 日常本地开发（最常用）

```bash
docker compose up -d
```

**自动合并**: `docker-compose.yml` + `docker-compose.override.yml`

**特点**:
- ✅ 所有端口暴露（方便调试）
- ✅ NODE_ENV=development
- ✅ 数据库种子数据自动加载
- ✅ 数据库端口 5432 可访问（Prisma Studio、pgAdmin）
- ✅ restart: unless-stopped

**访问地址**:
- Web: http://localhost:3000
- Admin: http://localhost:3002
- API: http://localhost:3001/api
- API Docs: http://localhost:3001/api-docs
- Database: localhost:5432
- **Nginx**: http://localhost/ (推荐通过 Nginx 访问)

#### 2. 本地模拟生产（部署前压测）

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

**合并**: `docker-compose.yml` + `docker-compose.prod.yml`（覆盖 override）

**特点**:
- ⚠️ 端口不暴露（仅通过 Nginx 访问）
- ⚠️ NODE_ENV=production
- ⚠️ 不自动加载种子数据
- ✅ restart: always
- ✅ 与生产环境 100% 一致

**用途**:
- 部署前的最终验证
- 性能测试和压测
- 问题复现（与生产环境一致）

#### 3. 生产部署

```bash
# 使用部署脚本
./deploy.sh --prod

# 或手动部署
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 配置差异对比

| 配置项 | 本地开发 (override) | 生产环境 (prod) |
|--------|---------------------|-----------------|
| **NODE_ENV** | development | production |
| **restart** | unless-stopped | always |
| **数据库端口** | 5432 暴露 | 不暴露 |
| **API 端口** | 3001 暴露 | 不暴露 |
| **Web 端口** | 3000 暴露 | 不暴露 |
| **Admin 端口** | 3002 暴露 | 不暴露 |
| **Nginx 端口** | 80 暴露 | 80/443 暴露 |
| **数据库种子** | 自动加载 | 不加载 |
| **API 直连** | ✅ 支持 localhost:3001 | ❌ 仅通过 Nginx |

---

## 部署与测试流程

### 本地开发测试

```bash
# 1. 启动服务
docker compose up -d

# 2. 查看服务状态
docker compose ps

# 3. 查看日志
docker compose logs -f

# 4. 测试各服务
# Web
curl http://localhost:3000
curl http://localhost/  # 通过 Nginx

# Admin
curl http://localhost:3002
curl http://localhost/admin  # 通过 Nginx

# API
curl http://localhost:3001/api/healthz
curl http://localhost/api/healthz  # 通过 Nginx

# 5. 停止服务
docker compose down
```

### 生产环境测试

```bash
# 1. 停止本地开发环境
docker compose down

# 2. 启动生产模式
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. 等待服务健康
sleep 30

# 4. 测试（仅通过 Nginx 访问）
curl http://localhost/
curl http://localhost/admin
curl http://localhost/api/healthz

# 5. 性能测试
ab -n 1000 -c 10 http://localhost/

# 6. 清理
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### 完整部署测试清单

**部署前检查**:
- [ ] 环境变量配置完整（`.env` 文件）
- [ ] 数据库迁移文件已准备
- [ ] SSL 证书已配置（生产环境）
- [ ] CORS 白名单已设置
- [ ] 备份了现有数据

**部署步骤**:
1. [ ] 拉取最新代码
2. [ ] 构建镜像：`docker compose build`
3. [ ] 启动服务：`docker compose up -d`
4. [ ] 等待健康检查通过：`docker compose ps`
5. [ ] 运行数据库迁移（如需要）
6. [ ] 验证所有服务可访问

**部署后验证**:
- [ ] Web 前端加载正常
- [ ] Admin 后台可登录
- [ ] API 健康检查通过
- [ ] 数据库连接正常
- [ ] 日志无错误

**回滚步骤**（如需要）:
```bash
# 1. 停止当前服务
docker compose down

# 2. 恢复数据库备份
docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB < backup.sql

# 3. 切换到旧版本镜像
docker compose pull  # 拉取指定版本
docker compose up -d
```

---

## 日志管理

### 查看所有容器日志

```bash
# 查看所有服务日志 (实时)
docker compose logs -f

# 查看最近 100 行
docker compose logs --tail=100

# 查看特定时间段
docker compose logs --since 1h
docker compose logs --since "2025-01-20T10:00:00"
```

### 查看单个服务日志

```bash
# API 服务
docker compose logs -f api

# Web 前端
docker compose logs -f web

# Admin 后台
docker compose logs -f admin

# 数据库
docker compose logs -f db

# Nginx
docker compose logs -f nginx
```

### 过滤日志

```bash
# 只看错误日志
docker compose logs api | grep -i error

# 只看特定关键词
docker compose logs api | grep "Policy"

# 保存日志到文件
docker compose logs api > api.log
```

### API 日志级别

API 服务使用 Pino 日志系统，日志级别：

- `fatal` (60): 致命错误
- `error` (50): 错误
- `warn` (40): 警告
- `info` (30): 信息
- `debug` (20): 调试
- `trace` (10): 追踪

**日志格式** (JSON):

```json
{
  "level": 30,
  "time": 1705800000000,
  "pid": 1,
  "hostname": "api-container",
  "context": "PolicyService",
  "msg": "Policy created successfully",
  "policyId": "uuid-here"
}
```

### 日志轮转 (生产环境建议)

使用 Docker 日志驱动配置日志轮转：

```yaml
# docker-compose.yml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"      # 单个日志文件最大 10MB
        max-file: "5"        # 保留最近 5 个文件
```

---

## 资源监控

### 实时监控容器资源

```bash
# 查看所有容器资源使用
docker stats

# 查看特定容器
docker stats cohe-capitl-monorepo-api-1

# 持续监控
watch -n 2 'docker stats --no-stream'
```

**输出示例**:

```
CONTAINER ID   NAME                   CPU %     MEM USAGE / LIMIT     MEM %
abc123         cohe-api-1             5.2%      256MB / 2GB          12.8%
def456         cohe-web-1             1.1%      128MB / 1GB          12.5%
ghi789         cohe-db-1              3.4%      512MB / 4GB          12.8%
```

### 磁盘使用情况

```bash
# 查看 Docker 磁盘占用
docker system df

# 详细信息
docker system df -v

# 查看卷使用情况
docker volume ls
docker volume inspect postgres-data
```

### 清理未使用资源

```bash
# 清理未使用的容器、网络、镜像 (慎用！)
docker system prune -a

# 只清理已停止的容器
docker container prune

# 清理未使用的卷 (会删除数据！)
docker volume prune
```

### 性能监控建议

**生产环境推荐集成**:

1. **Prometheus + Grafana**
   - 收集容器指标
   - 可视化 Dashboard
   - 告警规则

2. **Sentry**
   - 错误追踪
   - 性能监控
   - 用户会话重放

3. **Uptime Robot**
   - 健康检查监控
   - 邮件/短信告警
   - 状态页面

---

## 数据库备份与恢复

### 手动备份

```bash
# 完整备份 (推荐)
docker compose exec db pg_dump -U cohe_user cohe_capital_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份 (节省空间)
docker compose exec db pg_dump -U cohe_user cohe_capital_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 备份到容器内
docker compose exec db pg_dump -U cohe_user cohe_capital_db -f /tmp/backup.sql
docker compose cp db:/tmp/backup.sql ./backups/
```

### 自动备份脚本

创建 `scripts/backup-db.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/home/backups/cohe-capital"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker compose exec -T db pg_dump -U cohe_user cohe_capital_db | gzip > $BACKUP_FILE

# 删除 7 天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "✅ Database backup completed: $BACKUP_FILE"
```

**设置定时任务** (cron):

```bash
# 每天凌晨 2 点自动备份
0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/cohe-backup.log 2>&1
```

### 恢复数据库

```bash
# 从备份文件恢复
docker compose exec -T db psql -U cohe_user -d cohe_capital_db < backup_20250120_020000.sql

# 从压缩备份恢复
gunzip -c backup_20250120_020000.sql.gz | docker compose exec -T db psql -U cohe_user -d cohe_capital_db

# 恢复前先删除数据库 (谨慎！)
docker compose exec db dropdb -U cohe_user cohe_capital_db
docker compose exec db createdb -U cohe_user cohe_capital_db
docker compose exec -T db psql -U cohe_user -d cohe_capital_db < backup.sql
```

### 备份签名图片

```bash
# 备份 uploads 目录
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz docker-volumes/uploads/

# 恢复
tar -xzf uploads_backup_20250120.tar.gz -C docker-volumes/
```

---

## 容器管理

### 启动/停止服务

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 重启所有服务
docker compose restart

# 重启单个服务
docker compose restart api
docker compose restart web
```

### 重新构建镜像

```bash
# 重新构建所有服务
docker compose build

# 重新构建单个服务
docker compose build api

# 不使用缓存强制重新构建
docker compose build --no-cache api

# 构建并启动
docker compose up -d --build
```

### 更新服务

```bash
# 拉取最新代码
git pull origin main

# 重新构建并重启
./deploy.sh --build

# 或手动执行
docker compose build
docker compose down
docker compose up -d
```

### 查看容器状态

```bash
# 查看运行中的容器
docker compose ps

# 查看所有容器 (包括停止的)
docker compose ps -a

# 查看容器详细信息
docker compose ps --format json
```

### 进入容器 Shell

```bash
# 进入 API 容器
docker compose exec api sh

# 进入数据库容器
docker compose exec db psql -U cohe_user -d cohe_capital_db

# 以 root 用户进入
docker compose exec --user root api sh
```

---

## 健康检查

### API 健康检查

```bash
# 检查 API 是否正常
curl http://localhost:3001/healthz

# 预期输出
{
  "status": "ok",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "uptime": 3600
}
```

### Nginx 健康检查

```bash
# 检查 Nginx
curl http://localhost/health

# 预期输出
healthy
```

### 数据库连接检查

```bash
# 检查数据库连接
docker compose exec db pg_isready -U cohe_user

# 预期输出
/var/run/postgresql:5432 - accepting connections
```

### Swagger API 文档

```bash
# 访问 API 文档
curl http://localhost:3001/api-docs

# 或在浏览器打开
open http://localhost:3001/api-docs
```

### 监控脚本

创建 `scripts/health-check.sh`:

```bash
#!/bin/bash

echo "🔍 Checking Cohe Capital Services..."

# API
if curl -f http://localhost:3001/healthz > /dev/null 2>&1; then
  echo "✅ API: Healthy"
else
  echo "❌ API: Down"
fi

# Web
if curl -f http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Web: Healthy"
else
  echo "❌ Web: Down"
fi

# Admin
if curl -f http://localhost:3002 > /dev/null 2>&1; then
  echo "✅ Admin: Healthy"
else
  echo "❌ Admin: Down"
fi

# Database
if docker compose exec -T db pg_isready -U cohe_user > /dev/null 2>&1; then
  echo "✅ Database: Healthy"
else
  echo "❌ Database: Down"
fi

# Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
  echo "✅ Nginx: Healthy"
else
  echo "❌ Nginx: Down"
fi
```

---

## 证书管理

### 使用 Let's Encrypt (推荐)

#### 安装 Certbot

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot

# macOS
brew install certbot
```

#### 获取证书

```bash
# 方式 1: Standalone (需要停止 Nginx)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 方式 2: Webroot (不需要停止服务)
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com
```

#### 配置 Nginx 使用证书

编辑 `infra/nginx/conf.d/default.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... 其他配置
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### 挂载证书到容器

编辑 `docker-compose.yml`:

```yaml
services:
  nginx:
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

#### 自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# 设置自动续期 (cron)
0 3 * * * certbot renew --quiet && docker compose restart nginx
```

---

## 常见运维操作

### 数据库迁移

```bash
# 运行迁移
./deploy.sh --migrate

# 或手动运行
docker compose exec api pnpm exec prisma migrate deploy
```

### 查看 Prisma Studio

```bash
# 启动 Prisma Studio (仅本地)
docker compose exec api pnpm exec prisma studio

# 访问
open http://localhost:5555
```

### 清理日志

```bash
# 清理容器日志
docker compose down
sudo rm -rf /var/lib/docker/containers/*/*-json.log

# 或使用 truncate
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### 端口检查

```bash
# 检查端口占用
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000
sudo lsof -i :3001

# 或使用 netstat
sudo netstat -tuln | grep LISTEN
```

### 环境变量更新

```bash
# 修改 .env 文件
nano .env

# 重启服务使配置生效
docker compose down
docker compose up -d
```

---

## 故障排查

### API 无法启动

**检查步骤**:

1. 查看日志
```bash
docker compose logs api
```

2. 检查数据库连接
```bash
docker compose exec api sh
ping db
```

3. 检查环境变量
```bash
docker compose exec api env | grep DATABASE_URL
```

4. 检查 Prisma Client
```bash
docker compose exec api pnpm exec prisma generate
```

### 数据库连接失败

**可能原因**:

1. 数据库未启动
```bash
docker compose ps db
docker compose up -d db
```

2. 密码错误
```bash
# 检查 .env 中的 POSTGRES_PASSWORD
cat .env | grep POSTGRES_PASSWORD
```

3. 网络问题
```bash
docker network ls
docker network inspect cohe-network
```

### Nginx 502 Bad Gateway

**可能原因**:

1. 后端服务未启动
```bash
docker compose ps
docker compose restart api web admin
```

2. 端口配置错误
```bash
# 检查 Nginx 配置
docker compose exec nginx nginx -t
```

3. 上游服务健康检查失败
```bash
curl http://localhost:3001/healthz
```

### 磁盘空间不足

```bash
# 检查磁盘使用
df -h

# 清理 Docker 资源
docker system prune -a --volumes

# 清理旧日志
find /var/log -name "*.log" -mtime +7 -delete
```

### 内存不足 (OOM)

**检查**:

```bash
# 查看容器内存使用
docker stats

# 查看系统内存
free -h

# 检查 OOM 日志
dmesg | grep -i oom
```

**解决方案**:

1. 增加服务器内存
2. 限制容器内存使用 (docker-compose.yml)
3. 优化应用代码

---

## 监控告警建议

### 关键指标

| 指标 | 正常范围 | 告警阈值 |
|------|---------|---------|
| **CPU 使用率** | < 60% | > 80% |
| **内存使用率** | < 70% | > 85% |
| **磁盘使用率** | < 70% | > 85% |
| **API 响应时间** | < 200ms | > 1000ms |
| **数据库连接数** | < 80 | > 100 |
| **错误率** | < 1% | > 5% |

### 告警渠道

- 邮件告警
- Slack/Discord 通知
- 短信告警 (紧急)
- PagerDuty (值班轮换)

### 推荐工具

1. **Prometheus + Grafana** - 指标监控
2. **Sentry** - 错误追踪
3. **Uptime Robot** - 可用性监控
4. **CloudWatch / Datadog** - 云端监控

---

## 安全最佳实践

### 定期安全检查

```bash
# 检查过期依赖
pnpm audit

# 更新依赖
pnpm update

# 检查 Docker 镜像安全
docker scout cves <image-name>
```

### 访问控制

- ✅ 禁止直接访问数据库端口 (5432)
- ✅ 使用强密码 (32 字符以上)
- ✅ 定期轮换 JWT_SECRET
- ✅ 启用 HTTPS (Let's Encrypt)
- ✅ 配置防火墙规则

### 日志审计

- ✅ 保留至少 30 天日志
- ✅ 记录所有管理员操作
- ✅ 监控异常登录行为
- ✅ 定期审查访问日志

---

## 快速参考

### 常用命令

```bash
# 启动服务
./deploy.sh

# 查看日志
docker compose logs -f api

# 进入容器
docker compose exec api sh

# 数据库备份
docker compose exec db pg_dump -U cohe_user cohe_capital_db > backup.sql

# 查看资源
docker stats

# 重启服务
docker compose restart api

# 健康检查
curl http://localhost:3001/healthz
```

### 紧急联系

- **技术负责人**: samztz
- **紧急联系方式**: wechat (samztz31)
- **备用联系人**: (待补充)

---

**最后更新**: 2025-01-20

**© 2025 Cohe Capital. All rights reserved.**
