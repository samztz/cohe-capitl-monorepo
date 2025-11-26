# 📦 Cohe Capital - 生产环境部署

## 🚀 极速部署（3 步完成）

### 步骤 1：本地准备
```bash
./scripts/prepare-production.sh
```
**会问你**：
- 你的域名是什么？（如：`example.com`）
- WalletConnect ID？（从 https://cloud.reown.com/ 获取）

**会生成**：
- `.env.production`（环境变量）
- 更新 `nginx.prod.conf`（自动替换域名）
- 显示 **Admin Token**（记得保存！）

---

### 步骤 2：服务器准备

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 配置防火墙
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 配置 DNS（在域名服务商）
# A    example.com       → 服务器IP
# A    admin.example.com → 服务器IP
```

---

### 步骤 3：部署上线

```bash
# 克隆代码
git clone <your-repo>
cd cohe-capital-monorepo

# 上传 .env.production
scp .env.production user@server:/path/to/project/

# 部署
./deploy.sh --prod --build
```

---

## ✅ 验证部署

```bash
# 检查服务状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
# 所有服务应该是 "Up (healthy)"

# 测试访问
curl http://example.com/health        # → healthy
curl http://example.com/api/healthz   # → "ok"
```

---

## 📚 完整文档

| 文档 | 用途 |
|------|------|
| **QUICK_START.md** | 📘 详细的分步指南（推荐新手阅读） |
| **PRODUCTION_DEPLOY_CHECKLIST.md** | ✅ 完整的部署检查清单 |
| **scripts/prepare-production.sh** | 🛠️ 自动准备生产环境 |
| **deploy.sh** | 🚀 一键部署脚本 |

---

## ⚡ 快速命令

```bash
# 本地开发
docker compose up -d

# 生产部署（首次）
./deploy.sh --prod --build

# 生产部署（更新代码）
./deploy.sh --prod

# 查看日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# 重启服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

---

## 🔑 重要信息

**Admin Token**：运行 `./scripts/prepare-production.sh` 时会显示，只显示一次！

**忘记了？**
```bash
grep ADMIN_TOKEN .env.production
```

---

## 🌐 访问地址

- **Web 前端**：`https://example.com`
- **Admin 后台**：`https://admin.example.com`
- **API 文档**：`https://example.com/api-docs`

---

## 🆘 遇到问题？

查看 **QUICK_START.md** 的"常见问题"章节。
