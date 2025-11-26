#!/bin/bash
# ============================================
# 生产环境准备脚本
# Cohe Capital Insurance Platform
# ============================================
#
# 用途：帮助用户快速准备生产部署所需的配置文件
#
# 使用方法：
#   ./scripts/prepare-production.sh
#
# 这个脚本会：
#   1. 检查必需文件是否存在
#   2. 生成强随机密钥
#   3. 创建 .env.production 并填充默认值
#   4. 提示用户需要手动配置的项目
#
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_header() {
    echo ""
    echo "============================================"
    echo "$1"
    echo "============================================"
}

# ============================================
# 主流程
# ============================================

print_header "🚀 Cohe Capital 生产环境准备工具"

# 检查是否在项目根目录
if [ ! -f "docker-compose.yml" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 检查必需文件
print_header "📁 检查必需文件"
required_files=(
    ".env.production.example"
    "docker-compose.yml"
    "docker-compose.prod.yml"
    "deploy.sh"
    "infra/nginx/nginx.prod.conf"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        log_success "$file"
    else
        log_error "$file 缺失"
        exit 1
    fi
done

# 检查 .env.production 是否已存在
print_header "📝 创建生产环境变量文件"

if [ -f ".env.production" ]; then
    log_warning ".env.production 已存在"
    read -p "是否覆盖现有文件？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "保留现有 .env.production"
        log_info "如需重新生成，请手动删除后重新运行此脚本"
        exit 0
    fi
    # 备份现有文件
    backup_file=".env.production.backup.$(date +%Y%m%d_%H%M%S)"
    mv .env.production "$backup_file"
    log_success "已备份到 $backup_file"
fi

# 生成强随机密钥
print_header "🔐 生成安全密钥"

log_info "正在生成密钥..."
JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 32 | tr -d '\n')
ADMIN_TOKEN=$(openssl rand -hex 32 | tr -d '\n')
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '\n' | tr -d '/' | tr '+' '-')

log_success "JWT_SECRET: ${JWT_SECRET:0:20}..."
log_success "JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:0:20}..."
log_success "ADMIN_TOKEN: ${ADMIN_TOKEN:0:20}..."
log_success "POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:0:16}..."

# 询问域名
print_header "🌐 配置域名"

read -p "请输入你的域名（例如：example.com）: " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="your-domain.com"
    log_warning "未输入域名，使用占位符: $DOMAIN"
    log_warning "请稍后手动修改 .env.production"
else
    log_success "域名: $DOMAIN"
fi

# 询问 WalletConnect Project ID
read -p "请输入 WalletConnect Project ID (从 https://cloud.reown.com/ 获取): " WALLETCONNECT_ID
if [ -z "$WALLETCONNECT_ID" ]; then
    WALLETCONNECT_ID="e1d4344896342c6efb5aab6396d3ae24"
    log_warning "未输入 WalletConnect ID，使用示例值"
    log_warning "请稍后手动修改 .env.production"
else
    log_success "WalletConnect ID: $WALLETCONNECT_ID"
fi

# 创建 .env.production
log_info "正在创建 .env.production..."

cat > .env.production << EOF
# ============================================
# Production Environment Configuration
# Cohe Capital Insurance Platform
# ============================================
#
# 自动生成时间: $(date)
# 生成工具: scripts/prepare-production.sh
#
# ⚠️  重要安全提示：
#   - 此文件包含敏感信息，请勿提交到 Git
#   - 请妥善保管此文件的备份
#   - 部署后请验证所有配置是否正确
#
# ============================================

# ============================================
# Docker & Infrastructure
# ============================================
NODE_VERSION=20-alpine

# ============================================
# Database Configuration (PostgreSQL)
# ============================================
POSTGRES_USER=cohe_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=cohe_capital

# Database connection string
DATABASE_URL=postgresql://cohe_user:${POSTGRES_PASSWORD}@db:5432/cohe_capital

# Database volume path (production)
DB_DATA_PATH=./docker-volumes/db-data

# ============================================
# API Service (NestJS Backend)
# ============================================
API_PORT=3001
API_PREFIX=api

# JWT Authentication (自动生成的强随机密钥)
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRATION=7d

# SIWE (Sign-In with Ethereum)
SIWE_DOMAIN=${DOMAIN}
SIWE_URI=https://${DOMAIN}

# Admin authentication token (自动生成)
ADMIN_TOKEN=${ADMIN_TOKEN}

# File storage
SIGNATURE_STORAGE_DIR=uploads/signatures

# CORS configuration (生产环境严格限制)
CORS_ORIGIN=https://${DOMAIN},https://admin.${DOMAIN}

# Uploads volume path
UPLOADS_PATH=./docker-volumes/uploads

# Blockchain RPC
RPC_BSC=https://bsc-dataseed.binance.org/

# Treasury wallet address
TREASURY_ADDRESS=0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199

# ============================================
# Web Service (Next.js User Frontend)
# ============================================
WEB_PORT=3000

# API endpoint (browser access via nginx)
NEXT_PUBLIC_API_BASE=/api
NEXT_PUBLIC_API_PORT=3001

# WalletConnect/Reown AppKit Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${WALLETCONNECT_ID}

# Blockchain configuration (BSC Testnet for demo, use 56 for Mainnet)
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_CHAIN_NAME=BSC Testnet

# App metadata
NEXT_PUBLIC_APP_NAME=Cohe Capital
NEXT_PUBLIC_APP_DESCRIPTION=Web3 Insurance Platform

# ============================================
# Admin Service (Next.js Admin Panel)
# ============================================
ADMIN_PORT=3002
NEXT_PUBLIC_ADMIN_API_BASE=/api

# ============================================
# Nginx Reverse Proxy
# ============================================
NGINX_HTTP_PORT=80
# NGINX_HTTPS_PORT=443  # 取消注释并配置 SSL 后启用

# ============================================
# 生产环境检查清单
# ============================================
#
# 部署前必须完成：
# [ ] 验证 SIWE_DOMAIN 和 CORS_ORIGIN 是否正确
# [ ] 获取真实的 WalletConnect Project ID
# [ ] 配置 DNS A 记录指向服务器
# [ ] （可选）获取 SSL 证书并配置 HTTPS
# [ ] 更新 infra/nginx/nginx.prod.conf 中的域名
# [ ] 配置服务器防火墙（开放 80/443 端口）
#
# ============================================
EOF

log_success ".env.production 创建成功"

# 更新 nginx.prod.conf 中的域名
print_header "🌐 更新 Nginx 配置"

if [ "$DOMAIN" != "your-domain.com" ]; then
    log_info "正在更新 infra/nginx/nginx.prod.conf..."

    # 备份原文件
    cp infra/nginx/nginx.prod.conf infra/nginx/nginx.prod.conf.backup

    # 替换域名
    sed -i.bak "s/your-domain.com/$DOMAIN/g" infra/nginx/nginx.prod.conf
    rm infra/nginx/nginx.prod.conf.bak

    log_success "Nginx 配置已更新"
    log_info "Web 域名: $DOMAIN"
    log_info "Admin 域名: admin.$DOMAIN"
else
    log_warning "域名使用占位符，请手动编辑 infra/nginx/nginx.prod.conf"
fi

# 显示生成的密钥（用户需要保存）
print_header "🔑 重要信息（请妥善保管）"

echo ""
echo "以下是自动生成的密钥，请保存到安全的地方："
echo ""
echo "Admin Token (管理员登录令牌):"
echo "  ${ADMIN_TOKEN}"
echo ""
echo "数据库密码:"
echo "  ${POSTGRES_PASSWORD}"
echo ""
log_warning "这些密钥只显示一次，建议复制到密码管理器"
echo ""

# 显示后续步骤
print_header "📋 下一步操作"

echo ""
echo "1️⃣  检查并编辑 .env.production（如有需要）"
echo "   nano .env.production"
echo ""
echo "2️⃣  配置 DNS 记录"
echo "   A    $DOMAIN          → 服务器IP"
echo "   A    admin.$DOMAIN    → 服务器IP"
echo ""
echo "3️⃣  （可选）获取 SSL 证书"
echo "   sudo certbot certonly --standalone -d $DOMAIN -d admin.$DOMAIN"
echo ""
echo "4️⃣  提交代码（不要提交 .env.production）"
echo "   git add ."
echo "   git commit -m 'chore: update production config'"
echo "   git push origin main"
echo ""
echo "5️⃣  在生产服务器克隆代码"
echo "   git clone <your-repo-url>"
echo "   cd cohe-capital-monorepo"
echo ""
echo "6️⃣  复制 .env.production 到服务器"
echo "   scp .env.production user@server:/path/to/project/"
echo ""
echo "7️⃣  执行部署"
echo "   ./deploy.sh --prod"
echo ""
echo "详细部署指南请参考："
echo "   📄 PRODUCTION_DEPLOY_CHECKLIST.md"
echo "   📄 docs/PRODUCTION_DEPLOYMENT.md"
echo ""

log_success "生产环境准备完成！ 🎉"
