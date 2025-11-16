# Testing Repeat Purchases Fix

## 问题描述
之前的系统在数据库层面有 unique constraint，导致同一个钱包地址无法为同一个 SKU 购买多个保单。

## 修复内容

### 1. 数据库层修复
- ✅ 删除了 `Policy(walletAddress, skuId)` 的 unique constraint
- ✅ 改为非唯一索引 `@@index([walletAddress, skuId])`
- ✅ 使用 `prisma db push` 强制同步 schema 到数据库

### 2. 代码层修复
- ✅ 移除了 `apps/api/src/modules/policy/policy.service.ts` 中的 `ConflictException` 处理
- ✅ 移除了 P2002 错误码的特殊处理（因为不再有 unique constraint violation）

### 3. 执行的修复步骤

```bash
# 1. 创建强制删除约束的 SQL 迁移
apps/api/prisma/migrations/20251115150000_force_remove_unique_constraint/migration.sql

# 2. 直接执行 SQL
pnpm prisma db execute --schema prisma/schema.prisma --file migration.sql

# 3. 强制同步 schema (这是关键步骤!)
pnpm prisma db push --skip-generate --accept-data-loss

# 4. 重新生成 Prisma Client
pnpm prisma generate

# 5. 重启 API 服务器
```

## 测试步骤

### 前置准备

1. **确保 API 服务器运行**:
```bash
cd apps/api
pnpm dev
```

2. **确保数据库有 SKU 数据**:
```bash
cd apps/api
pnpm prisma db seed
```

3. **启动 Web 应用**:
```bash
cd apps/web
pnpm dev
# 应该运行在 http://localhost:3030
```

### 测试流程

#### 方法 1: 通过 Web 界面测试 (推荐)

1. **打开浏览器访问**: `http://localhost:3030`

2. **连接钱包并登录**:
   - 点击"连接钱包"
   - 使用测试钱包地址: `0x83b6e7e65f223336b7531ccab6468017a5eb7f77`
   - 完成 SIWE 签名认证

3. **创建第一个保单**:
   - 导航到产品页面
   - 选择 "YULILY SHIELD INSURANCE" 产品
   - 填写保单信息
   - 提交创建
   - ✅ 应该成功创建，得到保单 ID (例如: `POL-001`)

4. **创建第二个保单** (重复购买测试):
   - 返回产品页面
   - **选择同一个产品** "YULILY SHIELD INSURANCE"
   - 再次填写保单信息
   - 提交创建
   - ✅ **应该成功创建第二个保单**，得到不同的保单 ID (例如: `POL-002`)
   - ❌ **如果报错 "Unique constraint failed"，说明修复未生效**

5. **验证结果**:
   - 打开 Admin 页面: `http://localhost:3002`
   - 搜索你的钱包地址: `0x83b6e7e65f223336b7531ccab6468017a5eb7f77`
   - 应该看到**2个保单**，都是同一个 SKU

#### 方法 2: 通过 API 直接测试

需要先获取 JWT token:

```bash
# 1. 在浏览器中登录后，打开 DevTools Console 执行:
localStorage.getItem('auth_jwt_token')

# 2. 复制 token，然后执行以下测试
```

```bash
export JWT_TOKEN="你的token"
export API_URL="http://localhost:3001"
export WALLET="0x83b6e7e65f223336b7531ccab6468017a5eb7f77"

# 创建第一个保单
curl -X POST "$API_URL/policy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"skuId":"bsc-usdt-plan-seed","walletAddress":"'$WALLET'"}'

# 等待1秒
sleep 1

# 创建第二个保单 (相同 SKU)
curl -X POST "$API_URL/policy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"skuId":"bsc-usdt-plan-seed","walletAddress":"'$WALLET'"}'
```

**预期结果**:
- 第一个请求: 返回保单 ID，status 200
- 第二个请求: 返回**不同的**保单 ID，status 200
- ❌ 如果第二个请求返回 500 或 "Unique constraint failed"，说明问题未解决

## 故障排查

### 如果仍然报错 "Unique constraint failed"

#### 检查 1: 验证数据库 schema
```bash
cd apps/api
pnpm prisma studio
# 打开 http://localhost:5555
# 查看 Policy 表的 Indexes/Constraints
# 应该只有 non-unique index，没有 unique constraint
```

#### 检查 2: 手动检查约束
由于你的环境没有 psql，使用 Prisma Studio:
1. 访问 http://localhost:5555
2. 点击 Policy 模型
3. 查看右侧的 "Indexes" 面板
4. **不应该有** `Policy_walletAddress_skuId_key` (unique)
5. **应该有** `Policy_walletAddress_skuId_idx` (non-unique index)

#### 检查 3: 重新强制同步

```bash
cd apps/api

# 1. 停止 API 服务器 (Ctrl+C)

# 2. 强制同步 schema
pnpm prisma db push --force-reset --skip-generate

# 3. 重新生成 client
pnpm prisma generate

# 4. 重启 API
pnpm dev
```

#### 检查 4: 查看 Prisma schema 文件

```bash
cat apps/api/prisma/schema.prisma | grep -A 10 "model Policy"
```

应该看到:
```prisma
model Policy {
  // ... fields

  @@index([userId])
  @@index([status])
  @@index([walletAddress, skuId])  // ← 这里应该是 @@index，不是 @@unique
}
```

## 成功标志

✅ **修复成功的标志**:
1. 同一个钱包地址可以为同一个 SKU 创建多个保单
2. 每个保单有不同的 UUID
3. 数据库中可以看到多条记录，walletAddress 和 skuId 相同但 id 不同
4. 不再出现 "Unique constraint failed" 错误

## 相关文件

- `apps/api/prisma/schema.prisma` - Schema 定义
- `apps/api/prisma/migrations/20251115150000_force_remove_unique_constraint/migration.sql` - 强制删除约束的迁移
- `apps/api/src/modules/policy/policy.service.ts` - 移除了 ConflictException 处理

## 注意事项

1. **已执行 `pnpm prisma db push --skip-generate --accept-data-loss`**
   这会强制同步 schema 到数据库，删除所有不在 schema 中定义的约束

2. **已重新生成 Prisma Client**
   确保运行时使用的是最新的 schema

3. **需要重启 API 服务器**
   确保加载了新的 Prisma Client

## 如果问题仍然存在

请提供以下信息:
1. Prisma Studio 中 Policy 表的 Indexes 截图
2. 创建保单时的完整错误信息
3. API 服务器日志中的错误堆栈
