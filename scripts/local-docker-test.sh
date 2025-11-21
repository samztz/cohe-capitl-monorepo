#!/bin/bash

# ============================================
# 本地 Docker 部署与测试一键脚本
# ============================================
#
# 用途: 自动化完成本地 Docker 环境的部署和测试
# 使用: ./scripts/local-docker-test.sh
#
# ============================================

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

log_step() {
    echo ""
    echo -e "${CYAN}======================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}======================================${NC}"
}

# ======================================
# 检查前置条件
# ======================================

check_prerequisites() {
    log_step "Step 0: 检查前置条件"

    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    log_success "Docker 已安装: $(docker --version)"

    # 检查 Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装或版本过低"
        exit 1
    fi
    log_success "Docker Compose 已安装: $(docker compose version)"

    # 检查 Docker 服务是否运行
    if ! docker info &> /dev/null; then
        log_error "Docker 服务未运行，请启动 Docker"
        exit 1
    fi
    log_success "Docker 服务运行中"

    # 检查端口占用
    log_info "检查端口占用..."
    ports_in_use=()

    for port in 80 3000 3001 3002; do
        if lsof -i :$port &> /dev/null; then
            ports_in_use+=($port)
        fi
    done

    if [ ${#ports_in_use[@]} -gt 0 ]; then
        log_warning "以下端口被占用: ${ports_in_use[*]}"
        log_warning "请停止占用的进程或修改 .env 中的端口配置"
        read -p "是否继续? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "所有必需端口可用"
    fi
}

# ======================================
# 配置环境变量
# ======================================

setup_env() {
    log_step "Step 1: 配置环境变量"

    if [ ! -f .env ]; then
        log_info "未找到 .env 文件，创建新配置..."

        if [ -f .env.docker-local ]; then
            cp .env.docker-local .env
            log_success ".env 文件已创建（从 .env.docker-local 复制）"
        elif [ -f .env.local.example ]; then
            cp .env.local.example .env
            log_success ".env 文件已创建（从 .env.local.example 复制）"
        else
            log_error "未找到环境变量模板文件"
            exit 1
        fi
    else
        log_success ".env 文件已存在"
    fi

    # 检查 WalletConnect Project ID
    if grep -q "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID_HERE" .env || \
       grep -q "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$" .env || \
       ! grep -q "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=" .env; then

        log_warning "WalletConnect Project ID 未配置！"
        echo ""
        echo "请按照以下步骤获取 Project ID:"
        echo "1. 访问: https://cloud.reown.com/"
        echo "2. 注册/登录账号"
        echo "3. 创建新项目 (Project Name: Cohe Capital Local Test)"
        echo "4. 复制 Project ID"
        echo ""
        read -p "请输入你的 WalletConnect Project ID: " project_id

        if [ -z "$project_id" ]; then
            log_warning "未输入 Project ID，WalletConnect 功能将无法使用"
        else
            # 更新 .env 文件
            if grep -q "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=" .env; then
                sed -i "s/NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=.*/NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$project_id/" .env
            else
                echo "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$project_id" >> .env
            fi
            log_success "Project ID 已保存到 .env"
        fi
    else
        log_success "WalletConnect Project ID 已配置"
    fi

    # 显示关键配置
    log_info "当前配置:"
    grep -E "^(API_PORT|WEB_PORT|ADMIN_PORT|NGINX_HTTP_PORT)=" .env || true
}

# ======================================
# 创建必需目录
# ======================================

create_directories() {
    log_step "Step 2: 创建数据目录"

    mkdir -p docker-volumes/db-data
    mkdir -p docker-volumes/uploads/signatures

    log_success "数据目录已创建:"
    log_info "  - docker-volumes/db-data (PostgreSQL 数据)"
    log_info "  - docker-volumes/uploads/signatures (上传文件)"
}

# ======================================
# 验证配置
# ======================================

validate_config() {
    log_step "Step 3: 验证 Docker 配置"

    log_info "验证 docker-compose.yml 语法..."
    if docker compose config > /dev/null 2>&1; then
        log_success "docker-compose.yml 配置正确"
    else
        log_error "docker-compose.yml 配置有误"
        docker compose config
        exit 1
    fi
}

# ======================================
# 构建镜像
# ======================================

build_images() {
    log_step "Step 4: 构建 Docker 镜像"

    log_info "开始构建镜像（可能需要 5-10 分钟）..."

    if docker compose build 2>&1 | tee /tmp/docker-build.log; then
        log_success "所有镜像构建成功"

        echo ""
        log_info "构建的镜像:"
        docker images | grep -E "cohe|IMAGE" | head -4
    else
        log_error "镜像构建失败，请查看日志: /tmp/docker-build.log"
        exit 1
    fi
}

# ======================================
# 启动服务
# ======================================

start_services() {
    log_step "Step 5: 启动所有服务"

    log_info "启动 Docker Compose 服务..."
    docker compose up -d

    log_success "服务已启动，等待健康检查..."

    # 等待服务启动
    log_info "等待服务完全启动 (30 秒)..."
    for i in {1..30}; do
        echo -n "."
        sleep 1
    done
    echo ""

    # 显示服务状态
    log_info "当前服务状态:"
    docker compose ps
}

# ======================================
# 运行数据库迁移
# ======================================

run_migrations() {
    log_step "Step 6: 运行数据库迁移"

    log_info "等待数据库就绪..."

    # 等待 PostgreSQL 就绪
    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker compose exec -T db pg_isready -U postgres &> /dev/null; then
            log_success "数据库已就绪"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    echo ""

    if [ $attempt -eq $max_attempts ]; then
        log_error "数据库启动超时"
        exit 1
    fi

    log_info "执行 Prisma 迁移..."

    if docker compose run --rm api sh -c "cd /app/apps/api && pnpm prisma migrate deploy" 2>&1 | tee /tmp/migrate.log; then
        log_success "数据库迁移完成"
    else
        log_error "数据库迁移失败，请查看日志: /tmp/migrate.log"
        exit 1
    fi
}

# ======================================
# 运行测试
# ======================================

run_tests() {
    log_step "Step 7: 运行自动化测试"

    log_info "等待服务健康检查完成 (10 秒)..."
    sleep 10

    if [ -f scripts/tests/docker-verify.sh ]; then
        log_info "运行测试脚本..."
        if bash scripts/tests/docker-verify.sh; then
            log_success "所有测试通过！"
            return 0
        else
            log_error "部分测试失败，请检查日志"
            return 1
        fi
    else
        log_warning "测试脚本不存在，跳过自动化测试"
        log_info "手动测试命令:"
        echo "  curl http://localhost/api/healthz"
        echo "  curl http://localhost/"
        echo "  curl http://localhost/admin"
    fi
}

# ======================================
# 显示访问信息
# ======================================

show_access_info() {
    log_step "✅ 部署完成"

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}    Docker 部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${CYAN}📱 访问地址:${NC}"
    echo ""
    echo -e "  ${BLUE}Web 前端:${NC}"
    echo -e "    http://localhost/"
    echo ""
    echo -e "  ${BLUE}Admin 后台:${NC}"
    echo -e "    http://localhost/admin"
    echo -e "    Admin Token: $(grep ADMIN_TOKEN .env | cut -d'=' -f2)"
    echo ""
    echo -e "  ${BLUE}API 文档:${NC}"
    echo -e "    http://localhost/api-docs"
    echo ""
    echo -e "  ${BLUE}API 健康检查:${NC}"
    echo -e "    http://localhost/api/healthz"
    echo ""
    echo -e "${CYAN}🛠️  常用命令:${NC}"
    echo ""
    echo -e "  ${BLUE}查看日志:${NC}"
    echo -e "    docker compose logs -f [service]"
    echo -e "    例: docker compose logs -f api"
    echo ""
    echo -e "  ${BLUE}查看服务状态:${NC}"
    echo -e "    docker compose ps"
    echo ""
    echo -e "  ${BLUE}停止所有服务:${NC}"
    echo -e "    docker compose down"
    echo ""
    echo -e "  ${BLUE}重启服务:${NC}"
    echo -e "    docker compose restart [service]"
    echo ""
    echo -e "  ${BLUE}进入容器:${NC}"
    echo -e "    docker compose exec api sh"
    echo ""
    echo -e "${CYAN}📊 数据库连接:${NC}"
    echo ""
    echo -e "  ${BLUE}从宿主机连接:${NC}"
    echo -e "    psql -h localhost -U postgres -d web3_insurance"
    echo -e "    密码: postgres"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

# ======================================
# 清理函数
# ======================================

cleanup_on_error() {
    log_error "部署失败！"
    echo ""
    log_info "查看服务状态:"
    docker compose ps
    echo ""
    log_info "查看详细日志:"
    echo "  docker compose logs -f"
    exit 1
}

# ======================================
# 主流程
# ======================================

main() {
    trap cleanup_on_error ERR

    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}  Cohe Capital - Docker 本地部署测试${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""

    check_prerequisites
    setup_env
    create_directories
    validate_config
    build_images
    start_services
    run_migrations

    # 运行测试（即使失败也继续）
    set +e
    run_tests
    test_result=$?
    set -e

    show_access_info

    if [ $test_result -ne 0 ]; then
        log_warning "部分测试失败，但服务已启动，可以手动验证"
    fi

    echo ""
    log_info "按 Ctrl+C 退出，服务将继续在后台运行"
    log_info "查看实时日志:"
    echo ""

    # 禁用 ERR trap，避免 Ctrl+C 触发清理
    trap - ERR

    docker compose logs -f
}

# 执行主流程
main
