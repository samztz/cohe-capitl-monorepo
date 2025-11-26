# Render.com 部署指南（中文）

## 📋 前置条件

在开始部署之前，请确保：

- ✅ GitHub 账号（用于连接 Render）
- ✅ WalletConnect Project ID（从 https://cloud.reown.com/ 获取）
- ✅ 代码已推送到 GitHub 仓库

---

## 🚀 快速部署（5 步完成）

### 步骤 1：更新 render.yaml 配置文件

在项目根目录找到 `render.yaml`，修改第 41、115、168 行的仓库 URL：

```yaml
# 将这三处的 URL 改成你的实际仓库地址
repo: https://github.com/你的用户名/你的仓库名.git
```

**快捷命令**：
```bash
# 替换所有仓库 URL（修改为你的实际信息）
sed -i 's|YOUR_USERNAME/YOUR_REPO|samztz/cohe-capital-monorepo|g' render.yaml

# 检查是否修改成功
grep "repo:" render.yaml
```

---

### 步骤 2：提交并推送到 GitHub

```bash
git add render.yaml
git commit -m "feat: add Render deployment configuration"
git push origin main
```

---

### 步骤 3：创建 Render Blueprint

1. 访问 **Render Blueprint 页面**：
   ```
   https://dashboard.render.com/blueprints
   ```

2. 点击 **"New Blueprint Instance"**

3. **连接 GitHub 仓库**：
   - 如果是第一次使用，需要授权 Render 访问 GitHub
   - 选择你刚推送代码的仓库
   - Render 会自动检测到 `render.yaml` 文件

4. **填写必需的环境变量**：

   Render 会提示你输入以下环境变量：

   | 环境变量 | 说明 | 如何获取 |
   |---------|------|---------|
   | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect 项目 ID | 访问 https://cloud.reown.com/ 创建项目 |
   | `JWT_SECRET` | JWT 密钥 | 点击 "Generate" 让 Render 自动生成 |
   | `JWT_REFRESH_SECRET` | 刷新令牌密钥 | 点击 "Generate" 让 Render 自动生成 |
   | `ADMIN_TOKEN` | 管理员访问令牌 | 点击 "Generate" 让 Render 自动生成 |

   **注意**：自动生成的 `JWT_SECRET`、`JWT_REFRESH_SECRET`、`ADMIN_TOKEN` 会在部署后显示，请保存好这些值。

5. **点击 "Apply"** 开始部署

---

### 步骤 4：等待部署完成（约 10-15 分钟）

Render 会自动执行以下操作：

1. ✅ 创建 PostgreSQL 数据库（`cohe-db`）
2. ✅ 构建并部署 API 服务（`cohe-api`）
   - 运行 Prisma 数据库迁移
   - 插入种子数据
3. ✅ 构建并部署 Web 前端（`cohe-web`）
4. ✅ 构建并部署 Admin 后台（`cohe-admin`）
5. ✅ 自动连接所有服务

**查看部署进度**：
- 在 Render Dashboard 可以看到每个服务的构建日志
- 绿色勾号 ✅ 表示服务已成功部署

---

### 步骤 5：部署后配置（一次性）

部署完成后，需要更新 API 服务的 SIWE 和 CORS 配置：

1. **获取服务 URL**：

   在 Render Dashboard 找到每个服务的 URL：
   - Web: `https://cohe-web.onrender.com`（示例）
   - Admin: `https://cohe-admin.onrender.com`（示例）
   - API: `https://cohe-api.onrender.com`（示例）

2. **更新 API 服务环境变量**：

   在 `cohe-api` 服务的 "Environment" 标签中，修改以下变量：

   ```bash
   # 将 cohe-web.onrender.com 替换为你的实际 Web 服务 URL
   SIWE_DOMAIN=cohe-web.onrender.com
   SIWE_URI=https://cohe-web.onrender.com

   # 将下面的 URL 替换为你的实际服务 URL
   CORS_ORIGIN=https://cohe-web.onrender.com,https://cohe-admin.onrender.com
   ```

3. **保存并重新部署 API 服务**：

   - 点击 "Save Changes"
   - Render 会自动重新部署 API 服务

---

## ✅ 验证部署成功

### 测试 API 健康检查

在浏览器访问：
```
https://cohe-api.onrender.com/api/healthz
```

应该返回：
```json
"ok"
```

### 测试 API 文档

访问：
```
https://cohe-api.onrender.com/api-docs
```

应该看到 Swagger API 文档页面。

### 测试 Web 前端

访问：
```
https://cohe-web.onrender.com
```

应该看到 Cohe Capital 首页，可以连接钱包并登录。

### 测试 Admin 后台

访问：
```
https://cohe-admin.onrender.com
```

应该看到管理员登录页面，使用部署时生成的 `ADMIN_TOKEN` 登录。

---

## 📊 服务概览

部署完成后，你会有以下 4 个服务：

| 服务名称 | 类型 | URL 示例 | 用途 |
|---------|------|---------|------|
| `cohe-db` | PostgreSQL | 内部连接 | 数据库 |
| `cohe-api` | Web Service | https://cohe-api.onrender.com | NestJS 后端 API |
| `cohe-web` | Web Service | https://cohe-web.onrender.com | 用户前端 |
| `cohe-admin` | Web Service | https://cohe-admin.onrender.com | 管理员后台 |

---

## 💡 重要提示

### 免费套餐限制

Render 免费套餐有以下限制：

1. **服务休眠**：
   - 15 分钟无活动后自动休眠
   - 下次访问有 ~50 秒冷启动时间

2. **数据库有效期**：
   - 免费 PostgreSQL 数据库 **90 天后会被删除**
   - 建议定期备份数据（每月一次）

3. **共享资源**：
   - 750 小时/月 共享于 3 个服务
   - 每个服务约 250 小时/月（~8 小时/天）

### 数据库备份（重要！）

**每 30 天执行一次备份**：

```bash
# 1. 在 Render Dashboard 找到数据库连接字符串
# cohe-db → Connect → External Connection String

# 2. 导出数据库
pg_dump "postgres://user:password@host/database" > backup_$(date +%Y%m%d).sql

# 3. 保存到云存储（Google Drive / Dropbox 等）
```

### 升级到生产环境

当需要 24/7 运行时，升级到 Starter 套餐：

| 服务 | 免费套餐 | Starter 套餐 | 升级费用 |
|------|---------|--------------|---------|
| Database | 90天后失效 | 永久保留 + 自动备份 | $7/月 |
| API | 15分钟后休眠 | 无休眠，更快 CPU | $7/月 |
| Web | 15分钟后休眠 | 无休眠 | $7/月 |
| Admin | 15分钟后休眠 | 无休眠 | $7/月 |
| **总计** | $0/月 | **$28/月** | - |

**如何升级**：
1. 在 Render Dashboard 进入每个服务的 "Settings"
2. 找到 "Instance Type"
3. 选择 "Starter"
4. 点击 "Save Changes"

---

## 🔧 常见问题

### Q1: 构建失败，提示找不到 Dockerfile

**解决方案**：
- 检查 `render.yaml` 中的 `dockerfilePath` 路径是否正确
- 确保 `apps/api/Dockerfile`、`apps/web/Dockerfile`、`apps/admin/Dockerfile` 存在
- 检查 `dockerContext` 是否设置为 `./`（仓库根目录）

### Q2: 数据库迁移失败

**查看日志**：
```bash
# 在 Render Dashboard 查看 cohe-api 的部署日志
# 搜索 "prisma migrate" 相关错误
```

**常见原因**：
- `DATABASE_URL` 未正确注入
- Prisma schema 有语法错误
- 迁移文件缺失

**手动执行迁移**：
```bash
# 1. 在 Render Dashboard 打开 cohe-api 的 Shell
# 2. 执行迁移命令
cd /app/apps/api
pnpm prisma migrate deploy
pnpm prisma db seed
```

### Q3: CORS 错误

**症状**：
浏览器控制台显示：
```
Access to fetch at 'https://cohe-api.onrender.com/api/xxx' from origin 'https://cohe-web.onrender.com' has been blocked by CORS policy
```

**解决方案**：
1. 检查 API 服务的 `CORS_ORIGIN` 环境变量
2. 确保包含完整的 URL（包括 `https://`）
3. 多个 URL 用逗号分隔，**不要有空格**
4. 不要有尾部斜杠 `/`

**正确示例**：
```bash
CORS_ORIGIN=https://cohe-web.onrender.com,https://cohe-admin.onrender.com
```

**错误示例**：
```bash
CORS_ORIGIN=https://cohe-web.onrender.com, https://cohe-admin.onrender.com  # ❌ 有空格
CORS_ORIGIN=https://cohe-web.onrender.com/,https://cohe-admin.onrender.com/  # ❌ 有斜杠
```

### Q4: 钱包登录失败（SIWE）

**症状**：
- 钱包签名后提示 "Invalid signature" 或类似错误

**解决方案**：
1. 检查 API 服务的 `SIWE_DOMAIN` 是否与 Web 服务 URL 一致
2. 确保 `SIWE_URI` 使用 `https://`（生产环境）
3. 重启 API 服务

**正确配置**：
```bash
# Web 服务 URL 是 https://cohe-web.onrender.com
SIWE_DOMAIN=cohe-web.onrender.com
SIWE_URI=https://cohe-web.onrender.com
```

### Q5: 服务启动慢（冷启动）

**原因**：
- 免费套餐 15 分钟无活动后休眠
- 冷启动需要 ~50 秒

**解决方案**：
1. **短期**：使用 cron job 定时访问（保持唤醒）
   ```bash
   # 使用 cron-job.org 每 10 分钟访问一次
   https://cohe-web.onrender.com
   https://cohe-api.onrender.com/api/healthz
   ```

2. **长期**：升级到 Starter 套餐（$7/月/服务，无休眠）

---

## 📚 下一步

### 配置自定义域名

1. 在 Render Dashboard 进入服务的 "Settings"
2. 找到 "Custom Domain"
3. 添加你的域名（如 `app.yourcompany.com`）
4. 在域名 DNS 设置中添加 CNAME 记录：
   ```
   app.yourcompany.com → cohe-web.onrender.com
   ```
5. 等待 DNS 生效（通常 5-10 分钟）
6. Render 会自动配置 HTTPS（Let's Encrypt）

### 设置 CI/CD 自动部署

Render 默认已启用自动部署：

- ✅ 每次 `git push` 到 `main` 分支会自动触发部署
- ✅ 可以在 "Settings" → "Build & Deploy" 中配置分支过滤
- ✅ 支持预览环境（Preview Environments）

**禁用自动部署**（如需手动控制）：
1. 进入服务 "Settings"
2. 找到 "Auto-Deploy"
3. 选择 "No"

### 监控和告警

Render 提供基础监控：

- CPU 使用率
- 内存使用率
- 响应时间
- 错误率

**设置告警**：
1. 进入服务 "Notifications"
2. 配置邮件或 Slack 通知
3. 设置阈值（如 CPU > 80%）

---

## 🎯 总结

恭喜！你已成功将 Cohe Capital 部署到 Render.com 🎉

**关键要点**：
- ✅ 使用 `render.yaml` Blueprint 一键部署 4 个服务
- ✅ 免费套餐足够 Demo 使用（90 天）
- ✅ 记得定期备份数据库
- ✅ 生产环境建议升级到 Starter 套餐（$28/月）

**访问你的应用**：
- Web 前端：https://cohe-web.onrender.com
- Admin 后台：https://cohe-admin.onrender.com
- API 文档：https://cohe-api.onrender.com/api-docs

**需要帮助？**
- Render 文档：https://render.com/docs
- 本项目文档：`docs/DEPLOYMENT_COMPARISON.md`
