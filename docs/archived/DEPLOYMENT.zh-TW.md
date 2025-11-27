# 🚀 部署指南 - Cohe Capital 保險平台

> **生產環境 Docker 部署指南及安全最佳實踐**

---

## 📋 目錄

1. [先決條件](#先決條件)
2. [快速開始](#快速開始)
3. [詳細設定](#詳細設定)
4. [安全加固](#安全加固)
5. [運維指南](#運維指南)
6. [故障排除](#故障排除)
7. [監控與維護](#監控與維護)

---

## 先決條件

### 伺服器要求

**最低規格：**
- **作業系統**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / RHEL 8+
- **CPU**: 2 核心（生產環境建議 4+ 核心）
- **記憶體**: 4GB（生產環境建議 8GB+）
- **儲存**: 20GB SSD（生產環境建議 50GB+，含日誌）
- **網路**: 具有公共 IP 位址，開放 80、443 端口

**軟體依賴：**
- Docker Engine 24.0+
- Docker Compose 2.0+
- Git 2.0+
- （可選）Nginx 或其他反向代理（如不使用容器化 nginx）

### 安裝指令

```bash
# 更新系統套件
sudo apt update && sudo apt upgrade -y

# 安裝 Docker（Ubuntu/Debian）
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 將當前使用者加入 docker 群組（避免使用 sudo）
sudo usermod -aG docker $USER
newgrp docker

# 安裝 Docker Compose（如未包含）
sudo apt install docker-compose-plugin -y

# 驗證安裝
docker --version
docker compose version
```

---

## 快速開始

### 1. 複製儲存庫

```bash
# 複製專案
git clone https://github.com/your-org/cohe-capitl-monorepo.git
cd cohe-capitl-monorepo
```

### 2. 設定環境

```bash
# 複製環境範本
cp .env.production.example .env

# 編輯設定（詳見下方詳細設定）
nano .env
```

**⚠️ 重要：變更所有預設值！**

### 3. 部署

```bash
# 賦予部署腳本執行權限
chmod +x deploy.sh

# 執行部署
./deploy.sh
```

**預期輸出：**
```
============================================
開始部署：cohe-capital
============================================
[INFO] 正在建置 Docker 映像檔...
[SUCCESS] Docker 映像檔建置成功
[INFO] 正在啟動所有服務...
[SUCCESS] 所有服務啟動成功
[SUCCESS] 部署完成！🚀
```

### 4. 驗證部署

```bash
# 檢查服務狀態
docker compose ps

# 存取服務
# Web 前端：     http://YOUR_SERVER_IP/
# Admin 後台：   http://YOUR_SERVER_IP/admin
# API 服務：     http://YOUR_SERVER_IP/api
# API 文件：     http://YOUR_SERVER_IP/api-docs
```

---

## 詳細設定

### 步驟 1：環境變數設定

編輯 `.env` 檔案並設定以下關鍵部分：

#### 1.1 資料庫憑證

```bash
# 生成強密碼
POSTGRES_PASSWORD=$(openssl rand -base64 32)

POSTGRES_USER=cohe_user
POSTGRES_PASSWORD=<生成的密碼>
POSTGRES_DB=cohe_capital
```

#### 1.2 JWT 密鑰

```bash
# 生成安全隨機密鑰
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

JWT_SECRET=<生成的密鑰>
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=<生成的重整密鑰>
JWT_REFRESH_EXPIRATION=7d
```

#### 1.3 SIWE 設定

```bash
SIWE_DOMAIN=your-domain.com
SIWE_URI=https://your-domain.com
```

#### 1.4 管理員令牌

```bash
# 生成管理員令牌
ADMIN_TOKEN=$(openssl rand -hex 32)

ADMIN_TOKEN=<生成的管理員令牌>
```

#### 1.5 區塊鏈設定

```bash
# 從 https://cloud.reown.com/ 獲取專案 ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# 網路設定
NEXT_PUBLIC_CHAIN_ID=56          # BSC 主網（測試網為 97）
NEXT_PUBLIC_CHAIN_NAME=BSC Mainnet
```

#### 1.6 API URLs

```bash
# Nginx 反向代理設定
NEXT_PUBLIC_API_BASE=/api

# 生產環境使用網域
# NEXT_PUBLIC_API_BASE=https://your-domain.com/api
```

### 步驟 2：SSL/TLS 設定（生產環境）

#### 方案 A：Let's Encrypt（大多數情況推薦）

```bash
# 安裝 certbot
sudo apt install certbot -y

# 獲取憑證（需停止 nginx）
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 憑證將位於：
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

然後更新 `docker-compose.yml`：

```yaml
nginx:
  volumes:
    - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/nginx/certs:ro  # 新增此行
```

並在 `infra/nginx/nginx.conf` 中取消 HTTPS 區塊的註解。

#### 方案 B：雲端供應商 SSL

如使用 AWS/GCP/Azure 負載平衡器，在負載平衡器層級設定 SSL 終止。

### 步驟 3：防火牆設定

```bash
# 允許 SSH（重要 - 避免鎖住自己！）
sudo ufw allow 22/tcp

# 允許 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 啟用防火牆
sudo ufw enable

# 檢查狀態
sudo ufw status
```

### 步驟 4：資料庫遷移

遷移會在部署期間自動執行。手動執行：

```bash
# 執行遷移
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"

# 驗證資料庫架構
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma db pull"
```

---

## 安全加固

### 🔒 關鍵安全檢查清單

#### 生產環境部署前：

- [ ] **變更所有預設密碼**（`.env` 中）
- [ ] **生成安全的 JWT 密鑰**（32+ 字元，隨機）
- [ ] **設定 CORS_ORIGIN** 為特定網域，而非 `*`
- [ ] **停用資料庫端口暴露**（在 `docker-compose.yml` 中註解 `DB_PORT` 映射）
- [ ] **設定 SSL/TLS 憑證**（生產環境僅使用 HTTPS）
- [ ] **啟用防火牆**（ufw/iptables）
- [ ] **限制 SSH 存取**（僅金鑰，停用密碼認證）
- [ ] **設定日誌輪替**（防止磁碟空間問題）
- [ ] **設定備份策略**（每日資料庫備份）
- [ ] **檢視 nginx 速率限制**（防止 DDoS）
- [ ] **啟用 HSTS**（確認 HTTPS 正常運作後）
- [ ] **設定安全檔案權限**（`.env` 應為 600）

### 1. 保護環境檔案

```bash
# 設定 .env 的限制性權限
chmod 600 .env

# 確保在 .gitignore 中（已完成）
grep -q '^.env$' .gitignore || echo '.env' >> .gitignore

# 永不將 .env 提交到 Git
git update-index --assume-unchanged .env
```

### 2. 停用資料庫外部存取（生產環境）

編輯 `docker-compose.yml`：

```yaml
db:
  # 在生產環境中註解或移除
  # ports:
  #   - "${DB_PORT:-5432}:5432"
```

資料庫將僅可透過 Docker 內部網路存取。

### 3. CORS 設定

在 `.env` 中：

```bash
# 開發環境
CORS_ORIGIN=*

# 生產環境 - 指定確切網域
CORS_ORIGIN=https://your-domain.com,https://admin.your-domain.com
```

### 4. 速率限制

檢視 `infra/nginx/nginx.conf`：

```nginx
# 根據預期流量調整
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;
```

### 5. 非 root 使用者驗證

所有容器以非 root 使用者執行。驗證：

```bash
# 檢查 API 容器使用者
docker compose exec api whoami
# 預期輸出：nestjs

# 檢查 Web 容器使用者
docker compose exec web whoami
# 預期輸出：nextjs
```

### 6. 檔案儲存安全

**⚠️ 目前設定使用本機檔案儲存上傳內容（簽名）。**

**生產環境建議：**
- 替換為雲端儲存（AWS S3、Cloudflare R2、阿里雲 OSS）
- 使用簽名 URL 進行下載
- 實作存取控制（AdminGuard 用於簽名檢視）
- 對上傳內容啟用病毒掃描

S3 整合範例（未來）：

```typescript
// apps/api/src/modules/policy/signature-storage.service.ts
async saveSignature(base64: string, policyId: string): Promise<SignatureMetadata> {
  // 上傳到 S3 而非本機檔案系統
  const s3 = new S3Client({ region: process.env.AWS_REGION });
  const key = `signatures/${policyId}-${Date.now()}.png`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
  }));

  return { url: `https://cdn.your-domain.com/${key}`, hash };
}
```

### 7. 日誌管理

**防止磁碟空間問題：**

```bash
# 設定 Docker 日誌輪替
sudo nano /etc/docker/daemon.json
```

新增：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

重啟 Docker：

```bash
sudo systemctl restart docker
```

### 8. 備份策略

**資料庫備份：**

建立備份腳本 `scripts/backup-db.sh`：

```bash
#!/bin/bash
# 每日資料庫備份

BACKUP_DIR="/var/backups/cohe-capital/db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose exec -T db pg_dump -U cohe_user -d cohe_capital | gzip > "$BACKUP_FILE"

# 僅保留最近 7 天的備份
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "備份完成：$BACKUP_FILE"
```

設定 cron 工作：

```bash
# 編輯 crontab
crontab -e

# 新增每日凌晨 2 點的備份
0 2 * * * /path/to/cohe-capitl-monorepo/scripts/backup-db.sh
```

---

## 運維指南

### 常見操作

#### 檢視日誌

```bash
# 所有服務
docker compose logs -f

# 特定服務
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db

# 最後 100 行
docker compose logs --tail=100 api
```

#### 重啟服務

```bash
# 重啟所有服務
docker compose restart

# 重啟特定服務
docker compose restart api
docker compose restart web
```

#### 停止/啟動服務

```bash
# 停止所有服務
docker compose down

# 啟動所有服務
docker compose up -d

# 停止但不移除容器
docker compose stop

# 啟動已停止的容器
docker compose start
```

#### 更新應用程式

```bash
# 拉取最新程式碼
git pull origin main

# 重新建置並部署
./deploy.sh --build
```

#### 資料庫操作

```bash
# 存取 PostgreSQL CLI
docker compose exec db psql -U cohe_user -d cohe_capital

# 執行遷移
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"

# 開啟 Prisma Studio（資料庫 GUI）
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma studio"
```

#### 容器 Shell 存取

```bash
# API 容器
docker compose exec api sh

# Web 容器
docker compose exec web sh

# Admin 容器
docker compose exec admin sh
```

---

## 故障排除

### 問題：容器無法啟動

**檢查日誌：**
```bash
docker compose logs <服務名稱>
```

**常見原因：**
- 環境變數遺失或無效
- 端口已被使用
- 資料庫未就緒

**解決方案：**
```bash
# 檢查所有容器
docker compose ps

# 重啟特定服務
docker compose restart <服務名稱>
```

### 問題：資料庫連線失敗

**症狀：**
```
Error: P1001: Can't reach database server
```

**檢查資料庫健康狀態：**
```bash
docker compose exec db pg_isready -U cohe_user -d cohe_capital
```

**解決方案：**
```bash
# 重啟資料庫
docker compose restart db

# 等待健康檢查
docker compose ps db
```

### 問題：Nginx 502 Bad Gateway

**原因：** 上游服務（web/admin/api）未執行

**檢查：**
```bash
docker compose ps
```

**解決方案：**
```bash
# 重啟上游服務
docker compose restart api web admin

# 檢查 nginx 設定語法
docker compose exec nginx nginx -t
```

### 問題：磁碟空間不足

**檢查磁碟使用量：**
```bash
df -h
docker system df
```

**清理：**
```bash
# 移除未使用的映像檔
docker image prune -a

# 移除未使用的卷宗
docker volume prune

# 移除已停止的容器
docker container prune
```

---

## 監控與維護

### 健康檢查

所有服務都內建健康檢查：

```bash
# 檢查服務健康狀態
docker compose ps

# 預期輸出顯示 "healthy" 狀態
```

### 資源監控

```bash
# 監控資源使用量
docker stats

# 檢查容器日誌中的錯誤
docker compose logs --tail=100 | grep -i error
```

### 效能調校

**資料庫：**

編輯 `docker-compose.yml` 新增 PostgreSQL 調校：

```yaml
db:
  environment:
    POSTGRES_SHARED_BUFFERS: 512MB
    POSTGRES_MAX_CONNECTIONS: 200
```

**Nginx：**

調整 `infra/nginx/nginx.conf` 中的工作行程：

```nginx
worker_processes auto;  # 自動使用所有 CPU 核心
```

### 定期維護任務

**每週：**
- [ ] 檢視錯誤日誌
- [ ] 檢查磁碟空間使用量
- [ ] 驗證備份是否正常運作

**每月：**
- [ ] 更新 Docker 映像檔（`docker compose pull`）
- [ ] 檢視並輪替存取令牌/密鑰
- [ ] 稽核資料庫中的孤立記錄

**每季：**
- [ ] 安全稽核（依賴項、CVE）
- [ ] 效能檢視與最佳化
- [ ] 災難恢復演練

---

## 生產環境部署檢查清單

上線前：

### 基礎設施
- [ ] 伺服器符合最低要求
- [ ] 防火牆已設定並啟用
- [ ] SSH 已加固（僅金鑰、自訂端口）
- [ ] SSL/TLS 憑證已安裝並設定
- [ ] DNS 記錄已設定（A、AAAA、CNAME）

### 應用程式
- [ ] 所有環境變數已設定
- [ ] 資料庫遷移已套用
- [ ] 種子資料已載入（如適用）
- [ ] 管理員帳號已建立並保護
- [ ] 檔案上傳已測試
- [ ] API 端點已測試（Postman/Swagger）

### 安全性
- [ ] 所有預設憑證已變更
- [ ] CORS 已設定特定網域
- [ ] 資料庫外部存取已停用
- [ ] 日誌輪替已設定
- [ ] 備份策略已實作並測試
- [ ] 監控/警報已設定

### 測試
- [ ] 冒煙測試已通過
- [ ] 負載測試已完成
- [ ] 安全掃描已執行
- [ ] SSL 憑證已驗證（SSL Labs 評級 A+）

---

## 緊急程序

### 回滾部署

```bash
# 停止當前版本
docker compose down

# 切換到先前版本
git log --oneline  # 尋找提交雜湊
git checkout <先前的提交雜湊>

# 重新部署
./deploy.sh
```

### 從備份還原

```bash
# 停止服務
docker compose down

# 還原資料庫
gunzip -c /var/backups/cohe-capital/db/backup_20250119.sql.gz | \
  docker compose exec -T db psql -U cohe_user -d cohe_capital

# 重啟服務
docker compose up -d
```

---

## 其他資源

- **Docker 文件**: https://docs.docker.com/
- **Docker Compose 參考**: https://docs.docker.com/compose/
- **Nginx 文件**: https://nginx.org/en/docs/
- **PostgreSQL 文件**: https://www.postgresql.org/docs/
- **安全最佳實踐**: https://cheatsheetseries.owasp.org/

---

## 支援與聯絡

如遇部署問題：
1. 查看本文件
2. 檢視日誌：`docker compose logs -f`
3. 搜尋 GitHub issues
4. 聯絡 DevOps 團隊

---

**最後更新**: 2025-01-20
**版本**: 1.0.0
