# 🔧 部署脚本改进说明

> **deploy.sh 和 setup-local-dev.sh 的关键改进**

---

## 📋 改进概览

根据代码审查反馈，对部署脚本进行了以下关键改进，提升了安全性、准确性和易用性。

---

## 1️⃣ 修复 `--migrate` 模式语义不清问题

### ❌ 原问题

```bash
./deploy.sh --migrate    # 用户期望：只运行迁移
```

**实际行为**：照样运行完整部署流程（pull + build + deploy + migrate）
- 只是将 `BUILD_IMAGES=false` 和 `PULL_CODE=false`
- **仍然会执行 `deploy_services`**，导致语义混乱

### ✅ 改进方案

新增 `MIGRATE_ONLY` 标志，实现真正的"仅迁移"模式：

```bash
# 配置
MIGRATE_ONLY=false  # 新增标志

# 参数解析
--migrate)
    MIGRATE_ONLY=true      # 设置仅迁移模式
    RUN_MIGRATIONS=true
    PULL_CODE=false
    BUILD_IMAGES=false
    shift
    ;;

# 主流程
main() {
    check_prerequisites

    # 仅迁移模式：早期退出
    if [ "$MIGRATE_ONLY" = true ]; then
        log_info "Running in MIGRATION ONLY mode"
        log_warning "This will NOT deploy/restart services, only run migrations"
        run_migrations
        log_success "Migrations completed (migration-only mode) ✅"
        exit 0
    fi

    # 完整部署流程
    pull_code
    build_images
    deploy_services
    run_migrations
    show_summary
    view_logs
}
```

**效果**：
- `./deploy.sh --migrate` 现在真正"只运行迁移"
- 不会启动/重启任何服务
- 语义与注释一致

---

## 2️⃣ 修复 ERR trap 误关服务问题

### ❌ 原问题

```bash
trap cleanup_on_error ERR

cleanup_on_error() {
    log_error "Deployment failed!"
    docker compose down  # ⚠️ 危险！
    exit 1
}
```

**问题**：
1. **任何命令出错都会触发 `down`**，包括：
   - 查看日志时按 Ctrl+C 退出 → 触发 ERR → 全部服务被关闭
   - 轻微错误（如 Git 拉取失败）→ 关闭所有服务
2. **生产环境误操作风险极高**：
   - 你只是想退出日志查看，结果线上服务全停了
   - 迁移失败，不一定想关闭整个服务

### ✅ 改进方案 A：不在 trap 中执行 down（推荐）

```bash
cleanup_on_error() {
    log_error "Deployment failed!"
    echo ""
    log_warning "Services may be in a partial state."
    log_info "Please check the status with:"
    log_info "  docker compose ps"
    log_info "  docker compose logs [service_name]"
    echo ""
    log_info "To manually clean up (if needed):"
    log_info "  docker compose down     # Stop all services"
    log_info "  docker compose down -v  # Stop and remove volumes (⚠️ deletes data)"
    echo ""
    exit 1
}
```

**优点**：
- ✅ 脚本失败会退出并提示
- ✅ 不会"顺便把线上关掉"，安全很多
- ✅ 用户可以自行判断是否需要清理

### ✅ 改进方案 B：view_logs 函数中临时关闭 trap

```bash
view_logs() {
    if [ "$SHOW_LOGS" = true ]; then
        print_header "Service Logs"
        log_info "Press Ctrl+C to exit logs"
        sleep 2

        # 临时关闭 ERR trap，避免 Ctrl+C 导致 cleanup_on_error
        trap - ERR
        set +e

        docker compose logs -f

        # 恢复 ERR trap
        set -e
        trap cleanup_on_error ERR
    fi
}
```

**效果**：
- ✅ 退出日志不会触发 cleanup
- ✅ 其他错误仍然被捕获

**本次采用**：方案 A（更安全）+ 方案 B（view_logs 保护）

---

## 3️⃣ 改进迁移步骤的健壮性

### ❌ 原实现

```bash
run_migrations() {
    sleep 10  # 固定等待

    # 检查 API 容器是否运行
    if ! docker compose ps api | grep -q "Up"; then
        docker compose up -d api db
        sleep 15
    fi

    # 在运行中的 API 容器执行迁移
    docker compose exec -T api sh -c "pnpm prisma migrate deploy"
}
```

**问题**：
1. 固定等待时间不可靠（有时数据库未就绪）
2. 依赖 API 容器已经在运行
3. 可能污染当前运行的 API 容器

### ✅ 改进方案

```bash
run_migrations() {
    if [ "$RUN_MIGRATIONS" = true ]; then
        print_header "Running Database Migrations"

        # 1. 确保数据库运行
        log_info "Ensuring database is running..."
        docker compose up -d db

        # 2. 等待数据库健康（动态检查，最多 60 秒）
        log_info "Waiting for database to be ready..."
        local max_attempts=30
        local attempt=0

        while [ $attempt -lt $max_attempts ]; do
            if docker compose exec -T db pg_isready -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1; then
                log_success "Database is ready"
                break
            fi
            attempt=$((attempt + 1))
            if [ $attempt -eq $max_attempts ]; then
                log_error "Database failed to become ready after ${max_attempts} attempts"
                exit 1
            fi
            sleep 2
        done

        # 3. 使用 `run --rm` 执行一次性迁移任务
        log_info "Executing Prisma migrations..."
        docker compose run --rm api sh -c "cd /app/apps/api && pnpm prisma migrate deploy" || {
            log_error "Migration failed. Check the error output above."
            log_info "Troubleshooting tips:"
            log_info "  1. Check database connection: docker compose logs db"
            log_info "  2. Verify DATABASE_URL in .env is correct"
            log_info "  3. Check if migrations exist: ls apps/api/prisma/migrations/"
            exit 1
        }

        log_success "Database migrations completed successfully"
    fi
}
```

**改进点**：
1. ✅ **动态等待数据库**：使用 `pg_isready` 轮询，最多 60 秒
2. ✅ **使用 `run --rm`**：不依赖现有 API 容器，执行完自动清理
3. ✅ **更好的错误提示**：失败时提供排查步骤

**优点**：
- 更可靠（动态检测而非固定等待）
- 更安全（不污染运行中的容器）
- 更易排查（详细的错误提示）

---

## 4️⃣ 修复 `source .env` 与 `set -u` 的兼容性

### ❌ 潜在问题

```bash
set -u  # 未定义变量报错

# ...后面
source .env 2>/dev/null || true

WEB_PORT="${WEB_PORT:-3000}"  # 如果 .env 中未定义，set -u 会报错
```

### ✅ 改进方案

```bash
show_summary() {
    # 临时关闭 errexit 以安全加载 .env
    set +e
    source .env 2>/dev/null
    set -e

    # 使用默认值
    WEB_PORT="${WEB_PORT:-3000}"
    ADMIN_PORT="${ADMIN_PORT:-3002}"
    API_PORT="${API_PORT:-3001}"
    NGINX_HTTP_PORT="${NGINX_HTTP_PORT:-80}"

    # ...
}
```

**效果**：
- ✅ 即使 .env 中缺少某些变量，也能安全运行
- ✅ 保持 `set -u` 的严格性，仅在需要时临时关闭

---

## 5️⃣ 改进帮助文档和示例

### ✅ 新增详细示例

```bash
--help)
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --build       Rebuild Docker images with --no-cache"
    echo "  --no-pull     Skip pulling latest code from Git"
    echo "  --migrate     Run database migrations ONLY (no deployment)"
    echo "  --logs        Show logs after deployment"
    echo "  --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full deployment (pull + build + deploy + migrate)"
    echo "  $0 --build            # Rebuild images before deployment"
    echo "  $0 --migrate          # Only run database migrations"
    echo "  $0 --no-pull --logs   # Deploy without git pull, then show logs"
    echo ""
    exit 0
    ;;
```

---

## 📊 改进对比总结

| 问题 | 原实现 | 改进后 | 安全性提升 |
|------|--------|--------|-----------|
| **--migrate 语义** | 仍然部署所有服务 | 真正仅运行迁移 | ⭐⭐⭐ |
| **ERR trap** | 错误自动 down | 仅提示，不自动关闭 | ⭐⭐⭐⭐⭐ |
| **日志查看** | Ctrl+C 会触发 down | 临时关闭 trap | ⭐⭐⭐⭐ |
| **迁移健壮性** | 固定等待 10s | 动态检测 pg_isready | ⭐⭐⭐⭐ |
| **迁移隔离** | 依赖 API 容器 | 使用 run --rm | ⭐⭐⭐ |
| **错误提示** | 简单报错 | 详细排查步骤 | ⭐⭐ |
| **source .env** | 可能与 set -u 冲突 | 临时关闭 errexit | ⭐⭐ |

---

## 🚀 使用示例

### 场景 1：完整部署

```bash
./deploy.sh
# 执行：check → pull → build → deploy → migrate → summary
```

### 场景 2：仅运行迁移

```bash
./deploy.sh --migrate
# 执行：check → migrate（不部署服务）
# 输出：Migrations completed (migration-only mode) ✅
```

### 场景 3：强制重建并查看日志

```bash
./deploy.sh --build --logs
# 执行：check → pull → build(no-cache) → deploy → migrate → summary → logs
# Ctrl+C 退出日志不会关闭服务
```

### 场景 4：本地开发（跳过 git pull）

```bash
./deploy.sh --no-pull
# 执行：check → build → deploy → migrate → summary
```

---

## ✅ 测试验证

建议测试以下场景：

1. **正常部署**
   ```bash
   ./deploy.sh
   # 期望：全部成功
   ```

2. **仅迁移模式**
   ```bash
   ./deploy.sh --migrate
   # 期望：不启动/重启服务，仅执行迁移
   ```

3. **查看日志并退出**
   ```bash
   ./deploy.sh --logs
   # 按 Ctrl+C 退出
   # 期望：服务仍在运行（不会被关闭）
   ```

4. **迁移失败处理**
   ```bash
   # 故意配置错误的 DATABASE_URL
   ./deploy.sh --migrate
   # 期望：显示详细错误提示，不关闭服务
   ```

5. **数据库未就绪**
   ```bash
   docker compose stop db
   ./deploy.sh --migrate
   # 期望：等待数据库启动，最多 60 秒，然后执行迁移
   ```

---

## 📝 兼容性说明

这些改进是向后兼容的：
- ✅ 原有命令行参数仍然有效
- ✅ 默认行为未改变（完整部署流程）
- ✅ 仅优化了错误处理和边缘情况

**升级建议**：
- 现有部署脚本可直接替换
- 建议先在测试环境验证
- 生产环境部署前备份现有配置

---

## 🔗 相关文档

- [完整部署文档](./DEPLOYMENT.md)
- [本地开发指南](./LOCAL_DEVELOPMENT.md)
- [项目状态](./project_state.md)

---

**最后更新**: 2025-01-19
**改进版本**: v2.0
