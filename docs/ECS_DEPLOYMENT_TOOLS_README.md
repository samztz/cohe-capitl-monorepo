# ECS Deployment Tools - 使用指南

本目录包含用于诊断和修复 ECS 部署问题的工具集。

## 📋 工具清单

### 1. 诊断脚本 (Diagnostic Script)

**文件**: `scripts/diagnose-docker-build.sh`

**用途**: 全面检查 Docker 构建环境，生成诊断报告

**运行方法**:
```bash
./scripts/diagnose-docker-build.sh
```

**输出内容**:
- ✓ 检查关键文件（pnpm-lock.yaml, .dockerignore, Dockerfiles）
- ✓ 分析 .dockerignore 模式
- ✓ 测试 Docker build context
- ✓ 验证 Docker Compose 配置
- ✓ 检查 Docker 环境和版本
- ✓ 显示 Git 状态
- ✓ 生成完整诊断报告到 `/tmp/docker-build-diagnostics-*.txt`

**何时使用**:
- 部署前预检查
- 排查构建失败问题
- 收集环境信息以便报告问题

---

### 2. 快速修复脚本 (Quick Fix Script)

**文件**: `scripts/ecs-quick-fix.sh`

**用途**: 自动修复常见的 ECS Docker 构建问题

**运行方法**:
```bash
./scripts/ecs-quick-fix.sh
```

**修复内容**:
- ✓ 检查并修复缺失的关键文件
- ✓ 重新创建干净的 .dockerignore
- ✓ 清理 Docker 缓存
- ✓ 测试构建上下文
- ✓ 检查磁盘空间
- ✓ 提供交互式菜单选择下一步操作

**何时使用**:
- 遇到 "pnpm-lock.yaml not found" 错误
- 构建莫名其妙失败
- 怀疑 Docker 缓存问题
- 快速重置到可工作状态

---

### 3. 故障排查文档 (Troubleshooting Guide)

**文件**: `docs/ECS_DOCKER_BUILD_TROUBLESHOOTING.md`

**内容**:
- 📖 问题现象和分析
- 🔍 详细排查步骤
- 🛠️ 快速修复方案
- ⚡ 常见错误模式和解决方案
- 🚀 终极解决方案（原子性重建）
- 💡 ECS 部署最佳实践

**何时参考**:
- 自动化脚本无法解决问题
- 需要深入理解问题原因
- 学习最佳实践

---

## 🚀 典型使用流程

### 场景 1: 首次部署 ECS

```bash
# Step 1: 运行诊断
./scripts/diagnose-docker-build.sh

# Step 2: 如果诊断通过，直接部署
./deploy.sh --prod --build

# Step 3: 如果失败，运行快速修复
./scripts/ecs-quick-fix.sh
```

### 场景 2: 部署失败排查

```bash
# Step 1: 快速修复（自动化解决常见问题）
./scripts/ecs-quick-fix.sh

# Step 2: 如果还是失败，运行诊断获取详细信息
./scripts/diagnose-docker-build.sh

# Step 3: 参考故障排查文档
cat docs/ECS_DOCKER_BUILD_TROUBLESHOOTING.md
```

### 场景 3: 重复失败（高级排查）

```bash
# Step 1: 参考故障排查文档的"终极解决方案"
# 强制清理并重建

git fetch origin
git reset --hard origin/main
docker system prune -af
docker builder prune -af

# Step 2: 创建最小 .dockerignore
cat > .dockerignore <<'EOF'
node_modules/
.git/
.next/
dist/
.env
.env.*
!.env.example
EOF

# Step 3: 测试构建
docker build -f - . <<'EOF'
FROM alpine:latest
COPY pnpm-lock.yaml ./
RUN ls -la
EOF

# Step 4: 如果测试通过，运行完整构建
./deploy.sh --prod --build
```

---

## 🔧 常见问题速查

### Q1: "pnpm-lock.yaml not found" 错误

**快速解决**:
```bash
./scripts/ecs-quick-fix.sh
# 选择选项 1: Run production build now
```

### Q2: 构建很慢或超时

**解决方案**:
```bash
# 清理 Docker 缓存
docker builder prune -af
docker system prune -af

# 检查磁盘空间
df -h
docker system df

# 如果空间不足
docker volume prune -f
```

### Q3: .dockerignore 文件格式问题

**解决方案**:
```bash
# 自动修复（推荐）
./scripts/ecs-quick-fix.sh

# 手动修复
dos2unix .dockerignore
# 或
sed -i 's/\r$//' .dockerignore
```

### Q4: Git 文件不完整

**解决方案**:
```bash
# 强制重置到远程分支
git fetch origin
git reset --hard origin/main

# 验证关键文件
ls -la pnpm-lock.yaml .dockerignore apps/*/Dockerfile
```

### Q5: Docker 镜像源问题（中国大陆）

**症状**: 403 Forbidden from docker.nju.edu.cn

**解决方案**:
```bash
# 检查 Docker 镜像配置
docker info | grep "Registry Mirrors"

# 临时切换到 Docker Hub
export DOCKER_REGISTRY_MIRROR=""

# 或配置可靠的镜像源
mkdir -p ~/.docker
cat > ~/.docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io/",
    "https://dockerproxy.com/"
  ]
}
EOF

# 重启 Docker（如果是 Docker Desktop，在设置中重启）
```

---

## 📊 诊断报告解读

### 成功的诊断输出示例:

```
Summary:
  ✓ All critical files present: YES
  ✓ Test build successful: YES
  ✓ Docker environment: OK
```

### 失败的诊断输出示例:

```
Summary:
  ✗ All critical files present: NO
  ✗ Test build successful: NO
  ⚠  Docker environment: CHECK NEEDED
```

**如果看到失败**:
1. 查看详细报告: `cat /tmp/docker-build-diagnostics-*.txt`
2. 根据报告中的具体错误，参考故障排查文档
3. 或运行快速修复脚本: `./scripts/ecs-quick-fix.sh`

---

## 🎯 最佳实践

### 1. 部署前检查清单

```bash
# ✓ 代码已同步
git status
git pull

# ✓ 环境变量已配置
cat .env | grep -E "(JWT_SECRET|POSTGRES_PASSWORD)"

# ✓ Docker 环境正常
docker info
docker compose version

# ✓ 磁盘空间充足
df -h
docker system df
```

### 2. 定期维护

```bash
# 每周清理 Docker 缓存
docker system prune -f

# 每月深度清理
docker system prune -af --volumes
docker builder prune -af
```

### 3. 使用 CI/CD（推荐）

**优势**:
- 构建环境一致
- 避免 ECS 上的构建问题
- 更快的部署速度

**流程**:
```yaml
# GitHub Actions 示例
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build images
        run: |
          docker compose -f docker-compose.yml -f docker-compose.prod.yml build

      - name: Push to registry
        run: |
          docker push your-registry.com/cohe-api:latest
          docker push your-registry.com/cohe-web:latest
          docker push your-registry.com/cohe-admin:latest

      - name: Deploy to ECS
        run: |
          ssh user@ecs "cd /path/to/app && docker compose pull && docker compose up -d"
```

---

## 📞 获取帮助

如果以上工具和文档无法解决问题，请提供以下信息：

```bash
# 1. 完整诊断报告
./scripts/diagnose-docker-build.sh
cat /tmp/docker-build-diagnostics-*.txt

# 2. 完整错误日志
./deploy.sh --prod --build 2>&1 | tee /tmp/deploy-error.log

# 3. 系统环境信息
uname -a
docker info
docker version
df -h
docker system df
```

将以上输出发送给技术支持或在 GitHub Issues 中提交。

---

## 🔄 工具更新日志

### 2025-11-27
- ✨ 创建诊断脚本 (diagnose-docker-build.sh)
- ✨ 创建快速修复脚本 (ecs-quick-fix.sh)
- 📝 创建故障排查文档 (ECS_DOCKER_BUILD_TROUBLESHOOTING.md)
- 📝 创建工具使用指南 (本文档)

---

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [本地开发指南](./LOCAL_DEVELOPMENT.md)
- [Docker 故障排查](./ECS_DOCKER_BUILD_TROUBLESHOOTING.md)
- [项目架构](./PROJECT_OVERVIEW.md)

---

**保持工具更新**: 定期从 main 分支拉取最新的工具脚本和文档。
