# 🚀 快速开始：3 步部署到生产环境

## 📋 概览

本指南将帮助你在 **15 分钟内**完成生产环境部署。

**流程**：
```
本地准备 (5分钟) → 服务器配置 (5分钟) → 部署上线 (5分钟)
```

---

## 第一步：本地准备（5 分钟）

### 1.1 运行准备脚本

```bash
# 在项目根目录执行
./scripts/prepare-production.sh
```

**脚本会询问你两个问题**：

#### 问题 1：你的域名是什么？
```
请输入你的域名（例如：example.com）:
```

**你需要输入**：
- ✅ **如果有域名**：输入 `yourdomain.com`（不要加 `https://` 和 `www`）
- ⚠️ **如果暂时没域名**：直接按回车（使用占位符 `your-domain.com`）

**示例**：
```
请输入你的域名（例如：example.com）: cohe-capital.com
✓ 域名: cohe-capital.com
```

#### 问题 2：WalletConnect Project ID 是什么？
```
请输入 WalletConnect Project ID (从 https://cloud.reown.com/ 获取):
```

**你需要做**：
1. 访问 https://cloud.reown.com/
2. 注册/登录账号（免费）
3. 创建新项目
4. 复制 Project ID（类似 `e1d4344896342c6efb5aab6396d3ae24`）
5. 粘贴到终端

**示例**：
```
请输入 WalletConnect Project ID: e1d4344896342c6efb5aab6396d3ae24
✓ WalletConnect ID: e1d4344896342c6efb5aab6396d3ae24
```

---

### 1.2 脚本完成后会显示什么？

脚本运行完成后，你会看到：

```
🔑 重要信息（请妥善保管）

以下是自动生成的密钥，请保存到安全的地方：

Admin Token (管理员登录令牌):
  4f8a2b9c3d6e1f7a0b5c8d2e9f3a6b1c4d7e0f3a6b9c2d5e8f1a4b7c0d3e6f9a

数据库密码:
  Y0urStr0ngP@ssw0rd2024!

⚠️  这些密钥只显示一次，建议复制到密码管理器
```

**你需要做**：
1. ✅ **复制 Admin Token**（保存到安全的地方，如密码管理器）
2. ✅ **复制数据库密码**（可选，一般不需要直接使用）

---

### 1.3 检查生成的文件

脚本会自动生成两个文件：

#### 文件 1：`.env.production`（环境变量）

```bash
# 查看生成的文件
cat .env.production
```

**检查以下配置是否正确**：

| 配置项 | 应该是什么 | 如何检查 |
|--------|-----------|---------|
| `SIWE_DOMAIN` | 你的域名 | 应该是你输入的域名（如 `cohe-capital.com`） |
| `SIWE_URI` | `https://你的域名` | 应该是 `https://cohe-capital.com` |
| `CORS_ORIGIN` | 包含 Web 和 Admin 域名 | 应该是 `https://cohe-capital.com,https://admin.cohe-capital.com` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | 你的 Project ID | 应该是你输入的 WalletConnect ID |
| `ADMIN_TOKEN` | 随机生成的长字符串 | 应该是一长串字母数字 |

**如果需要修改**：
```bash
nano .env.production
# 修改后保存（Ctrl+X, Y, Enter）
```

#### 文件 2：`infra/nginx/nginx.prod.conf`（Nginx 配置）

```bash
# 检查域名是否正确替换
grep "server_name" infra/nginx/nginx.prod.conf
```

**期望输出**：
```
server_name cohe-capital.com www.cohe-capital.com;    # Web 域名
server_name admin.cohe-capital.com;                     # Admin 域名
```

**如果域名不对**（比如还是 `your-domain.com`）：
```bash
# 手动替换
sed -i 's/your-domain.com/cohe-capital.com/g' infra/nginx/nginx.prod.conf
```

---

### 1.4 提交代码到 Git

```bash
# 1. 确保 .env.production 不会被提交（非常重要！）
echo ".env.production" >> .gitignore

# 2. 查看修改的文件
git status

# 3. 提交代码（不包括 .env.production）
git add .
git commit -m "chore: ready for production deployment"
git push origin main
```

**⚠️ 重要**：`.env.production` 包含敏感密钥，**绝对不能提交到 Git**！

---

## 第二步：服务器配置（5 分钟）

### 2.1 准备服务器

**你需要一台服务器**（以下任选其一）：

- ✅ 云服务器（阿里云、腾讯云、AWS、DigitalOcean 等）
- ✅ VPS（Vultr、Linode、Hetzner 等）
- ✅ 自己的服务器

**最低配置**：
- CPU: 2 核
- 内存: 4GB
- 硬盘: 20GB
- 系统: Ubuntu 20.04+ / Debian 11+ / CentOS 8+

---

### 2.2 安装 Docker（首次需要）

SSH 登录到服务器后，执行：

```bash
# 一键安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
# 应输出：Docker version 24.x.x

docker compose version
# 应输出：Docker Compose version v2.x.x
```

---

### 2.3 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH（必须，否则会断开连接）
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 检查状态
sudo ufw status
```

**期望输出**：
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

### 2.4 配置 DNS（在域名服务商操作）

**如果你有域名**，在域名服务商（如 Cloudflare、阿里云、腾讯云）添加 A 记录：

| 类型 | 主机名 | 值（IP） | 说明 |
|------|--------|---------|------|
| A | @ | 123.45.67.89 | 主域名（cohe-capital.com） |
| A | www | 123.45.67.89 | www 子域名 |
| A | admin | 123.45.67.89 | Admin 后台子域名 |

**123.45.67.89** 替换为你的服务器公网 IP。

**验证 DNS 生效**（等待 5-10 分钟后）：
```bash
# 在本地电脑执行
nslookup cohe-capital.com
nslookup admin.cohe-capital.com
```

---

## 第三步：部署上线（5 分钟）

### 3.1 克隆代码到服务器

```bash
# 在服务器执行
git clone https://github.com/your-username/cohe-capital-monorepo.git
cd cohe-capital-monorepo
```

---

### 3.2 上传 .env.production

**方法 A：使用 SCP（推荐）**

在**本地电脑**执行：
```bash
# 上传环境变量文件
scp .env.production user@服务器IP:/path/to/cohe-capital-monorepo/

# 示例：
scp .env.production root@123.45.67.89:/root/cohe-capital-monorepo/
```

**方法 B：手动创建**

在**服务器**执行：
```bash
nano .env.production
# 粘贴本地 .env.production 的内容
# 保存（Ctrl+X, Y, Enter）
```

**验证文件存在**：
```bash
ls -la .env.production
# 应该看到文件
```

---

### 3.3 执行部署

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行生产部署（首次部署）
./deploy.sh --prod --build
```

**部署过程**（约 5-10 分钟）：
```
============================================
Starting Deployment: cohe-capital
============================================

[INFO] 🚀 Environment: PRODUCTION
[INFO] 📁 Using: docker-compose.yml + docker-compose.prod.yml

============================================
Checking Prerequisites
============================================w
[SUCCESS] Docker is installed
[SUCCESS] Docker Compose is available
...

============================================
Building Docker Images
============================================
[INFO] Building all service images...
[INFO] This may take several minutes on first run...
...

============================================
Deploying Services
============================================
[INFO] Starting all services in detached mode...
[SUCCESS] All services started successfully
...

🎉 Deployment completed successfully!
```

---

### 3.4 验证部署成功

#### 检查容器状态

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

**期望输出**：
```
NAME          STATUS                PORTS
cohe-db       Up (healthy)
cohe-api      Up (healthy)
cohe-web      Up (healthy)
cohe-admin    Up (healthy)
cohe-nginx    Up (healthy)          0.0.0.0:80->80/tcp
```

所有服务都应该是 **Up (healthy)** 状态。

---

#### 测试访问

**方法 A：使用 curl（在服务器）**

```bash
# 测试 Nginx 健康检查
curl http://localhost/health
# 应返回: healthy

# 测试 API 健康检查
curl http://localhost/api/healthz
# 应返回: "ok"
```

**方法 B：使用浏览器**

如果配置了域名：
- 访问 `http://cohe-capital.com`（Web 前端）
- 访问 `http://admin.cohe-capital.com`（Admin 后台）

如果没有域名，使用 IP：
- 访问 `http://123.45.67.89`（Web 前端）
- 访问 `http://123.45.67.89`（由于没有子域名，Admin 需要单独配置）

---

## 🎉 部署完成！

### 你现在可以做什么？

1. **测试 Web 前端**：
   - 访问你的网站
   - 连接钱包（MetaMask、WalletConnect 等）
   - 浏览保单产品

2. **登录 Admin 后台**：
   - 访问 `http://admin.cohe-capital.com`
   - 使用之前保存的 **Admin Token** 登录
   - 管理保单、查看数据

3. **查看 API 文档**：
   - 访问 `http://cohe-capital.com/api-docs`
   - 查看 Swagger API 文档

---

## 📝 后续步骤（可选）

### 配置 HTTPS（强烈推荐）

```bash
# 1. 安装 Certbot
sudo apt-get install certbot

# 2. 停止服务（临时）
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop nginx

# 3. 获取证书
sudo certbot certonly --standalone \
  -d cohe-capital.com \
  -d www.cohe-capital.com \
  -d admin.cohe-capital.com \
  --email your@email.com \
  --agree-tos

# 4. 复制证书
sudo mkdir -p infra/nginx/certs
sudo cp /etc/letsencrypt/live/cohe-capital.com/fullchain.pem infra/nginx/certs/
sudo cp /etc/letsencrypt/live/cohe-capital.com/privkey.pem infra/nginx/certs/
sudo chown -R $USER:$USER infra/nginx/certs/

# 5. 配置 Docker Compose
nano docker-compose.prod.yml
# 取消注释以下行：
# - "443:443"
# - ./infra/nginx/certs:/etc/nginx/certs:ro

# 6. 配置 Nginx
nano infra/nginx/nginx.prod.conf
# 取消注释 HTTPS server 块和 HTTP→HTTPS 重定向

# 7. 重启服务
./deploy.sh --prod
```

---

## ⚠️ 常见问题

### Q1: 脚本询问域名时，我还没有域名怎么办？

**回答**：直接按回车，使用占位符 `your-domain.com`。

**注意**：
- 你可以先用 IP 访问网站（如 `http://123.45.67.89`）
- Admin 后台需要单独配置（没有子域名）
- 以后有域名了，再修改配置重新部署

---

### Q2: 我忘记保存 Admin Token 了怎么办？

**解决方案**：
```bash
# 查看 .env.production 中的 ADMIN_TOKEN
grep ADMIN_TOKEN .env.production
```

---

### Q3: 部署后访问域名显示 502 错误

**可能原因**：
1. DNS 还未生效（等待 5-10 分钟）
2. 防火墙未开放端口
3. 服务未正常启动

**解决方案**：
```bash
# 检查服务状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 查看日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

---

### Q4: 钱包登录失败

**可能原因**：`SIWE_DOMAIN` 配置不正确

**解决方案**：
```bash
# 检查 .env.production
grep SIWE_DOMAIN .env.production

# 应该是你的实际域名（不带 https://）
# 如果不对，修改后重启 API
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart api
```

---

## 📚 更多文档

- **完整部署检查清单**：`PRODUCTION_DEPLOY_CHECKLIST.md`
- **详细部署指南**：`docs/PRODUCTION_DEPLOYMENT.md`
- **配置修复说明**：`docs/PRODUCTION_CONFIG_FIXES.md`

---

## 🎯 总结

你需要做的事情很简单：

1. ✅ **运行准备脚本**：`./scripts/prepare-production.sh`
2. ✅ **回答两个问题**：域名 + WalletConnect ID
3. ✅ **保存 Admin Token**（脚本会显示）
4. ✅ **提交代码**：`git push`
5. ✅ **服务器部署**：`./deploy.sh --prod --build`

**就这么简单！** 🚀
