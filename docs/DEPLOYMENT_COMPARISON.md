# Render.com vs Railway.app 部署对比

## 快速结论

**推荐：Render.com** ✅

原因：
1. ✅ 支持 Blueprint（类似 Docker Compose 的一键部署）
2. ✅ 免费数据库 90 天（Railway 只有 5GB 流量/月）
3. ✅ 更适合 monorepo 项目
4. ✅ 服务间内部通信免费
5. ✅ 更好的免费额度

---

## 详细对比

### 1. Docker Compose 支持

| 特性 | Render.com | Railway.app |
|------|-----------|-------------|
| 原生 docker-compose.yml | ❌ 不支持 | ❌ 不支持 |
| Blueprint/一键部署 | ✅ `render.yaml` | ❌ 需手动创建3个服务 |
| 服务自动关联 | ✅ 自动注入 `DATABASE_URL` | ⚠️ 需手动复制粘贴 |
| 环境变量同步 | ✅ 支持服务间引用 | ⚠️ 手动维护 |

**结论**：Render 的 Blueprint 更接近 docker-compose 体验。

---

### 2. 免费额度对比

#### Render.com Free Plan

| 资源 | 额度 | 限制 |
|------|------|------|
| Web Services | 750小时/月（3个服务共享） | 每服务 ~250h/月 |
| CPU/RAM | 0.1 CPU / 512MB RAM | 15分钟无活动后休眠 |
| PostgreSQL | 1GB 存储 | **90天后失效** |
| 冷启动时间 | ~50秒 | - |
| 构建时长 | 无限制 | - |
| 流量 | **100GB/月** | - |
| 服务间通信 | 免费（不计流量） | - |

#### Railway.app Free Plan

| 资源 | 额度 | 限制 |
|------|------|------|
| 免费额度 | **$5/月** | 超额按量付费 |
| PostgreSQL | 共享资源 | 计入 $5 额度 |
| 流量 | **仅 5GB/月** | 超额 $0.10/GB |
| 执行时间 | 计入 $5 额度 | 约 500小时（小型服务） |
| 冷启动 | 无休眠机制 | 但超额立即收费 |

**关键差异**：
- Render 免费流量 **100GB/月**（是 Railway 的 20 倍）
- Railway 的 $5 额度很容易用完（数据库 + 3个服务）
- Render 数据库 90 天后失效，但可手动备份重建

---

### 3. 部署流程对比

#### Render.com 部署流程（推荐）

```bash
# 1. 准备 render.yaml（已创建）
# 2. 提交到 GitHub
git add render.yaml
git commit -m "Add Render Blueprint"
git push

# 3. 在 Render Dashboard 创建 Blueprint
https://dashboard.render.com/blueprints
→ New Blueprint Instance
→ 选择 GitHub 仓库
→ 自动检测 render.yaml
→ 填写必需的环境变量：
  - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  - JWT_SECRET（或让 Render 自动生成）
  - JWT_REFRESH_SECRET（或自动生成）
  - ADMIN_TOKEN（或自动生成）
→ 点击 "Apply"

# 4. Render 自动完成：
✅ 创建 PostgreSQL 数据库
✅ 构建并部署 API 服务
✅ 构建并部署 Web 服务
✅ 构建并部署 Admin 服务
✅ 连接所有服务
✅ 运行数据库迁移和种子数据

# 5. 部署后配置（一次性）
# 在 Render Dashboard 更新 API 服务环境变量：
SIWE_DOMAIN=cohe-web.onrender.com
SIWE_URI=https://cohe-web.onrender.com
CORS_ORIGIN=https://cohe-web.onrender.com,https://cohe-admin.onrender.com

# 6. 重启 API 服务
# 在 Dashboard 点击 "Manual Deploy" → "Clear build cache & deploy"
```

**优点**：
- ✅ 一键部署所有服务
- ✅ 环境变量自动注入（如 `DATABASE_URL`）
- ✅ 配置文件版本控制（`render.yaml`）

---

#### Railway.app 部署流程

```bash
# 1. 创建数据库服务
railway init
railway add --database postgresql

# 2. 手动创建 API 服务
railway up
→ 选择 "Docker" 运行时
→ Dockerfile path: apps/api/Dockerfile
→ Docker context: .
→ 手动添加环境变量（20+ 个）
→ 手动复制 DATABASE_URL 从数据库服务

# 3. 手动创建 Web 服务
railway up
→ 再次配置 Dockerfile
→ 再次添加环境变量
→ 手动配置 API 代理路由

# 4. 手动创建 Admin 服务
railway up
→ 重复上述步骤

# 5. 手动配置服务间通信
→ 复制 API 服务内部 URL
→ 更新 Web/Admin 的 API_BASE 环境变量
→ 配置 CORS 允许的 origins

# 6. 手动运行数据库迁移
railway run --service api "cd /app/apps/api && pnpm prisma migrate deploy"
```

**缺点**：
- ❌ 需要手动创建 3 个独立服务
- ❌ 环境变量需要复制粘贴 3 次
- ❌ 服务 URL 变更需要手动更新所有引用
- ❌ 没有配置文件，难以复现部署

---

### 4. 成本对比（月费用）

#### Demo/测试环境（免费套餐）

| 平台 | 数据库 | API | Web | Admin | 总计 |
|------|--------|-----|-----|-------|------|
| **Render** | 免费（90天） | 免费 | 免费 | 免费 | **$0/月** |
| **Railway** | ~$2 | ~$1 | ~$1 | ~$1 | **~$5/月**（刚好用完免费额度） |

#### 生产环境（24/7 运行）

| 平台 | 数据库 | API | Web | Admin | 总计 |
|------|--------|-----|-----|-------|------|
| **Render** | $7 (Starter) | $7 (Starter) | $7 (Starter) | $7 (Starter) | **$28/月** |
| **Railway** | $10 (Pro) | $5 (小型) | $5 (小型) | $5 (小型) | **$25/月**（最低） |

**结论**：
- Demo 阶段：Render 更划算（真正免费 90 天）
- 生产环境：Railway 略便宜 $3/月，但差异不大

---

### 5. 开发体验对比

| 特性 | Render | Railway |
|------|--------|---------|
| 部署速度 | ⚠️ 较慢（构建 + 冷启动） | ✅ 快速 |
| 日志查看 | ✅ 实时日志 | ✅ 实时日志 |
| 环境变量管理 | ⚠️ 需重启服务 | ✅ 自动重启 |
| Shell 访问 | ✅ `render shell` | ✅ `railway run` |
| 自定义域名 | ✅ 免费 | ✅ 免费 |
| HTTPS | ✅ 自动（Let's Encrypt） | ✅ 自动 |
| Blueprint/配置文件 | ✅ `render.yaml` | ❌ 无 |
| Web UI | ✅ 清晰 | ✅ 现代化 |
| CLI 工具 | ⚠️ 功能有限 | ✅ 强大 |

---

### 6. 特定于本项目的考虑

#### 本项目特点：
- ✅ Monorepo（pnpm workspace）
- ✅ 3 个 Docker 服务（API + Web + Admin）
- ✅ PostgreSQL 数据库
- ✅ 需要环境变量较多（~25个）
- ✅ 需要服务间通信（Web/Admin → API）

#### Render 优势：
1. ✅ Blueprint 一次性定义所有服务和环境变量
2. ✅ 自动注入 `DATABASE_URL`（从 `fromDatabase` 引用）
3. ✅ 支持服务间环境变量引用（`fromService`）
4. ✅ 配置即代码（`render.yaml` 可版本控制）
5. ✅ 免费流量 100GB/月（足够 Demo）

#### Railway 缺点（针对本项目）：
1. ❌ 手动创建 3 个服务，容易出错
2. ❌ 环境变量需要复制粘贴（25个 × 3次 = 75次操作）
3. ❌ 服务 URL 变更后需手动更新所有引用
4. ❌ 5GB/月流量太少（可能不够测试）

---

### 7. 数据库持久化问题

#### Render 免费数据库 90 天限制

**问题**：90 天后数据库自动删除

**解决方案**：

1. **方案 A：定期备份 + 重建**（推荐 Demo）
   ```bash
   # 每 80 天执行一次
   # 1. 导出数据
   pg_dump $DATABASE_URL > backup.sql

   # 2. 删除旧数据库服务
   # 在 Render Dashboard 删除 cohe-db

   # 3. 重新部署 Blueprint
   # Render 会创建新数据库（重置 90 天计时）

   # 4. 恢复数据
   psql $NEW_DATABASE_URL < backup.sql
   ```

2. **方案 B：升级到付费数据库**（推荐生产）
   - Starter Plan：$7/月（256MB RAM, 1GB SSD）
   - 永久保留数据
   - 自动备份

3. **方案 C：使用外部数据库**
   - Supabase（免费 500MB）
   - Neon（免费 3GB）
   - ElephantSQL（免费 20MB）

---

### 8. 推荐部署方案

#### Demo 阶段（前 3 个月）

**平台**：Render.com
**配置**：全部使用免费套餐
**成本**：$0/月

**部署步骤**：
1. 更新 `render.yaml` 中的 `repo:` URLs
2. `git push` 到 GitHub
3. 创建 Render Blueprint（5 分钟）
4. 设置必需的环境变量
5. 部署完成

**限制**：
- ⚠️ 服务 15 分钟无活动后休眠（冷启动 ~50秒）
- ⚠️ 数据库 90 天后删除（需备份）
- ⚠️ 0.1 CPU 性能较弱

**适用场景**：
- ✅ 内部 Demo 演示
- ✅ 功能测试
- ✅ 投资人展示
- ❌ 不适合公开生产环境

---

#### 生产阶段（长期运行）

**平台**：Render.com 或 Railway.app（二选一）
**配置**：全部升级到付费套餐
**成本**：$25-30/月

**Render 生产配置**：
```yaml
# render.yaml 修改：
services:
  - name: cohe-api
    plan: starter  # $7/mo: 0.5 CPU, 512MB RAM, 无休眠
  - name: cohe-web
    plan: starter
  - name: cohe-admin
    plan: starter

databases:
  - name: cohe-db
    plan: starter  # $7/mo: 永久保留, 自动备份
```

**Railway 生产配置**：
- PostgreSQL Pro: $10/mo
- 3 个服务各 $5/mo

**性能提升**：
- ✅ 无休眠，即时响应
- ✅ 更快的 CPU
- ✅ 自动扩展（可选）
- ✅ 数据库永久保留 + 自动备份

---

## 最终推荐

### 立即开始（Demo）

**使用 Render.com + 已创建的 `render.yaml`**

```bash
# 1. 修改 render.yaml 中的仓库 URL（3处）
sed -i 's|YOUR_USERNAME/YOUR_REPO|你的用户名/你的仓库名|g' render.yaml

# 2. 提交到 GitHub
git add render.yaml
git commit -m "feat: add Render Blueprint for deployment"
git push

# 3. 访问 https://dashboard.render.com/blueprints
# 4. 点击 "New Blueprint Instance"
# 5. 选择你的 GitHub 仓库
# 6. 填写环境变量：
#    - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=你的Project ID
#    - 其他让 Render 自动生成即可
# 7. 点击 "Apply"

# 等待 10-15 分钟构建完成
# 访问：
# - https://cohe-web.onrender.com
# - https://cohe-admin.onrender.com
# - https://cohe-api.onrender.com/api-docs
```

### 后续升级（生产）

当 Demo 验证成功，需要升级到生产环境时：

```bash
# 1. 在 Render Dashboard 升级所有服务到 Starter 套餐
# 2. 配置自定义域名（可选）
# 3. 设置 CI/CD 自动部署
# 4. 配置监控和告警
```

---

## 常见问题

**Q: Render 的 Blueprint 是否支持环境变量引用？**
A: ✅ 是的，`render.yaml` 支持：
   - `fromDatabase` - 从数据库服务获取连接字符串
   - `fromService` - 从其他服务获取 URL
   - `generateValue: true` - 自动生成安全随机值

**Q: Railway 真的不支持类似 docker-compose 的配置吗？**
A: ❌ 截至 2024 年，Railway 没有类似 Blueprint 的功能。需要手动创建每个服务。

**Q: 免费数据库 90 天后数据会丢失吗？**
A: ⚠️ 是的，Render 免费数据库 90 天后会被删除。建议：
   - Demo 阶段：定期备份（每月一次）
   - 生产环境：升级到 Starter ($7/mo) 永久保留

**Q: 如何从 Render 迁移到 Railway？**
A: 数据库导出 + 环境变量复制：
   ```bash
   # 1. 导出 Render 数据库
   pg_dump $RENDER_DATABASE_URL > backup.sql

   # 2. 在 Railway 创建服务
   # 3. 导入数据
   psql $RAILWAY_DATABASE_URL < backup.sql

   # 4. 复制环境变量
   # 5. 更新 DNS 指向 Railway
   ```

**Q: Render 和 Railway 哪个更适合中国用户访问？**
A: 两者在中国访问速度类似（都在美国），建议：
   - 使用 CloudFlare CDN 加速
   - 或考虑部署到阿里云香港/新加坡区域

---

## 结论

**立即行动：使用 Render.com + render.yaml 部署 Demo**

1. ✅ 一键部署，节省时间
2. ✅ 免费 90 天，足够验证
3. ✅ 配置文件版本控制，易于复现
4. ✅ 环境变量自动管理
5. ✅ 后续可平滑升级到生产环境

**下一步**：
```bash
# 修改 render.yaml 的仓库 URL，然后 git push
# 访问 https://dashboard.render.com/blueprints 开始部署
```
