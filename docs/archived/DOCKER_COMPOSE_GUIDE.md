# Docker Compose 三文件架构使用指南

## 📁 文件结构

```
项目根目录
├── docker-compose.yml          ← 共性配置（所有环境通用）
├── docker-compose.override.yml ← 本地开发配置（自动加载）
└── docker-compose.prod.yml     ← 生产环境配置（显式指定）
```

## 🎯 三种使用场景

### 1. 日常本地开发（最常用）

```bash
docker compose up -d
```

**自动合并**：`docker-compose.yml` + `docker-compose.override.yml`

**特点**：
- ✅ 所有端口暴露（方便调试）
- ✅ NODE_ENV=development
- ✅ 数据库端口 5432 可访问（Prisma Studio、pgAdmin）
- ✅ restart: unless-stopped

**访问地址**：
- Web: http://localhost:3000
- Admin: http://localhost:3002
- API: http://localhost:3001/api
- Database: localhost:5432

---

### 2. 本地模拟生产（部署前压测）

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

**合并**：`docker-compose.yml` + `docker-compose.prod.yml`（覆盖 override）

**特点**：
- ⚠️ 数据库端口不暴露（ports: []）
- ⚠️ NODE_ENV=production
- ✅ restart: always
- ✅ 与生产环境 100% 一致

**用途**：
- 部署前最后测试
- 性能压测
- 安全审计

---

### 3. 生产服务器部署

```bash
# 使用 deploy.sh 脚本（推荐）
./deploy.sh --prod

# 或手动执行
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**合并**：`docker-compose.yml` + `docker-compose.prod.yml`

**特点**：
- 🔒 数据库端口禁止暴露
- 🔒 NODE_ENV=production
- 🔒 restart: always
- 🔒 严格的 CORS 配置
- 🔒 强密码和 Token

**环境变量**：
1. 创建 `.env.production`（从 `.env.production.example` 复制）
2. 填入生产级密钥
3. 脚本会自动使用 `.env.production`

---

## 📝 常用命令

### 本地开发

```bash
# 启动
docker compose up -d

# 查看日志
docker compose logs -f [service]

# 停止
docker compose down

# 重启
docker compose restart [service]

# 查看状态
docker compose ps
```

### 生产部署

```bash
# 使用脚本（推荐）
./deploy.sh --prod              # 生产部署
./deploy.sh --prod --build      # 重新构建镜像
./deploy.sh --prod --logs       # 部署后查看日志

# 手动命令
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

---

## 🔧 配置文件对比

| 配置项 | 共性 (yml) | 本地 (override) | 生产 (prod) |
|--------|------------|-----------------|-------------|
| **restart** | - | unless-stopped | always |
| **NODE_ENV** | - | development | production |
| **DB端口** | - | 暴露 5432 | ports: [] |
| **API端口** | - | 暴露 3001 | 暴露 3001 |
| **Web端口** | - | 暴露 3000 | 暴露 3000 |
| **Admin端口** | - | 暴露 3002 | 暴露 3002 |
| **Nginx端口** | - | 暴露 80 | 暴露 80/443 |

---

## 🛠️ 文件内容说明

### docker-compose.yml（共性配置）

包含所有环境都相同的部分：
- 服务定义（db, api, web, admin, nginx）
- 镜像构建配置
- 依赖关系
- 健康检查
- 网络配置
- 环境变量（通用）

### docker-compose.override.yml（本地开发）

覆盖本地开发需要的配置：
- 端口暴露（调试用）
- NODE_ENV=development
- restart: unless-stopped
- 可选：热更新 volumes

**会被自动加载**，无需 `-f` 参数。

### docker-compose.prod.yml（生产环境）

覆盖生产环境需要的配置：
- ports: []（数据库禁止暴露）
- NODE_ENV=production
- restart: always
- 严格的 CORS
- 资源限制（可选）

**必须显式指定**，使用 `-f` 参数。

---

## 📊 部署流程

### 首次部署（生产）

```bash
# 1. 配置环境变量
cp .env.production.example .env.production
nano .env.production  # 填入生产密钥

# 2. 构建镜像
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# 3. 启动服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. 检查状态
docker compose ps

# 5. 查看日志
docker compose logs -f
```

### 后续更新

```bash
# 使用 deploy.sh 脚本
./deploy.sh --prod --build

# 或手动更新
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## ✅ 优势总结

### 为什么使用三文件方案？

1. **职责分离**
   - 共性配置独立（yml）
   - 本地配置独立（override）
   - 生产配置独立（prod）

2. **本地开发便捷**
   - `docker compose up` 一条命令
   - 自动加载 override，无需记忆参数

3. **生产环境安全**
   - 显式指定 `-f prod.yml`
   - 不会误用开发配置

4. **易于维护**
   - 修改共性配置只需改一处
   - 本地和生产差异一目了然

5. **100% 模拟生产**
   - 本地可以精确模拟生产环境
   - 部署前充分测试

---

## 🚨 注意事项

### 本地开发

- ✅ 端口冲突检查（3000, 3001, 3002, 5432, 80）
- ✅ 数据库数据在 `docker-volumes/db-data`
- ✅ 上传文件在 `docker-volumes/uploads`

### 生产部署

- ⚠️ 必须使用 `.env.production`（强密钥）
- ⚠️ 数据库端口不暴露（安全）
- ⚠️ 配置 HTTPS（SSL 证书）
- ⚠️ 定期备份数据库
- ⚠️ 监控日志和资源

---

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [本地开发指南](./LOCAL_DEVELOPMENT.md)
- [运维手册](./OPERATIONS.md)
- [项目概览](./PROJECT_OVERVIEW.md)

---

**© 2025 Cohe Capital - Docker Compose Three-File Architecture**
