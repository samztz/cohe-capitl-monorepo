● 🚀 本地测试与线上部署完整指导

  从本地验证到华为云 Flexus L 实例生产部署的完整流程

  ---
  📋 总体流程概览

  Phase 1: 本地测试 (1-2小时)
    ├─ 环境准备
    ├─ Docker 构建与启动
    ├─ 功能验证
    └─ 问题排查

  Phase 2: 准备生产配置 (30分钟)
    ├─ 域名与 DNS 配置
    ├─ SSL 证书获取
    ├─ 生产环境变量配置
    └─ 安全加固

  Phase 3: 华为云服务器部署 (1-2小时)
    ├─ 服务器环境准备
    ├─ 代码上传
    ├─ Docker 部署
    ├─ Nginx SSL 配置
    └─ 启动与验证

  Phase 4: 生产验证与监控 (持续)
    ├─ 功能测试
    ├─ 性能监控
    ├─ 日志管理
    └─ 备份策略

  ---
  🧪 Phase 1: 本地测试（详细步骤）

  Step 1.1: 环境准备检查

  # 1. 检查 Docker 环境
  docker --version
  # 预期: Docker version 20.10+

  docker compose version
  # 预期: Docker Compose version v2.0+

  # 2. 检查磁盘空间（至少 10GB）
  df -h
  # 预期: / 或 /home 有 10GB+ 可用

  # 3. 检查端口占用
  lsof -i :80
  lsof -i :3000
  lsof -i :3001
  lsof -i :3002
  # 预期: 无输出（端口未被占用）

  # 如果有占用，停止占用进程或修改 .env 中的端口

  Step 1.2: 获取 WalletConnect Project ID

  必须完成，否则钱包连接功能无法使用

  1. 访问: https://cloud.reown.com/
  2. 注册/登录账号（免费）
  3. 点击 "Create New Project"
  4. 填写项目信息:
     - Project Name: Cohe Capital Local Test
     - Homepage URL: http://localhost
  5. 复制 Project ID（格式类似: a1b2c3d4e5f6g7h8i9j0...）
  6. 保存备用

  Step 1.3: 运行一键部署脚本

  # 方式 1: 使用一键部署脚本（推荐）
  ./scripts/local-docker-test.sh

  # 脚本会自动：
  # - 检查 Docker 环境
  # - 创建 .env 配置
  # - 提示输入 WalletConnect Project ID
  # - 创建数据目录
  # - 构建镜像（需要 5-10 分钟）
  # - 启动服务
  # - 运行数据库迁移
  # - 执行自动化测试
  # - 显示访问地址

  如果脚本执行成功，跳到 Step 1.5

  ---
  Step 1.4: 手动部署（如脚本失败）

  # 1. 配置环境变量
  cp .env.local.example .env
  vim .env

  # 必须修改的变量：
  # NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=粘贴你的Project_ID

  # 可选修改（使用默认值即可）：
  # ADMIN_TOKEN=demo-admin-token-12345
  # JWT_SECRET=local-dev-jwt-secret-change-in-production

  # 2. 创建数据目录
  mkdir -p docker-volumes/db-data
  mkdir -p docker-volumes/uploads/signatures

  # 3. 验证配置
  docker compose config
  # 无错误输出即为正常

  # 4. 构建镜像（需要 5-10 分钟，请耐心等待）
  docker compose build

  # 观察输出，确保没有 ERROR
  # 正常情况下会看到：
  # [+] Building 120.5s (XX/XX) FINISHED

  # 5. 启动服务
  docker compose up -d

  # 6. 查看服务状态
  docker compose ps

  # 预期输出（等待 30-60 秒，直到所有服务显示 "healthy"）：
  # NAME         IMAGE                          STATUS
  # cohe-db      postgres:16-alpine             Up (healthy)
  # cohe-api     cohe-capitl-monorepo-api       Up (healthy)
  # cohe-web     cohe-capitl-monorepo-web       Up (healthy)
  # cohe-admin   cohe-capitl-monorepo-admin     Up (healthy)
  # cohe-nginx   nginx:alpine                   Up (healthy)

  # 如果某个服务状态为 "Exited" 或 "Unhealthy"：
  docker compose logs [service_name]  # 查看日志

  # 7. 运行数据库迁移
  ./deploy.sh --migrate

  # 预期输出：
  # Applying migration `20240101000000_init`
  # The following migration(s) have been applied:
  # ...

  # 8. 运行自动化测试
  ./scripts/tests/docker-verify.sh

  # 预期输出：
  # ✓ 所有测试通过！(12 passed, 0 failed)

  ---
  Step 1.5: 浏览器功能测试

  Test 1: Web 前端测试

  1. 打开浏览器访问: http://localhost/

  2. 预期看到 Cohe Capital 主页

  3. 测试钱包连接：
     - 点击 "Connect Wallet" 按钮
     - 应弹出 WalletConnect 模态框
     - 可以看到钱包选项（MetaMask, WalletConnect, Coinbase Wallet 等）

  4. 打开浏览器开发者工具 (F12):
     - Network 标签：刷新页面，检查 API 请求路径
     - Console 标签：应无红色错误

  5. 验证 API 请求路径：
     - 所有 API 请求应该是 /api/* (例如 /api/sku)
     - 不应该看到 localhost:3001 的请求

  Test 2: Admin 后台测试

  1. 访问: http://localhost/admin

  2. 预期看到登录页面

  3. 输入 Admin Token (从 .env 文件获取):
     cat .env | grep ADMIN_TOKEN
     # 默认: demo-admin-token-12345

  4. 登录后应跳转到 Dashboard

  5. 测试 API 请求：
     - F12 开发者工具 → Network 标签
     - 所有请求应该是 /api/admin/* 路径

  Test 3: API 文档测试

  1. 访问: http://localhost/api-docs

  2. 预期看到 Swagger UI

  3. 测试 API 调用：
     - 展开 "Auth" 分类
     - 找到 POST /api/auth/siwe/nonce
     - 点击 "Try it out"
     - 输入测试数据:
       {
         "walletAddress": "0x1234567890123456789012345678901234567890"
       }
     - 点击 "Execute"
     - 预期返回 200 OK + nonce 字符串

  4. 测试健康检查：
     - 展开 "GET /api/healthz"（如果看不到，直接访问
  http://localhost/api/healthz）
     - 应返回 "OK"

  ---
  Step 1.6: 命令行验证测试

  # Test 1: API 健康检查
  curl http://localhost/api/healthz
  # 预期: OK

  # Test 2: Nginx 健康检查
  curl http://localhost/health
  # 预期: healthy

  # Test 3: 数据库连接
  docker compose exec api node -e "const { PrismaClient } =
  require('./generated/prisma'); const p = new PrismaClient();
  p.\$connect().then(() =>
  console.log('DB_CONNECTED')).catch(console.error)"
  # 预期: DB_CONNECTED

  # Test 4: 上传目录持久化
  docker compose exec api sh -c "echo test-content >
  /app/apps/api/uploads/test.txt && cat /app/apps/api/uploads/test.txt"
  # 预期: test-content

  cat docker-volumes/uploads/test.txt
  # 预期: test-content（文件持久化到宿主机）

  # Test 5: 产品列表 API
  curl http://localhost/api/sku
  # 预期: [] 或产品列表 JSON

  # Test 6: 查看所有服务日志
  docker compose logs --tail=50

  # Test 7: 查看资源占用
  docker stats --no-stream

  ---
  Step 1.7: 本地测试问题排查

  问题 1: 服务启动失败

  # 症状: docker compose ps 显示 "Exited"

  # 排查步骤:
  # 1. 查看日志
  docker compose logs api
  docker compose logs web
  docker compose logs admin

  # 2. 常见错误及解决方案:

  # 错误: "Cannot find module './generated/prisma'"
  # 原因: Prisma Client 未正确打包
  # 解决:
  docker compose build api --no-cache
  docker compose up -d api

  # 错误: "EADDRINUSE: address already in use"
  # 原因: 端口被占用
  # 解决:
  lsof -i :3001  # 找到占用进程
  kill -9 <PID>  # 停止进程
  # 或修改 .env 中的端口

  # 错误: "Connection refused" (API 连接数据库)
  # 原因: 数据库未启动完成
  # 解决:
  docker compose restart api  # 等待 db 健康检查通过后重启 API

  问题 2: WalletConnect 不工作

  # 症状: 浏览器控制台显示 "Invalid project id"

  # 排查步骤:
  # 1. 检查环境变量
  docker compose exec web env | grep WALLETCONNECT
  # 预期: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

  # 2. 如果为空或错误
  vim .env
  # 修改: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=正确的Project_ID

  # 3. 重新构建 Web 服务
  docker compose build web
  docker compose up -d web

  # 4. 清除浏览器缓存并刷新

  问题 3: API 请求 404

  # 症状: 浏览器访问 /api/sku 返回 404

  # 排查步骤:
  # 1. 检查 API 是否运行
  curl http://localhost/api/healthz
  # 如果返回 404，API 可能未启动

  # 2. 检查 API 全局前缀
  docker compose exec api sh -c "wget -q -O-
  http://localhost:3001/api/healthz"
  # 如果返回 OK，说明 API 正常，但 Nginx 配置有问题

  # 3. 检查 Nginx 配置
  docker compose exec nginx cat /etc/nginx/nginx.conf | grep -A 5 "location
  /api"

  # 4. 重启服务
  docker compose restart nginx
  docker compose restart api

  ---
  Step 1.8: 本地测试完成标志

  所有以下项目都通过，表示本地测试成功：

  - ✅ docker compose ps 所有服务显示 "Up (healthy)"
  - ✅ ./scripts/tests/docker-verify.sh 全部测试通过
  - ✅ Web 前端可以访问，WalletConnect 能弹出
  - ✅ Admin 后台可以登录
  - ✅ Swagger 文档可以访问并测试 API
  - ✅ 上传文件能持久化到 docker-volumes/uploads/
  - ✅ 浏览器控制台无红色错误

  如果本地测试全部通过，可以进入 Phase 2

  ---
  🌐 Phase 2: 准备生产配置

  Step 2.1: 域名与 DNS 配置

  假设你的域名是: example.com

  需要配置以下 DNS 记录（在域名提供商控制台）:

  1. A 记录:
     - 主机记录: @
     - 记录类型: A
     - 记录值: <华为云服务器公网IP>
     - TTL: 600

     结果: example.com → 服务器 IP

  2. A 记录:
     - 主机记录: www
     - 记录类型: A
     - 记录值: <华为云服务器公网IP>
     - TTL: 600

     结果: www.example.com → 服务器 IP

  3. CNAME 记录（可选，用于 Admin）:
     - 主机记录: admin
     - 记录类型: CNAME
     - 记录值: example.com
     - TTL: 600

     结果: admin.example.com → example.com → 服务器 IP

  4. 验证 DNS 生效:
     ping example.com
     # 应返回你的服务器 IP

  Step 2.2: 生成生产环境变量

  # 在本地准备生产 .env 文件

  # 1. 复制生产模板
  cp .env.production.example .env.production

  # 2. 生成强随机密钥
  JWT_SECRET=$(openssl rand -base64 32)
  JWT_REFRESH_SECRET=$(openssl rand -base64 32)
  ADMIN_TOKEN=$(openssl rand -hex 32)
  POSTGRES_PASSWORD=$(openssl rand -base64 16)

  # 3. 编辑生产配置
  vim .env.production

  # 必须修改的变量：
  POSTGRES_USER=cohe_prod_user
  POSTGRES_PASSWORD=<粘贴上面生成的密码>
  POSTGRES_DB=cohe_capital_prod

  JWT_SECRET=<粘贴上面生成的>
  JWT_REFRESH_SECRET=<粘贴上面生成的>

  SIWE_DOMAIN=example.com
  SIWE_URI=https://example.com

  ADMIN_TOKEN=<粘贴上面生成的>

  CORS_ORIGIN=https://example.com,https://www.example.com,https://admin.exam
  ple.com

  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<你的 WalletConnect Project ID>

  NEXT_PUBLIC_CHAIN_ID=56  # BSC Mainnet，如果是测试网用 97
  NEXT_PUBLIC_CHAIN_NAME=BSC Mainnet

  # 4. 保存密钥到安全位置
  echo "JWT_SECRET=$JWT_SECRET" >> ~/cohe-secrets.txt
  echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" >> ~/cohe-secrets.txt
  echo "ADMIN_TOKEN=$ADMIN_TOKEN" >> ~/cohe-secrets.txt
  echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> ~/cohe-secrets.txt

  chmod 600 ~/cohe-secrets.txt
  # 备份这个文件！

  Step 2.3: 准备 SSL 证书（Let's Encrypt）

  两种方案：

  方案 A: 在本地生成证书（推荐）

  # 需要安装 certbot
  # Ubuntu/Debian:
  sudo apt update
  sudo apt install certbot

  # macOS:
  brew install certbot

  # 生成证书（Standalone 模式，需要暂时占用 80 端口）
  sudo certbot certonly --standalone -d example.com -d www.example.com

  # 证书会生成在：
  # /etc/letsencrypt/live/example.com/fullchain.pem
  # /etc/letsencrypt/live/example.com/privkey.pem

  # 复制到项目目录
  sudo cp /etc/letsencrypt/live/example.com/fullchain.pem infra/nginx/certs/
  sudo cp /etc/letsencrypt/live/example.com/privkey.pem infra/nginx/certs/
  sudo chmod 644 infra/nginx/certs/*

  方案 B: 在服务器上生成证书

  稍后在 Phase 3 服务器部署时再操作

  Step 2.4: 修改生产 Docker Compose 配置

  # 1. 注释 API 端口映射（生产安全）
  vim docker-compose.yml

  # 找到第 119-122 行，注释掉：
  # ports:
  #   # Expose API port (optional if using nginx as reverse proxy)
  #   # Comment out if nginx handles all external traffic
  #   - "${API_PORT:-3001}:${API_PORT:-3001}"

  # 2. 确认数据库端口已注释（默认已注释）
  # 第 48-49 行应该是注释状态

  # 3. 启用 HTTPS 端口（如果你已有证书）
  # 找到第 239 行，取消注释：
  - "${NGINX_HTTPS_PORT:-443}:443"

  Step 2.5: 配置 Nginx SSL

  # 编辑 Nginx 配置
  vim infra/nginx/nginx.conf

  # 找到 HTTPS server 块（约 190 行），取消注释并配置：

  server {
      listen 443 ssl http2;
      listen [::]:443 ssl http2;
      server_name example.com www.example.com;

      # SSL 证书路径
      ssl_certificate /etc/nginx/certs/fullchain.pem;
      ssl_certificate_key /etc/nginx/certs/privkey.pem;

      # SSL 配置（已有，确认启用）
      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers
  'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256...';
      ssl_prefer_server_ciphers off;

      # 其他配置与 HTTP 块相同...
  }

  # 添加 HTTP → HTTPS 重定向（约 80 行）
  server {
      listen 80;
      listen [::]:80;
      server_name example.com www.example.com;

      # 重定向到 HTTPS
      return 301 https://$server_name$request_uri;
  }

  ---
  🖥️ Phase 3: 华为云服务器部署

  Step 3.1: 服务器环境准备

  连接到华为云 Flexus L 实例

  # 使用 SSH 连接（替换为你的服务器 IP 和用户名）
  ssh root@<服务器公网IP>

  # 或使用密钥登录
  ssh -i ~/your-key.pem ubuntu@<服务器公网IP>

  安装 Docker

  # 更新系统
  sudo apt update && sudo apt upgrade -y

  # 安装 Docker
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh

  # 启动 Docker
  sudo systemctl start docker
  sudo systemctl enable docker

  # 验证安装
  docker --version
  # 预期: Docker version 20.10+

  # 安装 Docker Compose
  sudo apt install docker-compose-plugin -y

  # 验证安装
  docker compose version
  # 预期: Docker Compose version v2.0+

  # 将当前用户加入 docker 组（避免每次 sudo）
  sudo usermod -aG docker $USER
  newgrp docker

  安装其他必需工具

  # 安装 Git
  sudo apt install git -y

  # 安装 certbot（如果选择方案 B）
  sudo apt install certbot -y

  # 安装 UFW 防火墙
  sudo apt install ufw -y

  配置防火墙

  # 允许 SSH（重要！否则会断开连接）
  sudo ufw allow 22/tcp

  # 允许 HTTP 和 HTTPS
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp

  # 启用防火墙
  sudo ufw enable

  # 查看状态
  sudo ufw status
  # 预期: 22, 80, 443 端口已开放

  配置华为云安全组

  登录华为云控制台:
  1. 进入 ECS 控制台 → 找到你的实例
  2. 点击 "安全组" 标签
  3. 添加入方向规则:
     - 端口 22 (SSH)
     - 端口 80 (HTTP)
     - 端口 443 (HTTPS)
     - 来源: 0.0.0.0/0（或限制为你的 IP）

  ---
  Step 3.2: 上传代码到服务器

  方案 A: 使用 Git（推荐）

  # 在服务器上
  cd ~
  git clone <你的 Git 仓库 URL>
  cd cohe-capitl-monorepo

  # 如果是私有仓库，需要配置 SSH 密钥或 Personal Access Token

  方案 B: 使用 SCP/SFTP

  # 在本地
  # 打包代码（排除 node_modules 和 Docker 卷）
  tar -czf cohe-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=docker-volumes \
    --exclude=.git \
    --exclude=.next \
    .

  # 上传到服务器
  scp cohe-deploy.tar.gz root@<服务器IP>:~/

  # 在服务器上
  cd ~
  tar -xzf cohe-deploy.tar.gz
  mv <解压目录> cohe-capitl-monorepo
  cd cohe-capitl-monorepo

  ---
  Step 3.3: 配置生产环境

  # 在服务器上
  cd ~/cohe-capitl-monorepo

  # 1. 创建生产 .env 文件
  vim .env

  # 粘贴你在 Phase 2 准备的生产配置
  # 或从本地上传:
  # scp .env.production root@<服务器IP>:~/cohe-capitl-monorepo/.env

  # 2. 创建数据目录
  mkdir -p docker-volumes/db-data
  mkdir -p docker-volumes/uploads/signatures

  # 3. 如果你在本地生成了 SSL 证书
  mkdir -p infra/nginx/certs

  # 从本地上传证书:
  # scp infra/nginx/certs/*
  root@<服务器IP>:~/cohe-capitl-monorepo/infra/nginx/certs/

  如果选择在服务器上生成 SSL 证书

  # 临时停止 Nginx（如果正在运行）
  docker compose down nginx

  # 使用 certbot 生成证书
  sudo certbot certonly --standalone \
    -d example.com \
    -d www.example.com \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive

  # 复制证书到项目目录
  sudo cp /etc/letsencrypt/live/example.com/fullchain.pem infra/nginx/certs/
  sudo cp /etc/letsencrypt/live/example.com/privkey.pem infra/nginx/certs/
  sudo chown $USER:$USER infra/nginx/certs/*

  # 设置证书自动续期
  sudo crontab -e
  # 添加：
  0 0 * * * certbot renew --quiet

  ---
  Step 3.4: 部署服务

  # 在服务器上
  cd ~/cohe-capitl-monorepo

  # 1. 验证配置
  docker compose config

  # 2. 构建镜像（第一次需要 10-20 分钟）
  docker compose build

  # 3. 启动服务
  docker compose up -d

  # 4. 查看服务状态（等待所有服务 healthy）
  watch -n 5 docker compose ps
  # Ctrl+C 退出

  # 5. 运行数据库迁移
  ./deploy.sh --migrate

  # 6. 验证部署
  docker compose ps
  # 预期: 所有服务 "Up (healthy)"

  ---
  Step 3.5: 验证生产部署

  # 在服务器上

  # Test 1: 本地健康检查
  curl http://localhost/api/healthz
  # 预期: OK

  # Test 2: 公网访问测试（从本地电脑访问）
  # 在本地电脑浏览器访问:
  https://example.com/
  https://example.com/admin
  https://example.com/api-docs
  https://example.com/api/healthz

  # Test 3: SSL 证书验证
  curl -I https://example.com
  # 应看到 HTTP/2 200 和有效的 SSL 证书

  # Test 4: 查看日志
  docker compose logs --tail=100

  # Test 5: 数据库连接
  docker compose exec api node -e "const { PrismaClient } =
  require('./generated/prisma'); const p = new PrismaClient();
  p.\$connect().then(() => console.log('PROD_DB_OK'))"
  # 预期: PROD_DB_OK

  ---
  📊 Phase 4: 生产监控与维护

  Step 4.1: 日志管理

  # 查看实时日志
  docker compose logs -f

  # 查看特定服务日志
  docker compose logs -f api
  docker compose logs -f nginx

  # 查看最近 100 行日志
  docker compose logs --tail=100 api

  # 保存日志到文件
  docker compose logs > ~/logs/cohe-$(date +%Y%m%d).log

  # 设置日志轮转（避免占满磁盘）
  # 编辑 /etc/docker/daemon.json
  sudo vim /etc/docker/daemon.json

  # 添加：
  {
    "log-driver": "json-file",
    "log-opts": {
      "max-size": "10m",
      "max-file": "3"
    }
  }

  # 重启 Docker
  sudo systemctl restart docker

  Step 4.2: 备份策略

  # 1. 数据库备份脚本
  cat > ~/backup-db.sh << 'EOF'
  #!/bin/bash
  DATE=$(date +%Y%m%d_%H%M%S)
  BACKUP_DIR=~/backups/database
  mkdir -p $BACKUP_DIR

  docker compose exec -T db pg_dump -U cohe_prod_user cohe_capital_prod >
  $BACKUP_DIR/backup_$DATE.sql
  gzip $BACKUP_DIR/backup_$DATE.sql

  # 保留最近 7 天的备份
  find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

  echo "Database backup completed: $BACKUP_DIR/backup_$DATE.sql.gz"
  EOF

  chmod +x ~/backup-db.sh

  # 2. 上传文件备份
  cat > ~/backup-uploads.sh << 'EOF'
  #!/bin/bash
  DATE=$(date +%Y%m%d_%H%M%S)
  BACKUP_DIR=~/backups/uploads
  mkdir -p $BACKUP_DIR

  cd ~/cohe-capitl-monorepo
  tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz docker-volumes/uploads/

  # 保留最近 7 天的备份
  find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

  echo "Uploads backup completed: $BACKUP_DIR/uploads_$DATE.tar.gz"
  EOF

  chmod +x ~/backup-uploads.sh

  # 3. 设置定时备份（每天凌晨 2 点）
  crontab -e
  # 添加：
  0 2 * * * ~/backup-db.sh
  30 2 * * * ~/backup-uploads.sh

  Step 4.3: 监控服务状态

  # 1. 创建健康检查脚本
  cat > ~/health-check.sh << 'EOF'
  #!/bin/bash

  echo "=== Service Status ==="
  docker compose ps

  echo -e "\n=== Disk Usage ==="
  df -h

  echo -e "\n=== Memory Usage ==="
  free -h

  echo -e "\n=== Docker Stats ==="
  docker stats --no-stream

  echo -e "\n=== API Health ==="
  curl -s http://localhost/api/healthz

  echo -e "\n=== Database Connection ==="
  docker compose exec -T api node -e "const { PrismaClient } =
  require('./generated/prisma'); const p = new PrismaClient();
  p.\$connect().then(() => console.log('DB_OK')).catch(() =>
  console.log('DB_FAIL'))"
  EOF

  chmod +x ~/health-check.sh

  # 2. 定期运行（每小时检查）
  crontab -e
  # 添加：
  0 * * * * ~/health-check.sh >> ~/logs/health-check.log 2>&1

  Step 4.4: 性能监控（可选 - Prometheus + Grafana）

  # 这是高级功能，可以稍后配置
  # 需要额外的 docker-compose 配置和安装

  # 基础监控（免费）
  # 1. 使用 Docker stats
  docker stats

  # 2. 使用 ctop（美化版 docker stats）
  sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7
  .7-linux-amd64 -O /usr/local/bin/ctop
  sudo chmod +x /usr/local/bin/ctop
  ctop

  ---
  🚨 常见生产问题排查

  问题 1: 服务无法启动

  # 1. 查看详细日志
  docker compose logs

  # 2. 检查磁盘空间
  df -h
  # 如果 / 或 /var 满了，清理 Docker 缓存：
  docker system prune -a

  # 3. 检查内存
  free -h
  # Flexus L 实例可能内存有限，考虑优化或升级

  # 4. 重新构建
  docker compose down
  docker compose build --no-cache
  docker compose up -d

  问题 2: SSL 证书错误

  # 1. 检查证书文件
  ls -la infra/nginx/certs/
  # 应该有 fullchain.pem 和 privkey.pem

  # 2. 检查证书有效期
  openssl x509 -in infra/nginx/certs/fullchain.pem -noout -dates

  # 3. 重新生成证书
  sudo certbot renew --force-renewal
  sudo cp /etc/letsencrypt/live/example.com/* infra/nginx/certs/
  docker compose restart nginx

  问题 3: API 请求 502 Bad Gateway

  # 1. 检查 API 是否运行
  docker compose ps api
  # 应该是 "Up (healthy)"

  # 2. 检查 API 日志
  docker compose logs api --tail=50

  # 3. 测试 API 内部访问
  docker compose exec nginx curl http://api:3001/api/healthz
  # 应返回 OK

  # 4. 重启服务
  docker compose restart api nginx

  ---
  📋 完整部署检查清单

  本地测试阶段

  - Docker 环境准备完成
  - 获取 WalletConnect Project ID
  - 运行 ./scripts/local-docker-test.sh 成功
  - 所有自动化测试通过
  - Web 前端可访问，WalletConnect 能弹出
  - Admin 后台可登录
  - Swagger 文档可测试 API
  - 上传文件能持久化

  生产准备阶段

  - 域名 DNS 配置完成
  - 生成强随机密钥（JWT、Admin Token、数据库密码）
  - 配置生产 .env 文件
  - 获取 SSL 证书
  - 修改 docker-compose.yml（注释 API 端口）
  - 配置 Nginx SSL

  服务器部署阶段

  - 服务器 Docker 环境准备
  - 配置防火墙和安全组
  - 上传代码到服务器
  - 配置生产环境变量
  - 上传 SSL 证书
  - 构建并启动服务
  - 运行数据库迁移
  - 验证公网访问

  监控与维护

  - 配置日志管理
  - 设置数据库备份
  - 设置文件备份
  - 配置健康检查
  - （可选）配置性能监控

  ---
  🎯 关键提醒

  安全提醒

  1. ⚠️ 绝对不要 将生产 .env 文件提交到 Git
  2. ⚠️ 必须 修改所有默认密码和密钥
  3. ⚠️ 必须 配置 CORS 白名单（不能用 *）
  4. ⚠️ 必须 启用 HTTPS（Let's Encrypt 免费）
  5. ⚠️ 建议 定期备份数据库和上传文件

  性能提醒

  1. 华为云 Flexus L 实例通常是入门级配置（1-2 核 2-4GB 内存）
  2. 如果流量大，考虑升级到更高配置
  3. 考虑使用云存储（华为云 OBS）替代本地上传目录
  4. 监控磁盘使用，定期清理 Docker 缓存

  备份提醒

  1. 数据库备份是最重要的
  2. 备份文件应定期下载到本地或云存储
  3. 测试恢复流程，确保备份有效

  ---
  📞 需要帮助时

  遇到问题时的排查顺序：

  1. 查看日志: docker compose logs [service]
  2. 检查文档: docs/DOCKER_TESTING_GUIDE.md
  3. 常见问题: docs/DOCKER_PRODUCTION_HARDENING.md
  4. 健康检查: ./scripts/tests/docker-verify.sh
  5. 重启服务: docker compose restart [service]
