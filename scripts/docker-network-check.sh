#!/bin/bash
# ============================================
# Docker Compose Network & Service Health Check
# 自动诊断 Docker 网络和服务连通性问题
# ============================================

set -e

echo "🔍 Docker Compose Network & Service Health Check"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

check_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

# ============================================
# 1. 检查 Docker Compose 服务状态
# ============================================
echo "1️⃣  Checking Docker Compose Services Status"
echo "-------------------------------------------"

SERVICES=(db db-init api web admin nginx)
ALL_RUNNING=true

for service in "${SERVICES[@]}"; do
    if docker compose ps --format json | jq -e ".[] | select(.Service == \"$service\")" > /dev/null 2>&1; then
        STATUS=$(docker compose ps --format json | jq -r ".[] | select(.Service == \"$service\") | .State")
        HEALTH=$(docker compose ps --format json | jq -r ".[] | select(.Service == \"$service\") | .Health")

        if [ "$STATUS" == "running" ]; then
            if [ "$HEALTH" == "healthy" ] || [ "$service" == "db-init" ]; then
                check_pass "Service '$service' is running and healthy"
            elif [ "$HEALTH" == "starting" ]; then
                check_warn "Service '$service' is running but health check still starting"
            else
                check_warn "Service '$service' is running but health: $HEALTH"
            fi
        elif [ "$STATUS" == "exited" ] && [ "$service" == "db-init" ]; then
            EXIT_CODE=$(docker compose ps --format json | jq -r ".[] | select(.Service == \"$service\") | .ExitCode")
            if [ "$EXIT_CODE" == "0" ]; then
                check_pass "Service '$service' completed successfully (exit 0)"
            else
                check_fail "Service '$service' exited with code $EXIT_CODE"
                ALL_RUNNING=false
            fi
        else
            check_fail "Service '$service' is not running (status: $STATUS)"
            ALL_RUNNING=false
        fi
    else
        check_fail "Service '$service' not found"
        ALL_RUNNING=false
    fi
done

echo ""

# ============================================
# 2. 检查 Docker 网络配置
# ============================================
echo "2️⃣  Checking Docker Network Configuration"
echo "-------------------------------------------"

NETWORK_NAME="cohe-capitl-monorepo_cohe-network"

if docker network ls | grep -q "$NETWORK_NAME"; then
    check_pass "Network '$NETWORK_NAME' exists"

    # 检查网络连接的容器
    CONNECTED_CONTAINERS=$(docker network inspect "$NETWORK_NAME" | jq -r '.[0].Containers | length')
    check_info "Connected containers: $CONNECTED_CONTAINERS"

    # 列出所有连接的容器
    docker network inspect "$NETWORK_NAME" | jq -r '.[0].Containers | to_entries[] | "  - \(.value.Name) (\(.value.IPv4Address))"'
else
    check_fail "Network '$NETWORK_NAME' does not exist"
fi

echo ""

# ============================================
# 3. 检查容器间网络连通性
# ============================================
echo "3️⃣  Checking Inter-Container Network Connectivity"
echo "-------------------------------------------"

# 检查 API -> DB 连通性
if docker compose ps api --format json | jq -e '.[] | select(.State == "running")' > /dev/null 2>&1; then
    check_info "Testing API -> DB connectivity..."
    if docker exec cohe-api sh -c 'timeout 3 nc -zv db 5432' 2>&1 | grep -q 'open\|succeeded'; then
        check_pass "API can connect to DB on port 5432"
    else
        check_fail "API cannot connect to DB on port 5432"
    fi
else
    check_warn "API service not running, skipping connectivity test"
fi

# 检查 Web -> API 连通性
if docker compose ps web --format json | jq -e '.[] | select(.State == "running")' > /dev/null 2>&1; then
    check_info "Testing Web -> API connectivity..."
    if docker exec cohe-web sh -c 'timeout 3 nc -zv api 3001' 2>&1 | grep -q 'open\|succeeded'; then
        check_pass "Web can connect to API on port 3001"
    else
        check_fail "Web cannot connect to API on port 3001"
    fi
else
    check_warn "Web service not running, skipping connectivity test"
fi

# 检查 Admin -> API 连通性
if docker compose ps admin --format json | jq -e '.[] | select(.State == "running")' > /dev/null 2>&1; then
    check_info "Testing Admin -> API connectivity..."
    if docker exec cohe-admin sh -c 'timeout 3 nc -zv api 3001' 2>&1 | grep -q 'open\|succeeded'; then
        check_pass "Admin can connect to API on port 3001"
    else
        check_fail "Admin cannot connect to API on port 3001"
    fi
else
    check_warn "Admin service not running, skipping connectivity test"
fi

# 检查 Nginx -> Web/Admin/API 连通性
if docker compose ps nginx --format json | jq -e '.[] | select(.State == "running")' > /dev/null 2>&1; then
    check_info "Testing Nginx -> upstream services..."

    if docker exec cohe-nginx sh -c 'timeout 3 nc -zv web 3000' 2>&1 | grep -q 'open\|succeeded'; then
        check_pass "Nginx can connect to Web on port 3000"
    else
        check_fail "Nginx cannot connect to Web on port 3000"
    fi

    if docker exec cohe-nginx sh -c 'timeout 3 nc -zv admin 3002' 2>&1 | grep -q 'open\|succeeded'; then
        check_pass "Nginx can connect to Admin on port 3002"
    else
        check_fail "Nginx cannot connect to Admin on port 3002"
    fi

    if docker exec cohe-nginx sh -c 'timeout 3 nc -zv api 3001' 2>&1 | grep -q 'open\|succeeded'; then
        check_pass "Nginx can connect to API on port 3001"
    else
        check_fail "Nginx cannot connect to API on port 3001"
    fi
else
    check_warn "Nginx service not running, skipping connectivity tests"
fi

echo ""

# ============================================
# 4. 检查端口映射和暴露
# ============================================
echo "4️⃣  Checking Port Mappings (Host -> Container)"
echo "-------------------------------------------"

# 检查主机端口映射
check_port_mapping() {
    local service=$1
    local host_port=$2
    local container_port=$3

    if docker compose ps "$service" --format json | jq -e '.[] | select(.State == "running")' > /dev/null 2>&1; then
        MAPPED=$(docker compose ps "$service" --format json | jq -r '.[].Publishers[] | select(.TargetPort == '"$container_port"') | .PublishedPort')
        if [ "$MAPPED" == "$host_port" ]; then
            check_pass "Service '$service': localhost:$host_port -> container:$container_port"
        else
            check_fail "Service '$service': Expected port $host_port but got $MAPPED"
        fi
    else
        check_warn "Service '$service' not running"
    fi
}

check_port_mapping "db" "5432" "5432"
check_port_mapping "api" "3001" "3001"
check_port_mapping "web" "3000" "3000"
check_port_mapping "admin" "3002" "3002"
check_port_mapping "nginx" "80" "80"

echo ""

# ============================================
# 5. 检查 API 健康端点
# ============================================
echo "5️⃣  Checking API Health Endpoints"
echo "-------------------------------------------"

# 从容器内部检查
if docker compose ps api --format json | jq -e '.[] | select(.State == "running")' > /dev/null 2>&1; then
    check_info "Testing API /healthz from inside container..."
    HEALTH_RESPONSE=$(docker exec cohe-api wget -qO- http://127.0.0.1:3001/healthz 2>&1)
    if [ $? -eq 0 ]; then
        check_pass "API /healthz responds from inside container: $HEALTH_RESPONSE"
    else
        check_fail "API /healthz not responding from inside container"
    fi

    # 从主机检查
    check_info "Testing API /healthz from host..."
    HOST_HEALTH=$(curl -s http://localhost:3001/healthz 2>&1)
    if [ $? -eq 0 ]; then
        check_pass "API /healthz responds from host: $HOST_HEALTH"
    else
        check_fail "API /healthz not responding from host"
    fi

    # 测试 nonce 端点
    check_info "Testing API /api/auth/siwe/nonce from host..."
    NONCE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/siwe/nonce \
        -H "Content-Type: application/json" \
        -d '{"walletAddress":"0x83B6e7E65F223336b7531CCAb6468017a5EB7f77"}' 2>&1)

    if echo "$NONCE_RESPONSE" | grep -q "nonce"; then
        check_pass "API nonce endpoint working: $(echo $NONCE_RESPONSE | jq -r .nonce)"
    else
        check_fail "API nonce endpoint failed: $NONCE_RESPONSE"
    fi
else
    check_warn "API service not running"
fi

echo ""

# ============================================
# 6. 检查数据库连接
# ============================================
echo "6️⃣  Checking Database Connectivity"
echo "-------------------------------------------"

if docker compose ps db --format json | jq -e '.[] | select(.State == "running")' > /dev/null 2>&1; then
    # 从容器内部检查
    check_info "Testing database from inside container..."
    if docker exec cohe-db psql -U postgres -d web3_insurance -c "SELECT 1;" > /dev/null 2>&1; then
        check_pass "Database connection working from inside container"

        # 检查表是否存在
        TABLES=$(docker exec cohe-db psql -U postgres -d web3_insurance -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        check_info "Number of tables in database: $(echo $TABLES | xargs)"

        # 检查 User 表的 roles 字段
        ROLES_COLUMN=$(docker exec cohe-db psql -U postgres -d web3_insurance -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'roles';")
        if [ -n "$ROLES_COLUMN" ]; then
            check_pass "User table has 'roles' column (migration applied)"
        else
            check_fail "User table missing 'roles' column (migration not applied)"
        fi
    else
        check_fail "Cannot connect to database from inside container"
    fi

    # 从主机检查（如果端口已映射）
    check_info "Testing database from host..."
    if psql -h localhost -U postgres -d web3_insurance -c "SELECT 1;" > /dev/null 2>&1; then
        check_pass "Database connection working from host"
    else
        check_warn "Cannot connect to database from host (port may not be exposed or psql not installed)"
    fi
else
    check_fail "Database service not running"
fi

echo ""

# ============================================
# 7. 检查环境变量配置
# ============================================
echo "7️⃣  Checking Environment Variables"
echo "-------------------------------------------"

if docker compose ps api --format json | jq -e '.[] | select(.State == "running")' > /dev/null 2>&1; then
    check_info "Checking API environment variables..."

    DATABASE_URL=$(docker exec cohe-api printenv DATABASE_URL)
    if echo "$DATABASE_URL" | grep -q "postgresql://.*@db:5432"; then
        check_pass "API DATABASE_URL correctly points to 'db' service"
    else
        check_fail "API DATABASE_URL incorrect: $DATABASE_URL"
    fi

    API_PREFIX=$(docker exec cohe-api printenv API_PREFIX)
    if [ "$API_PREFIX" == "api" ]; then
        check_pass "API_PREFIX is correctly set to 'api'"
    else
        check_warn "API_PREFIX is '$API_PREFIX' (expected 'api')"
    fi
fi

if docker compose ps web --format json | jq -e '.[] | select(.State == "running")' > /dev/null 2>&1; then
    check_info "Checking Web environment variables..."

    NEXT_PUBLIC_API_BASE=$(docker exec cohe-web printenv NEXT_PUBLIC_API_BASE)
    NEXT_PUBLIC_API_PORT=$(docker exec cohe-web printenv NEXT_PUBLIC_API_PORT)

    check_info "NEXT_PUBLIC_API_BASE: $NEXT_PUBLIC_API_BASE"
    check_info "NEXT_PUBLIC_API_PORT: $NEXT_PUBLIC_API_PORT"

    if [ "$NEXT_PUBLIC_API_BASE" == "/api" ] && [ "$NEXT_PUBLIC_API_PORT" == "3001" ]; then
        check_pass "Web API configuration looks correct"
    else
        check_warn "Web API configuration may need review"
    fi
fi

echo ""

# ============================================
# 8. 检查日志中的错误
# ============================================
echo "8️⃣  Checking Recent Logs for Errors"
echo "-------------------------------------------"

for service in api web admin; do
    if docker compose ps "$service" --format json | jq -e '.[] | select(.State == "running")' > /dev/null 2>&1; then
        ERROR_COUNT=$(docker compose logs --tail 100 "$service" 2>&1 | grep -i "error\|fail\|exception" | wc -l)
        if [ "$ERROR_COUNT" -eq 0 ]; then
            check_pass "No recent errors in '$service' logs"
        else
            check_warn "Found $ERROR_COUNT error messages in '$service' logs (check 'docker compose logs $service')"
        fi
    fi
done

echo ""

# ============================================
# 9. 生成诊断报告
# ============================================
echo "9️⃣  Diagnostic Summary"
echo "-------------------------------------------"

if [ "$ALL_RUNNING" = true ]; then
    echo -e "${GREEN}✅ All services are running${NC}"
else
    echo -e "${RED}❌ Some services are not running properly${NC}"
fi

echo ""
echo "📋 Quick Commands for Further Investigation:"
echo "-------------------------------------------"
echo "  docker compose ps                    # View all services status"
echo "  docker compose logs -f api           # Follow API logs"
echo "  docker compose logs -f web           # Follow Web logs"
echo "  docker exec -it cohe-db psql -U postgres -d web3_insurance"
echo "  docker exec -it cohe-api sh          # Enter API container"
echo "  docker network inspect cohe-capitl-monorepo_cohe-network"
echo ""

echo "=================================================="
echo "✅ Health check completed!"
echo "=================================================="
