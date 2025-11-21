# 🔒 Docker 生产环境加固指南

> **生产部署前必读的安全和性能优化建议**

---

## ⚠️ 安全加固清单

### 1. 关闭不必要的端口映射

#### 📍 API 端口（docker-compose.yml:119-122）

**当前状态**: API 端口默认对外发布

```yaml
ports:
  # Expose API port (optional if using nginx as reverse proxy)
  # Comment out if nginx handles all external traffic
  - "${API_PORT:-3001}:${API_PORT:-3001}"
```

**生产环境建议**: 注释掉端口映射

```yaml
# ports:
#   # Expose API port (optional if using nginx as reverse proxy)
#   # Comment out if nginx handles all external traffic
#   - "${API_PORT:-3001}:${API_PORT:-3001}"
```

**理由**:
- ✅ 强制所有流量通过 Nginx（统一入口）
- ✅ 启用速率限制、安全头部等保护
- ✅ 减少攻击面
- ✅ 便于日志收集和监控

**本地开发例外**:
- 保留端口映射，方便直连 API 调试
- 可以绕过 Nginx 测试 API 性能
- 使用工具（Postman/Thunder Client）直接测试

**如何配置**:

```bash
# 生产环境 .env（注释端口映射）
# docker-compose.yml 中注释 ports 部分

# 本地开发 .env（保留端口映射）
# docker-compose.yml 中保留 ports 部分
```

---

#### 📍 数据库端口（docker-compose.yml:48-49）

**当前状态**: 已默认注释（✅ 推荐配置）

```yaml
# IMPORTANT: Database port mapping is DISABLED by default for security
# Uncomment only for local development/debugging
# In production, database should ONLY be accessible via Docker internal network
# ports:
#   - "${DB_PORT:-5432}:5432"
```

**生产环境**: 保持注释状态

**本地开发**: 可以取消注释，方便使用 psql、DBeaver 等工具连接

---

### 2. 调整文件上传大小限制

#### 📍 Nginx client_max_body_size（infra/nginx/nginx.conf:124）

**当前配置**: 固定 10MB

```nginx
client_max_body_size 10M;
```

**是否需要参数化？**

**❌ 不建议** - 原因：
- 签名图片通常 < 500KB
- 10MB 足够应对绝大多数场景
- 参数化会增加配置复杂度
- 真需要调整时直接改配置即可

**如何调整**:

```bash
# 1. 编辑 Nginx 配置
vim infra/nginx/nginx.conf

# 2. 修改第 124 行
client_max_body_size 50M;  # 根据需求调整

# 3. 重启 Nginx
docker compose restart nginx
```

**推荐值**:
- 签名图片: 10MB（当前默认）
- 文档上传: 50MB
- 视频上传: 100MB+

---

### 3. 环境变量安全

#### 必须修改的默认值

**⚠️ 生产环境绝对不能使用的默认值**:

```bash
# ❌ 不安全的默认值（仅用于本地开发）
JWT_SECRET=local-dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=local-dev-refresh-secret-change-in-production
ADMIN_TOKEN=demo-admin-token-12345
POSTGRES_PASSWORD=postgres
```

**✅ 生产环境必须生成强随机值**:

```bash
# 生成 JWT 密钥（32+ 字符）
openssl rand -base64 32

# 生成 Admin Token（64+ 字符）
openssl rand -hex 32

# 生成数据库密码（16+ 字符）
openssl rand -base64 16
```

**完整示例**:

```bash
# 生成所有密钥
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
ADMIN_TOKEN=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 16)

# 写入 .env
cat > .env << EOF
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
ADMIN_TOKEN=$ADMIN_TOKEN
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
EOF
```

---

#### CORS 配置

**本地开发**:
```bash
CORS_ORIGIN=*  # 允许所有来源
```

**生产环境**:
```bash
# 仅允许特定域名
CORS_ORIGIN=https://your-domain.com,https://admin.your-domain.com
```

---

### 4. 签名图片预览路径（非阻断）

#### 📍 Admin 签名图片预览

**当前状态**: ✅ 已修复（第二轮）

**修复位置**: `apps/admin/app/(dashboard)/policies/[id]/page.tsx:219`

```tsx
// ✅ 已使用相对路径（通过环境变量）
src={`${process.env.NEXT_PUBLIC_ADMIN_API_BASE || '/api'}${policy.signatureImageUrl}`}
```

**验证**:
- 生产环境: `/api/uploads/signatures/xxx.png`（正确）
- 本地开发: `/api/uploads/signatures/xxx.png`（正确）

---

## 📊 生产环境配置对照表

| 配置项 | 本地开发 | 生产环境 | 说明 |
|--------|---------|---------|------|
| **API 端口映射** | ✅ 开启 | ❌ 关闭 | 生产强制走 Nginx |
| **数据库端口** | ✅ 可选 | ❌ 禁止 | 仅内网访问 |
| **JWT_SECRET** | demo 值 | 强随机值 | 32+ 字符 |
| **ADMIN_TOKEN** | demo 值 | 强随机值 | 64+ 字符 |
| **CORS_ORIGIN** | `*` | 具体域名 | 白名单 |
| **client_max_body_size** | 10M | 按需调整 | 直接改配置 |
| **数据库密码** | `postgres` | 强随机值 | 16+ 字符 |

---

## 🔧 生产部署步骤

### Step 1: 准备生产配置

```bash
# 1. 复制生产环境模板
cp .env.production.example .env

# 2. 生成所有密钥
vim .env  # 使用上面的 openssl 命令生成

# 3. 配置域名和 CORS
vim .env
# SIWE_DOMAIN=your-domain.com
# SIWE_URI=https://your-domain.com
# CORS_ORIGIN=https://your-domain.com
```

### Step 2: 修改 docker-compose.yml

```bash
# 1. 注释 API 端口映射
vim docker-compose.yml
# 将 119-122 行注释掉

# 2. 确认数据库端口已注释（默认已注释）
# 48-49 行应该是注释状态
```

### Step 3: 配置 SSL/TLS

```bash
# 1. 获取 SSL 证书（Let's Encrypt）
# 2. 将证书放到 infra/nginx/certs/
# 3. 修改 nginx.conf，启用 HTTPS 配置
# 4. 取消注释 docker-compose.yml 中的 443 端口
```

### Step 4: 部署

```bash
# 1. 构建镜像
docker compose build

# 2. 启动服务
docker compose up -d

# 3. 运行迁移
./deploy.sh --migrate

# 4. 验证部署
./scripts/tests/docker-verify.sh
```

---

## 📋 生产部署检查清单

在生产部署前，确保以下所有项目都已完成：

### 安全配置

- [ ] 已生成强随机 JWT_SECRET (32+ 字符)
- [ ] 已生成强随机 JWT_REFRESH_SECRET (32+ 字符)
- [ ] 已生成强随机 ADMIN_TOKEN (64+ 字符)
- [ ] 已修改数据库默认密码
- [ ] CORS_ORIGIN 设置为具体域名（不是 `*`）
- [ ] 已注释数据库端口映射
- [ ] （可选）已注释 API 端口映射
- [ ] 已配置 SSL/TLS 证书
- [ ] 已启用 HTTPS 重定向

### 性能优化

- [ ] 已根据服务器资源调整 Nginx worker 进程数
- [ ] 已配置 Gzip 压缩
- [ ] 已配置静态文件缓存
- [ ] （可选）已配置 CDN

### 监控与日志

- [ ] 已配置日志聚合（如 ELK Stack）
- [ ] 已配置监控告警（如 Prometheus + Grafana）
- [ ] 已配置备份策略（数据库 + 上传文件）
- [ ] 已配置容器健康检查

### 数据持久化

- [ ] 数据库数据卷配置正确
- [ ] 上传文件卷配置正确
- [ ] （推荐）已迁移到云存储（S3/R2）

---

## 🚨 常见生产问题

### 问题 1: API 通过 Nginx 访问 404

**症状**: 直连 API 端口正常，通过 Nginx 404

**原因**: API 端口映射被注释，Nginx 无法连接

**解决**:
```bash
# Nginx 使用 Docker 内部网络，不需要端口映射
# 确认 docker-compose.yml 中 API 在 cohe-network
# Nginx 应该能通过 http://api:3001 访问
```

### 问题 2: 签名图片加载失败

**症状**: Admin 面板签名图片显示 403/404

**原因**: 路径错误或 Nginx 配置问题

**解决**:
```bash
# 1. 检查环境变量
docker compose exec admin env | grep ADMIN_API_BASE

# 2. 检查 Nginx uploads 配置
curl http://localhost/uploads/signatures/test.png

# 3. 检查上传目录挂载
docker compose exec api ls -la /app/apps/api/uploads/signatures/
```

### 问题 3: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**原因**: CORS_ORIGIN 配置不匹配

**解决**:
```bash
# 1. 检查 API 环境变量
docker compose exec api env | grep CORS

# 2. 更新 CORS_ORIGIN
vim .env
# CORS_ORIGIN=https://your-domain.com

# 3. 重启 API
docker compose restart api
```

---

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [测试指南](./DOCKER_TESTING_GUIDE.md)
- [修复总结](./DOCKER_FIXES_ROUND2.md)
- [安全最佳实践](../CODEX.md#security)

---

## ✅ 总结

**必须修改的项目**:
1. ✅ 生成强随机密钥（JWT、Admin Token、数据库密码）
2. ✅ 配置 CORS 白名单
3. ✅ 配置 SSL/TLS 证书

**建议修改的项目**:
1. ⚠️ 注释 API 端口映射（强制走 Nginx）
2. ⚠️ 配置云存储（S3/R2）
3. ⚠️ 配置监控和日志

**无需修改的项目**:
1. ❌ Nginx client_max_body_size（10MB 已足够）
2. ❌ 数据库端口映射（已默认关闭）
3. ❌ Admin 签名图片路径（已修复）

**按照本指南操作，可以确保生产环境的安全性和稳定性！** 🔒
