# ECS Docker Build Troubleshooting Guide

## 问题现象

在 ECS (或远程服务器) 上运行 `./deploy.sh --prod --build` 时报错：

```
failed to compute cache key: "/pnpm-lock.yaml": not found
```

## 问题分析

根据本地诊断结果，本地环境一切正常，问题可能出现在 ECS 上的以下几个方面：

### 1. Git Clone 不完整

**可能原因**：
- `.dockerignore` 或 `pnpm-lock.yaml` 文件未被正确拉取
- Git LFS 配置问题（如果使用）
- 文件权限问题

**排查命令**：
```bash
# 在 ECS 上执行
ls -la | grep -E '(pnpm-lock|dockerignore)'
ls -la apps/*/Dockerfile
```

**预期输出**：
```
-rw-r--r-- 1 user group   268 Nov 27 16:39 .dockerignore
-rw-r--r-- 1 user group 675k Nov 18 09:18 pnpm-lock.yaml
```

### 2. .dockerignore 文件问题

**可能原因**：
- ECS 上有不同版本的 .dockerignore
- 文件编码问题（Windows CRLF vs Linux LF）
- 隐藏字符导致模式匹配错误

**排查命令**：
```bash
# 检查文件内容
cat .dockerignore

# 检查文件格式
file .dockerignore

# 检查是否有隐藏字符
od -c .dockerignore | head -20
```

**正确的 .dockerignore 内容**：
```dockerignore
# Essential exclusions only
node_modules/
**/node_modules/
.git/
.next/
**/.next/
dist/
**/dist/
.env
.env.*
!.env.example
.DS_Store

# Specific log files (not wildcards)
npm-debug.log
yarn-error.log
pnpm-debug.log

# No ! rules needed - pnpm files included by default
```

### 3. Docker Build Context 问题

**可能原因**：
- Docker daemon 配置不同
- Build context 太大导致传输失败
- 网络问题

**排查命令**：
```bash
# 测试简单构建
docker build -f - . <<'EOF'
FROM alpine:latest
COPY pnpm-lock.yaml ./
RUN ls -la
EOF
```

**如果失败**，说明 build context 问题，继续排查：

```bash
# 查看 build context 大小
du -sh .

# 查看哪些大文件可能被包含
find . -type f -size +10M | grep -v node_modules | grep -v .git

# 检查 Docker daemon 配置
docker info | grep -A 10 "Storage Driver"
```

### 4. Docker Compose 配置问题

**可能原因**：
- docker-compose.yml 或 docker-compose.prod.yml 不同步
- 相对路径问题

**排查命令**：
```bash
# 检查 compose 文件
cat docker-compose.yml | grep -A 5 "build:"

# 检查 compose 版本
docker compose version

# 验证配置语法
docker compose -f docker-compose.yml -f docker-compose.prod.yml config > /tmp/merged-config.yml
cat /tmp/merged-config.yml | grep -A 10 "build:"
```

## 快速修复步骤

### Step 1: 运行诊断脚本

```bash
# 先运行诊断脚本
./scripts/diagnose-docker-build.sh
```

查看输出，重点关注：
- ✓ All critical files present: YES/NO
- ✓ Test build successful: YES/NO

### Step 2: 如果诊断失败，强制重新拉取代码

```bash
# 保存未提交的更改
git stash

# 强制重置到远程分支
git fetch origin
git reset --hard origin/main

# 确认关键文件存在
ls -la pnpm-lock.yaml .dockerignore apps/*/Dockerfile
```

### Step 3: 清理 Docker 缓存

```bash
# 清理所有 build cache
docker builder prune -af

# 清理所有未使用的镜像和容器
docker system prune -af
```

### Step 4: 使用备用 .dockerignore

如果问题仍然存在，尝试最小化的 .dockerignore：

```bash
# 备份当前文件
cp .dockerignore .dockerignore.backup

# 创建最小化版本
cat > .dockerignore <<'EOF'
node_modules/
.git/
.next/
dist/
.env
.env.*
!.env.example
EOF

# 重新构建
./deploy.sh --prod --build
```

### Step 5: 检查特定 ECS 问题

```bash
# 检查磁盘空间
df -h

# 检查 inode 使用
df -i

# 检查 Docker 存储空间
docker system df

# 如果空间不足，清理
docker volume prune -f
```

## 常见错误模式

### 错误 1: Windows vs Linux 行尾符问题

**症状**：文件存在但 Docker 认为不存在

**原因**：.dockerignore 使用了 Windows CRLF 行尾符

**修复**：
```bash
# 转换为 Unix 格式
dos2unix .dockerignore

# 或手动转换
sed -i 's/\r$//' .dockerignore
```

### 错误 2: 隐藏的 BOM 字符

**症状**：文件看起来正常但构建失败

**修复**：
```bash
# 检查 BOM
file .dockerignore

# 如果显示 "UTF-8 Unicode (with BOM) text"
# 移除 BOM
sed -i '1s/^\xEF\xBB\xBF//' .dockerignore
```

### 错误 3: 符号链接问题

**症状**：某些文件在 git 中是符号链接

**排查**：
```bash
# 检查符号链接
find . -type l -ls

# 如果 pnpm-lock.yaml 是符号链接，替换为实际文件
```

## 终极解决方案

如果以上都无法解决，使用原子性重建：

```bash
#!/bin/bash
# atomic-rebuild.sh

set -e

echo "🔄 Starting atomic rebuild..."

# 1. 完全清理
echo "1️⃣ Cleaning Docker environment..."
docker compose down -v
docker system prune -af
docker builder prune -af

# 2. 重置代码
echo "2️⃣ Resetting codebase..."
git fetch origin
git reset --hard origin/main
git clean -fdx

# 3. 验证关键文件
echo "3️⃣ Verifying critical files..."
for file in pnpm-lock.yaml pnpm-workspace.yaml package.json .dockerignore; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        exit 1
    fi
    echo "✓ $file"
done

# 4. 创建最小 .dockerignore
echo "4️⃣ Creating minimal .dockerignore..."
cat > .dockerignore <<'EOF'
node_modules/
.git/
.next/
dist/
.env
.env.*
!.env.example
EOF

# 5. 测试构建
echo "5️⃣ Testing build context..."
docker build -f - . <<'DOCKERFILE'
FROM alpine:latest
COPY pnpm-lock.yaml ./
RUN ls -la
DOCKERFILE

# 6. 运行实际构建
echo "6️⃣ Running production build..."
./deploy.sh --prod --build

echo "✅ Rebuild complete!"
```

## ECS 部署最佳实践

### 1. 使用 CI/CD 构建镜像

**推荐方式**：在 CI/CD 环境构建镜像并推送到容器仓库

```bash
# GitHub Actions / GitLab CI
docker buildx build --platform linux/amd64 \
  -f apps/api/Dockerfile \
  -t your-registry.com/cohe-api:latest \
  --push .
```

然后在 ECS 上直接拉取：

```yaml
# docker-compose.prod.yml
services:
  api:
    image: your-registry.com/cohe-api:latest
    # 移除 build 配置
```

### 2. 使用 Docker Buildkit

```bash
# 启用 BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 使用 buildx
docker buildx build \
  --cache-from type=registry,ref=your-registry.com/cohe-api:cache \
  --cache-to type=registry,ref=your-registry.com/cohe-api:cache,mode=max \
  -f apps/api/Dockerfile \
  -t your-registry.com/cohe-api:latest \
  --push .
```

### 3. 分离构建和部署

```bash
# 构建阶段（可以在本地或 CI）
./deploy.sh --prod --build

# 保存镜像
docker save cohe-capitl-monorepo-api:latest | gzip > api.tar.gz
docker save cohe-capitl-monorepo-web:latest | gzip > web.tar.gz
docker save cohe-capitl-monorepo-admin:latest | gzip > admin.tar.gz

# 上传到 ECS
scp *.tar.gz user@ecs-server:/path/to/app/

# 在 ECS 上加载
docker load < api.tar.gz
docker load < web.tar.gz
docker load < admin.tar.gz

# 启动服务（不构建）
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 联系支持

如果以上方案都无法解决问题，请提供以下信息：

1. 诊断脚本输出：
   ```bash
   ./scripts/diagnose-docker-build.sh > diagnosis.txt 2>&1
   ```

2. Docker 环境信息：
   ```bash
   docker info > docker-info.txt
   docker version >> docker-info.txt
   ```

3. 完整的错误日志：
   ```bash
   ./deploy.sh --prod --build 2>&1 | tee full-error.log
   ```

4. ECS 系统信息：
   ```bash
   uname -a
   df -h
   docker system df
   ```
