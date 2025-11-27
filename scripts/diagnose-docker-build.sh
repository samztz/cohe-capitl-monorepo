#!/bin/bash

# ============================================
# Docker Build Diagnostics Script
# 用于诊断 ECS 或远程服务器上的 Docker 构建问题
# ============================================

set -e

echo "============================================"
echo "Docker Build Diagnostics"
echo "============================================"
echo ""

# ============================================
# 1. 检查关键文件是否存在
# ============================================
echo "1. Checking critical files..."
echo ""

FILES=(
    "pnpm-lock.yaml"
    "pnpm-workspace.yaml"
    "package.json"
    ".dockerignore"
    "apps/api/Dockerfile"
    "apps/web/Dockerfile"
    "apps/admin/Dockerfile"
)

MISSING_FILES=0

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        SIZE=$(ls -lh "$file" | awk '{print $5}')
        echo "  ✓ $file ($SIZE)"
    else
        echo "  ✗ MISSING: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""

if [ $MISSING_FILES -gt 0 ]; then
    echo "ERROR: $MISSING_FILES file(s) missing!"
    exit 1
fi

# ============================================
# 2. 检查 .dockerignore 内容
# ============================================
echo "2. Checking .dockerignore patterns..."
echo ""

if [ -f ".dockerignore" ]; then
    echo "  Content:"
    cat .dockerignore | sed 's/^/    /'
    echo ""

    # 检查是否有可能匹配 pnpm-lock.yaml 的模式
    if grep -E '^\*\.log$|^\.log$|^.*lock.*$|^pnpm-lock\.yaml$' .dockerignore >/dev/null 2>&1; then
        echo "  ⚠️  WARNING: Found patterns that might exclude pnpm-lock.yaml!"
        echo "     Problematic patterns:"
        grep -E '^\*\.log$|^\.log$|^.*lock.*$|^pnpm-lock\.yaml$' .dockerignore | sed 's/^/       /'
        echo ""
    else
        echo "  ✓ No problematic patterns found"
        echo ""
    fi
else
    echo "  ⚠️  No .dockerignore file found"
    echo ""
fi

# ============================================
# 3. 测试 Docker Build Context
# ============================================
echo "3. Testing Docker build context..."
echo ""

# 创建临时测试 Dockerfile
TEST_DOCKERFILE=$(mktemp)
cat > "$TEST_DOCKERFILE" <<'EOF'
FROM alpine:latest
WORKDIR /test

# Test 1: Copy pnpm files
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY package.json ./package.json

# Test 2: List files
RUN echo "=== Files in /test ===" && ls -lah /test/

# Test 3: Check pnpm-lock.yaml content
RUN echo "=== pnpm-lock.yaml first 10 lines ===" && head -n 10 /test/pnpm-lock.yaml

# Test 4: Check file sizes
RUN echo "=== File sizes ===" && wc -c /test/*
EOF

echo "  Running test build..."
if docker build -f "$TEST_DOCKERFILE" . 2>&1 | tee /tmp/docker-build-test.log; then
    echo ""
    echo "  ✓ Test build PASSED - pnpm files are accessible"
else
    echo ""
    echo "  ✗ Test build FAILED"
    echo ""
    echo "  Last 30 lines of build output:"
    tail -n 30 /tmp/docker-build-test.log | sed 's/^/    /'
    rm -f "$TEST_DOCKERFILE"
    exit 1
fi

rm -f "$TEST_DOCKERFILE"
echo ""

# ============================================
# 4. 检查 Docker Compose 配置
# ============================================
echo "4. Checking Docker Compose configuration..."
echo ""

if [ -f "docker-compose.yml" ]; then
    echo "  ✓ docker-compose.yml exists"

    # 检查 build context
    echo ""
    echo "  Build contexts:"
    grep -A 3 "build:" docker-compose.yml | grep "context:" | sed 's/^/    /'

    echo ""
    echo "  Dockerfiles:"
    grep -A 3 "build:" docker-compose.yml | grep "dockerfile:" | sed 's/^/    /'
else
    echo "  ✗ docker-compose.yml NOT FOUND"
fi

if [ -f "docker-compose.prod.yml" ]; then
    echo ""
    echo "  ✓ docker-compose.prod.yml exists"
else
    echo ""
    echo "  ⚠️  docker-compose.prod.yml NOT FOUND"
fi

echo ""

# ============================================
# 5. 检查 Docker 版本和配置
# ============================================
echo "5. Docker environment..."
echo ""

echo "  Docker version:"
docker --version | sed 's/^/    /'

echo ""
echo "  Docker Compose version:"
docker compose version | sed 's/^/    /'

echo ""
echo "  Docker buildx builder:"
docker buildx ls | sed 's/^/    /'

echo ""

# ============================================
# 6. 检查 Git 状态
# ============================================
echo "6. Git status..."
echo ""

if [ -d ".git" ]; then
    echo "  Current branch:"
    git branch --show-current | sed 's/^/    /'

    echo ""
    echo "  Uncommitted changes:"
    if git status --porcelain | grep -E '(pnpm-lock|dockerignore|Dockerfile)'; then
        git status --porcelain | grep -E '(pnpm-lock|dockerignore|Dockerfile)' | sed 's/^/    /'
    else
        echo "    (none affecting Docker build)"
    fi

    echo ""
    echo "  Last commit:"
    git log -1 --oneline | sed 's/^/    /'
else
    echo "  ⚠️  Not a git repository"
fi

echo ""

# ============================================
# 7. 生成诊断报告
# ============================================
REPORT_FILE="/tmp/docker-build-diagnostics-$(date +%Y%m%d_%H%M%S).txt"

echo "============================================"
echo "Diagnostics Complete!"
echo "============================================"
echo ""
echo "Summary:"
echo "  ✓ All critical files present: $([ $MISSING_FILES -eq 0 ] && echo 'YES' || echo 'NO')"
echo "  ✓ Test build successful: YES"
echo "  ✓ Docker environment: OK"
echo ""
echo "Full report saved to: $REPORT_FILE"
echo ""

# 保存完整报告
{
    echo "Docker Build Diagnostics Report"
    echo "Generated: $(date)"
    echo "Directory: $(pwd)"
    echo ""
    echo "========================================"
    echo "Critical Files Check"
    echo "========================================"
    echo ""
    for file in "${FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "✓ $file"
            ls -lh "$file"
        else
            echo "✗ MISSING: $file"
        fi
        echo ""
    done

    echo "========================================"
    echo ".dockerignore Content"
    echo "========================================"
    echo ""
    if [ -f ".dockerignore" ]; then
        cat .dockerignore
    else
        echo "(file not found)"
    fi
    echo ""

    echo "========================================"
    echo "Test Build Output"
    echo "========================================"
    echo ""
    if [ -f "/tmp/docker-build-test.log" ]; then
        cat /tmp/docker-build-test.log
    fi
    echo ""

    echo "========================================"
    echo "Docker Environment"
    echo "========================================"
    echo ""
    docker --version
    docker compose version
    docker buildx ls
    echo ""

    echo "========================================"
    echo "Git Status"
    echo "========================================"
    echo ""
    if [ -d ".git" ]; then
        git status
    else
        echo "(not a git repository)"
    fi

} > "$REPORT_FILE"

echo "To run production build, use:"
echo "  ./deploy.sh --prod --build"
echo ""
echo "Or manually:"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml build"
echo ""
