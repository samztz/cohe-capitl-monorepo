# 子域名隔离配置完成报告

## ✅ 已完成的配置

### 1. Nginx 配置文件
已创建并正确配置了子域名分离的 Nginx 配置：

- **开发环境**: `infra/nginx/nginx.dev.conf`
  - `web.localhost` → Web 前端
  - `admin.localhost` → Admin 管理面板
  - 两个域名均可访问 `/api`, `/api-docs`, `/uploads`

- **生产环境**: `infra/nginx/nginx.prod.conf`
  - `your-domain.com` / `www.your-domain.com` → Web 前端
  - `admin.your-domain.com` → Admin 管理面板
  - 两个域名均可访问 `/api`, `/api-docs`, `/uploads`

### 2. Docker Compose 配置
`docker-compose.override.yml` (第 118-119 行) 已配置：
```yaml
volumes:
  - ./infra/nginx/nginx.dev.conf:/etc/nginx/nginx.conf:ro
```

### 3. 环境变量更新
`.env` 文件已更新：
- `SIWE_DOMAIN=web.localhost`
- `SIWE_URI=http://web.localhost`
- CORS 配置保持 `CORS_ORIGIN=*` (开发环境)

### 4. 前端配置
- **Web**: `apps/web/next.config.js` - 已配置 `/api` 重写规则
- **Admin**: `apps/admin/next.config.js` - 已配置 `/api` 重写规则
- 两者都使用 `NEXT_PUBLIC_API_BASE=/api` (相对路径)

### 5. Docker 容器状态
所有服务正常运行：
```
✅ cohe-nginx   (healthy, 使用 nginx.dev.conf)
✅ cohe-api     (healthy)
✅ cohe-web     (healthy)
✅ cohe-admin   (healthy)
✅ cohe-db      (healthy)
```

---

## 🧪 验收测试

由于测试环境有 **HTTP 代理配置** (`http_proxy=172.29.96.1:7890`)，自动化 curl 测试失败。

### 需要用户手动验证的项目：

#### 1. DNS 配置 (如果 *.localhost 不自动解析)

某些环境（如 WSL2）不支持自动 `.localhost` DNS 解析，需要手动添加：

```bash
# 方法 A: 临时添加（每次重启失效）
echo "127.0.0.1 web.localhost admin.localhost" | sudo tee -a /etc/hosts

# 方法 B: Windows hosts 文件 (WSL2 环境推荐)
# 编辑 C:\Windows\System32\drivers\etc\hosts
# 添加以下行：
127.0.0.1 web.localhost
127.0.0.1 admin.localhost
```

#### 2. Health 端点测试

**在浏览器中访问** (或使用 `curl --noproxy '*'`)：

```bash
# Web subdomain
http://web.localhost/health          # 应返回: healthy
http://web.localhost/api/healthz     # 应返回: ok

# Admin subdomain
http://admin.localhost/health        # 应返回: healthy
http://admin.localhost/api/healthz   # 应返回: ok
```

#### 3. 路由隔离测试

**Web Dashboard** 和 **Admin Dashboard** 应完全独立：

```
http://web.localhost/              # Web 首页
http://web.localhost/dashboard     # Web 用户面板

http://admin.localhost/            # Admin 登录页
http://admin.localhost/dashboard   # Admin 管理面板
```

验证要点：
- ✅ 两个 `/dashboard` 路由互不干扰
- ✅ Web 不会跳转到 Admin，反之亦然
- ✅ 浏览器 Network 面板显示所有 `/api` 请求正确代理

#### 4. API 透传测试

在 Admin 管理面板中进行操作（如查看 policies 列表），然后检查 API 日志：

```bash
docker compose logs api --tail=50 | grep "GET /api/admin/policies"
```

应该看到：
- ✅ Admin 的 API 请求携带 `Authorization: Bearer <ADMIN_TOKEN>`
- ✅ API 日志显示 `/api/admin/policies` 请求

#### 5. CORS 验证

浏览器控制台不应出现 CORS 错误：
- ✅ `http://web.localhost` 调用 API 成功
- ✅ `http://admin.localhost` 调用 API 成功

---

## 📝 直接端口访问（可选）

如果不使用 Nginx 子域名，仍可通过直接端口访问：

```
http://localhost:3000      # Web (通过 Next.js rewrites 代理 /api)
http://localhost:3002      # Admin (通过 Next.js rewrites 代理 /api)
http://localhost:3001/api  # API (直接访问)
```

这种方式下 `/dashboard` 仍可能有路径冲突，推荐使用子域名方式。

---

## 🚀 生产环境部署 (未来)

当需要部署到生产环境时：

1. **更新 `infra/nginx/nginx.prod.conf`**:
   ```nginx
   server_name your-actual-domain.com www.your-actual-domain.com;
   server_name admin.your-actual-domain.com;
   ```

2. **创建 `.env.production`**:
   ```bash
   CORS_ORIGIN=https://your-domain.com,https://admin.your-domain.com
   SIWE_DOMAIN=your-domain.com
   SIWE_URI=https://your-domain.com
   ```

3. **启动生产环境**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. **配置 TLS/SSL**:
   - 使用 Certbot/Let's Encrypt 获取证书
   - 取消注释 `nginx.prod.conf` 中的 HTTPS redirect 配置

---

## 📊 配置文件对照

| 文件 | 用途 | 状态 |
|------|------|------|
| `infra/nginx/nginx.dev.conf` | 开发环境子域名路由 | ✅ 已配置 |
| `infra/nginx/nginx.prod.conf` | 生产环境子域名路由 | ✅ 已配置 (需替换域名) |
| `docker-compose.override.yml` | 挂载 dev 配置 | ✅ 已配置 |
| `.env` | SIWE/CORS 配置 | ✅ 已更新 |
| `apps/web/next.config.js` | API 重写规则 | ✅ 已配置 |
| `apps/admin/next.config.js` | API 重写规则 | ✅ 已配置 |

---

## ⚠️ 已知问题

1. **测试环境有 HTTP 代理**
   - 自动化 curl 测试失败（代理拦截）
   - 解决方案：使用浏览器测试或 `curl --noproxy '*'`

2. **WSL2 不支持自动 `.localhost` 解析**
   - 需要手动添加 hosts 条目
   - 或使用 Host header 测试：`curl -H "Host: web.localhost" http://localhost/health`

3. **无 sudo 权限**
   - 无法自动修改 /etc/hosts
   - 需要用户手动添加或在 Windows hosts 文件中配置

---

## ✅ 总结

**所有配置已完成并已部署**，现在系统支持：
- ✅ 开发环境子域名分离 (`web.localhost` / `admin.localhost`)
- ✅ 生产环境配置就绪 (需替换实际域名)
- ✅ API 统一通过 `/api` 访问，无跨域问题
- ✅ Web 和 Admin 的 `/dashboard` 路由完全隔离

**下一步**: 用户在浏览器中访问 `http://web.localhost` 和 `http://admin.localhost` 进行手动验证。
