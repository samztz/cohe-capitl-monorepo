#!/bin/bash

# ======================================
# Docker 部署验证测试脚本
# ======================================
#
# 用途：自动化验证所有 10 个 Docker 修复是否生效
# 使用：./scripts/tests/docker-verify.sh
#
# 前置条件：
# - Docker 服务已启动
# - 已执行 docker compose up -d
# - 所有服务健康检查通过
# ======================================

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 统计
passed=0
failed=0

# ======================================
# 辅助函数
# ======================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 测试 HTTP 端点
test_http_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    local match_pattern="${4:-}"

    echo -n "Testing $name... "

    local response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "000")
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)

    if [ "$status_code" = "$expected_code" ]; then
        if [ -n "$match_pattern" ]; then
            if echo "$body" | grep -q "$match_pattern"; then
                log_success "PASS (HTTP $status_code, matched '$match_pattern')"
                ((passed++))
            else
                log_error "FAIL (HTTP $status_code, but pattern not found)"
                echo "  Response: $body"
                ((failed++))
            fi
        else
            log_success "PASS (HTTP $status_code)"
            ((passed++))
        fi
    else
        log_error "FAIL (Expected HTTP $expected_code, got $status_code)"
        ((failed++))
    fi
}

# 测试容器内命令
test_container_command() {
    local name="$1"
    local container="$2"
    local command="$3"
    local expected_pattern="${4:-}"

    echo -n "Testing $name... "

    local output=$(docker compose exec -T "$container" sh -c "$command" 2>&1 || echo "COMMAND_FAILED")

    if [ "$output" = "COMMAND_FAILED" ]; then
        log_error "FAIL (Command execution failed)"
        ((failed++))
    elif [ -n "$expected_pattern" ]; then
        if echo "$output" | grep -q "$expected_pattern"; then
            log_success "PASS (matched '$expected_pattern')"
            ((passed++))
        else
            log_error "FAIL (Expected pattern not found)"
            echo "  Output: $output"
            ((failed++))
        fi
    else
        log_success "PASS"
        ((passed++))
    fi
}

# 测试端口是否关闭
test_port_closed() {
    local name="$1"
    local port="$2"

    echo -n "Testing $name... "

    if nc -z localhost "$port" 2>/dev/null; then
        log_error "FAIL (Port $port is OPEN, should be CLOSED)"
        ((failed++))
    else
        log_success "PASS (Port $port is closed)"
        ((passed++))
    fi
}

# ======================================
# 主测试流程
# ======================================

echo "======================================"
echo "Docker 部署验证测试"
echo "======================================"
echo ""

# 检查服务状态
log_info "检查服务健康状态..."
docker compose ps

echo ""
log_info "等待服务完全启动..."
sleep 5

echo ""
echo "======================================"
echo "开始测试"
echo "======================================"
echo ""

# ✅ Test 1: API 健康检查 (/healthz)
test_http_endpoint "Test 1: API Health Check" "http://localhost/api/healthz" 200

# ✅ Test 2: API Swagger 文档
test_http_endpoint "Test 2: API Swagger Docs" "http://localhost/api-docs" 200

# ✅ Test 3: Web 前端可访问
test_http_endpoint "Test 3: Web Frontend" "http://localhost/" 200

# ✅ Test 4: Admin 后台可访问
test_http_endpoint "Test 4: Admin Panel" "http://localhost/admin" 200

# ✅ Test 5: Nginx 健康检查
test_http_endpoint "Test 5: Nginx Health" "http://localhost/health" 200 "healthy"

# ✅ Test 6: 数据库内网访问（从 API 容器）
echo -n "Testing Test 6: Database Connection from API... "
# 使用 Prisma Client 测试连接
test_container_command \
    "Test 6: Database Connection" \
    "api" \
    "node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\\\$connect().then(() => console.log('DB_CONNECTED')).catch(e => console.error('DB_FAILED:', e.message))\"" \
    "DB_CONNECTED"

# ✅ Test 7: 数据库外网隔离（从宿主机）
# 注意：如果在 .env 中启用了端口映射，此测试会失败（这是预期行为）
log_info "Test 7: Database Port Isolation..."
if grep -q "^DB_PORT=" .env 2>/dev/null && ! grep -q "^# DB_PORT=" .env 2>/dev/null; then
    log_warning "SKIP (DB_PORT is enabled in .env for local development)"
else
    test_port_closed "Database Port Isolation" 5432
fi

# ✅ Test 8: 上传目录可写
test_container_command \
    "Test 8: Uploads Directory Writable" \
    "api" \
    "echo 'test-content' > /app/apps/api/uploads/test-file.txt && cat /app/apps/api/uploads/test-file.txt" \
    "test-content"

# 验证持久化
echo -n "Testing Test 8b: Uploads Persistence... "
if [ -f "docker-volumes/uploads/test-file.txt" ]; then
    log_success "PASS (File persisted to host)"
    ((passed++))
else
    log_error "FAIL (File not found on host)"
    ((failed++))
fi

# ✅ Test 9: API 端口正确 (3001)
test_container_command \
    "Test 9: API Internal Port" \
    "api" \
    "wget -q -O- http://localhost:3001/healthz" \
    ""

# ✅ Test 10: Web/Admin 端口正确 (3000/3002)
test_container_command \
    "Test 10a: Web Internal Port" \
    "web" \
    "wget -q -O- http://localhost:3000/" \
    ""

test_container_command \
    "Test 10b: Admin Internal Port" \
    "admin" \
    "wget -q -O- http://localhost:3002/" \
    ""

echo ""
echo "======================================"
echo "测试总结"
echo "======================================"
echo ""

if [ $failed -eq 0 ]; then
    log_success "所有测试通过！($passed passed, $failed failed)"
    echo ""
    log_info "Docker 部署配置验证成功，可以用于生产环境部署。"
    exit 0
else
    log_error "测试失败！($passed passed, $failed failed)"
    echo ""
    log_info "请检查失败的测试项，修复后重新运行。"
    exit 1
fi
