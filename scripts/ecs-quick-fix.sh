#!/bin/bash

# ============================================
# ECS Quick Fix Script
# 修复 ECS 上的 Docker 构建问题
# ============================================

set -e

echo "============================================"
echo "ECS Docker Build Quick Fix"
echo "============================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# Step 1: 检查关键文件
# ============================================
echo "Step 1: Checking critical files..."
echo ""

FILES_OK=true

if [ ! -f "pnpm-lock.yaml" ]; then
    log_error "pnpm-lock.yaml not found!"
    FILES_OK=false
else
    SIZE=$(ls -lh pnpm-lock.yaml | awk '{print $5}')
    log_info "pnpm-lock.yaml exists ($SIZE)"
fi

if [ ! -f ".dockerignore" ]; then
    log_warn ".dockerignore not found! Will create one."
    FILES_OK=false
else
    log_info ".dockerignore exists"
fi

if [ ! -f "pnpm-workspace.yaml" ]; then
    log_error "pnpm-workspace.yaml not found!"
    FILES_OK=false
else
    log_info "pnpm-workspace.yaml exists"
fi

echo ""

if [ "$FILES_OK" = false ]; then
    log_error "Critical files missing. Run 'git pull' to update."
    echo ""
    echo "Quick fix: Force reset to remote"
    echo "  git fetch origin"
    echo "  git reset --hard origin/main"
    echo ""
    read -p "Do you want to force reset now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git fetch origin
        git reset --hard origin/main
        log_info "Repository reset to origin/main"
    else
        exit 1
    fi
fi

# ============================================
# Step 2: 修复 .dockerignore
# ============================================
echo "Step 2: Fixing .dockerignore..."
echo ""

# 备份原文件
if [ -f ".dockerignore" ]; then
    cp .dockerignore .dockerignore.backup.$(date +%Y%m%d_%H%M%S)
    log_info "Backed up existing .dockerignore"
fi

# 创建干净的 .dockerignore
cat > .dockerignore <<'EOF'
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
EOF

# 转换为 Unix 格式（防止 Windows 行尾符问题）
if command -v dos2unix >/dev/null 2>&1; then
    dos2unix .dockerignore 2>/dev/null || true
else
    # 手动转换
    sed -i 's/\r$//' .dockerignore 2>/dev/null || sed -i '' 's/\r$//' .dockerignore 2>/dev/null || true
fi

log_info "Created clean .dockerignore"
echo ""

# ============================================
# Step 3: 清理 Docker 缓存
# ============================================
echo "Step 3: Cleaning Docker cache..."
echo ""

log_info "Pruning build cache..."
docker builder prune -af

log_info "Cleaning system..."
docker system prune -f

echo ""

# ============================================
# Step 4: 测试构建上下文
# ============================================
echo "Step 4: Testing build context..."
echo ""

TEST_DOCKERFILE=$(mktemp)
cat > "$TEST_DOCKERFILE" <<'TESTEOF'
FROM alpine:latest
WORKDIR /test
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
RUN echo "=== Files copied successfully ===" && ls -lah
TESTEOF

if docker build -f "$TEST_DOCKERFILE" . >/dev/null 2>&1; then
    log_info "Test build PASSED - build context is OK"
    rm -f "$TEST_DOCKERFILE"
else
    log_error "Test build FAILED"
    echo ""
    echo "Running diagnostic build..."
    docker build -f "$TEST_DOCKERFILE" . 2>&1 | tail -30
    rm -f "$TEST_DOCKERFILE"
    exit 1
fi

echo ""

# ============================================
# Step 5: 检查磁盘空间
# ============================================
echo "Step 5: Checking disk space..."
echo ""

DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    log_warn "Disk usage is high: ${DISK_USAGE}%"
    echo ""
    echo "Docker disk usage:"
    docker system df
    echo ""
    log_warn "Consider running: docker system prune -af --volumes"
else
    log_info "Disk space OK (${DISK_USAGE}% used)"
fi

echo ""

# ============================================
# 决定下一步
# ============================================
echo "============================================"
echo "Quick Fix Complete!"
echo "============================================"
echo ""

log_info "All checks passed. Ready to build."
echo ""

echo "Choose next step:"
echo "  1) Run production build now (./deploy.sh --prod --build)"
echo "  2) Run diagnostic first (./scripts/diagnose-docker-build.sh)"
echo "  3) Exit (I'll build manually)"
echo ""

read -p "Enter choice (1/2/3): " -n 1 -r
echo
echo ""

case $REPLY in
    1)
        log_info "Starting production build..."
        echo ""
        if [ -f "./deploy.sh" ]; then
            ./deploy.sh --prod --build
        else
            log_error "deploy.sh not found!"
            echo "Manual command:"
            echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml build"
        fi
        ;;
    2)
        log_info "Running diagnostics..."
        echo ""
        if [ -f "./scripts/diagnose-docker-build.sh" ]; then
            ./scripts/diagnose-docker-build.sh
        else
            log_error "Diagnostic script not found!"
        fi
        ;;
    3)
        log_info "Manual build command:"
        echo "  ./deploy.sh --prod --build"
        echo ""
        echo "Or:"
        echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml build"
        ;;
    *)
        log_warn "Invalid choice. Exiting."
        ;;
esac

echo ""
