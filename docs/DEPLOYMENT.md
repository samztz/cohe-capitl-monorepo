# 🚀 Deployment Guide - Cohe Capital Insurance Platform

> **Production-ready Docker deployment guide with security best practices**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Security Hardening](#security-hardening)
5. [Operational Guide](#operational-guide)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Server Requirements

**Minimum Specifications:**
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / RHEL 8+
- **CPU**: 2 cores (4+ recommended for production)
- **RAM**: 4GB (8GB+ recommended for production)
- **Storage**: 20GB SSD (50GB+ for production with logs)
- **Network**: Public IP address with open ports 80, 443

**Software Dependencies:**
- Docker Engine 24.0+
- Docker Compose 2.0+
- Git 2.0+
- (Optional) Nginx or another reverse proxy if not using containerized nginx

### Installation Commands

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group (avoid using sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose (if not included)
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

---

## Quick Start

### 1. Clone Repository

```bash
# Clone the project
git clone https://github.com/your-org/cohe-capitl-monorepo.git
cd cohe-capitl-monorepo
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.production.example .env

# Edit configuration (see detailed setup below)
nano .env
```

**⚠️ CRITICAL: Change all default values!**

### 3. Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Expected Output:**
```
============================================
Starting Deployment: cohe-capital
============================================
[INFO] Building Docker images...
[SUCCESS] Docker images built successfully
[INFO] Starting all services...
[SUCCESS] All services started successfully
[SUCCESS] Deployment completed successfully! 🚀
```

### 4. Verify Deployment

```bash
# Check service status
docker compose ps

# Access services
# Web:        http://YOUR_SERVER_IP/
# Admin:      http://YOUR_SERVER_IP/admin
# API:        http://YOUR_SERVER_IP/api
# API Docs:   http://YOUR_SERVER_IP/api-docs
```

---

## Detailed Setup

### Step 1: Environment Configuration

Edit `.env` file and configure these critical sections:

#### 1.1 Database Credentials

```bash
# Generate strong password
POSTGRES_PASSWORD=$(openssl rand -base64 32)

POSTGRES_USER=cohe_user
POSTGRES_PASSWORD=<generated-password>
POSTGRES_DB=cohe_capital
```

#### 1.2 JWT Secrets

```bash
# Generate secure random secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

JWT_SECRET=<generated-secret>
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=<generated-refresh-secret>
JWT_REFRESH_EXPIRATION=7d
```

#### 1.3 SIWE Configuration

```bash
SIWE_DOMAIN=your-domain.com
SIWE_URI=https://your-domain.com
```

#### 1.4 Admin Token

```bash
# Generate admin token
ADMIN_TOKEN=$(openssl rand -hex 32)

ADMIN_TOKEN=<generated-admin-token>
```

#### 1.5 Blockchain Configuration

```bash
# Get project ID from https://cloud.reown.com/
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id_here

# Network settings
NEXT_PUBLIC_CHAIN_ID=56          # BSC Mainnet (or 97 for testnet)
NEXT_PUBLIC_CHAIN_NAME=BSC Mainnet
```

#### 1.6 API URLs

```bash
# For nginx reverse proxy setup
NEXT_PUBLIC_API_URL=http://localhost/api

# For production with domain
# NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

### Step 2: SSL/TLS Configuration (Production)

#### Option A: Let's Encrypt (Recommended for most cases)

```bash
# Install certbot
sudo apt install certbot -y

# Obtain certificate (with nginx stopped)
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Certificates will be in:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

Then update `docker-compose.yml`:

```yaml
nginx:
  volumes:
    - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/nginx/certs:ro  # Add this line
```

And uncomment HTTPS block in `infra/nginx/nginx.conf`.

#### Option B: Cloud Provider SSL

If using AWS/GCP/Azure load balancer, configure SSL termination at load balancer level.

### Step 3: Firewall Configuration

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 4: Database Migration

Migrations run automatically during deployment. To run manually:

```bash
# Execute migrations
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"

# Verify database schema
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma db pull"
```

---

## Security Hardening

### 🔒 Critical Security Checklist

#### Before Production Deployment:

- [ ] **Change all default passwords** in `.env`
- [ ] **Generate secure JWT secrets** (32+ characters, random)
- [ ] **Set CORS_ORIGIN** to specific domain(s), not `*`
- [ ] **Disable database port exposure** (comment out `DB_PORT` mapping in `docker-compose.yml`)
- [ ] **Configure SSL/TLS certificates** (HTTPS only in production)
- [ ] **Enable firewall** (ufw/iptables)
- [ ] **Restrict SSH access** (key-only, disable password auth)
- [ ] **Set up log rotation** (prevent disk space issues)
- [ ] **Configure backup strategy** (daily database backups)
- [ ] **Review nginx rate limits** (prevent DDoS)
- [ ] **Enable HSTS** (after confirming HTTPS works)
- [ ] **Set secure file permissions** (`.env` should be 600)

### 1. Secure Environment File

```bash
# Set restrictive permissions on .env
chmod 600 .env

# Ensure it's in .gitignore (already done)
grep -q '^.env$' .gitignore || echo '.env' >> .gitignore

# Never commit .env to Git
git update-index --assume-unchanged .env
```

### 2. Disable Database External Access (Production)

Edit `docker-compose.yml`:

```yaml
db:
  # Comment out or remove this in production
  # ports:
  #   - "${DB_PORT:-5432}:5432"
```

Database will only be accessible via Docker internal network.

### 3. CORS Configuration

In `.env`:

```bash
# Development
CORS_ORIGIN=*

# Production - specify exact domains
CORS_ORIGIN=https://your-domain.com,https://admin.your-domain.com
```

### 4. Rate Limiting

Review `infra/nginx/nginx.conf`:

```nginx
# Adjust based on expected traffic
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;
```

### 5. Non-root User Verification

All containers run as non-root users. Verify:

```bash
# Check API container user
docker compose exec api whoami
# Expected output: nestjs

# Check Web container user
docker compose exec web whoami
# Expected output: nextjs
```

### 6. File Storage Security

**⚠️ Current setup uses local file storage for uploads (signatures).**

**Production Recommendations:**
- Replace with cloud storage (AWS S3, Cloudflare R2, Alibaba OSS)
- Use signed URLs for downloads
- Implement access control (AdminGuard for signature viewing)
- Enable virus scanning on uploads

Example S3 integration (future):

```typescript
// apps/api/src/modules/policy/signature-storage.service.ts
async saveSignature(base64: string, policyId: string): Promise<SignatureMetadata> {
  // Upload to S3 instead of local filesystem
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

### 7. Log Management

**Prevent disk space issues:**

```bash
# Configure Docker log rotation
sudo nano /etc/docker/daemon.json
```

Add:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:

```bash
sudo systemctl restart docker
```

### 8. Backup Strategy

**Database Backups:**

Create backup script `scripts/backup-db.sh`:

```bash
#!/bin/bash
# Daily database backup

BACKUP_DIR="/var/backups/cohe-capital/db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose exec -T db pg_dump -U cohe_user -d cohe_capital | gzip > "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

Setup cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/cohe-capitl-monorepo/scripts/backup-db.sh
```

---

## Operational Guide

### Common Operations

#### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db

# Last 100 lines
docker compose logs --tail=100 api
```

#### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart api
docker compose restart web
```

#### Stop/Start Services

```bash
# Stop all
docker compose down

# Start all
docker compose up -d

# Stop without removing containers
docker compose stop

# Start stopped containers
docker compose start
```

#### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
./deploy.sh --build
```

#### Database Operations

```bash
# Access PostgreSQL CLI
docker compose exec db psql -U cohe_user -d cohe_capital

# Run migrations
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma migrate deploy"

# Open Prisma Studio (database GUI)
docker compose exec api sh -c "cd /app/apps/api && pnpm prisma studio"
```

#### Container Shell Access

```bash
# API container
docker compose exec api sh

# Web container
docker compose exec web sh

# Admin container
docker compose exec admin sh
```

---

## Troubleshooting

### Issue: Container fails to start

**Check logs:**
```bash
docker compose logs <service-name>
```

**Common causes:**
- Environment variable missing or invalid
- Port already in use
- Database not ready

**Solution:**
```bash
# Check all containers
docker compose ps

# Restart specific service
docker compose restart <service-name>
```

### Issue: Database connection failed

**Symptoms:**
```
Error: P1001: Can't reach database server
```

**Check database health:**
```bash
docker compose exec db pg_isready -U cohe_user -d cohe_capital
```

**Solution:**
```bash
# Restart database
docker compose restart db

# Wait for health check
docker compose ps db
```

### Issue: Nginx 502 Bad Gateway

**Cause:** Upstream service (web/admin/api) not running

**Check:**
```bash
docker compose ps
```

**Solution:**
```bash
# Restart upstream service
docker compose restart api web admin

# Check nginx config syntax
docker compose exec nginx nginx -t
```

### Issue: Out of disk space

**Check disk usage:**
```bash
df -h
docker system df
```

**Clean up:**
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove stopped containers
docker container prune
```

---

## Monitoring & Maintenance

### Health Checks

All services have built-in health checks:

```bash
# Check service health
docker compose ps

# Expected output shows "healthy" status
```

### Resource Monitoring

```bash
# Monitor resource usage
docker stats

# Check container logs for errors
docker compose logs --tail=100 | grep -i error
```

### Performance Tuning

**Database:**

Edit `docker-compose.yml` to add PostgreSQL tuning:

```yaml
db:
  environment:
    POSTGRES_SHARED_BUFFERS: 512MB
    POSTGRES_MAX_CONNECTIONS: 200
```

**Nginx:**

Adjust worker processes in `infra/nginx/nginx.conf`:

```nginx
worker_processes auto;  # Automatically use all CPU cores
```

### Regular Maintenance Tasks

**Weekly:**
- [ ] Review logs for errors
- [ ] Check disk space usage
- [ ] Verify backups are working

**Monthly:**
- [ ] Update Docker images (`docker compose pull`)
- [ ] Review and rotate access tokens/secrets
- [ ] Audit database for orphaned records

**Quarterly:**
- [ ] Security audit (dependencies, CVEs)
- [ ] Performance review and optimization
- [ ] Disaster recovery drill

---

## Production Deployment Checklist

Before going live:

### Infrastructure
- [ ] Server meets minimum requirements
- [ ] Firewall configured and enabled
- [ ] SSH hardened (key-only, custom port)
- [ ] SSL/TLS certificates installed and configured
- [ ] DNS records configured (A, AAAA, CNAME)

### Application
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Seed data loaded (if applicable)
- [ ] Admin account created and secured
- [ ] File uploads tested
- [ ] API endpoints tested (Postman/Swagger)

### Security
- [ ] All default credentials changed
- [ ] CORS configured for specific domains
- [ ] Database external access disabled
- [ ] Log rotation configured
- [ ] Backup strategy implemented and tested
- [ ] Monitoring/alerting set up

### Testing
- [ ] Smoke tests passed
- [ ] Load testing completed
- [ ] Security scan performed
- [ ] SSL certificate validated (A+ on SSL Labs)

---

## Emergency Procedures

### Rollback Deployment

```bash
# Stop current version
docker compose down

# Checkout previous version
git log --oneline  # Find commit hash
git checkout <previous-commit-hash>

# Redeploy
./deploy.sh
```

### Restore from Backup

```bash
# Stop services
docker compose down

# Restore database
gunzip -c /var/backups/cohe-capital/db/backup_20250119.sql.gz | \
  docker compose exec -T db psql -U cohe_user -d cohe_capital

# Restart services
docker compose up -d
```

---

## Additional Resources

- **Docker Docs**: https://docs.docker.com/
- **Docker Compose Reference**: https://docs.docker.com/compose/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Security Best Practices**: https://cheatsheetseries.owasp.org/

---

## Support & Contact

For deployment issues:
1. Check this documentation
2. Review logs: `docker compose logs -f`
3. Search GitHub issues
4. Contact DevOps team

---

**Last Updated**: 2025-01-19
**Version**: 1.0.0
