# Scripts 目录

本目录包含项目开发和运维的实用脚本。

## 📂 脚本列表

### 数据库管理

#### `reset-db.sh`
**完全重置数据库**

- **功能**: 删除整个数据库，重新创建，运行 migrations 和 seed
- **警告**: ⚠️ 会删除所有数据！
- **使用场景**: 需要从零开始重建数据库时
- **用法**:
  ```bash
  ./scripts/reset-db.sh
  ```

#### `reseed-db.sh`
**重新运行 seed 数据**

- **功能**: 重新运行 seed 脚本，不删除数据库
- **特点**: 使用 upsert，可以安全地多次运行
- **使用场景**: 更新测试数据或修复 seed 数据
- **用法**:
  ```bash
  ./scripts/reseed-db.sh
  ```

## 🔍 使用示例

### 场景 1: 开发中修改了 schema 和 seed 数据

```bash
# 1. 完全重置数据库
./scripts/reset-db.sh

# 2. 验证数据
docker compose exec db psql -U postgres -d web3_insurance -c "SELECT * FROM \"User\";"
```

### 场景 2: 只需要更新 seed 数据

```bash
# 重新运行 seed（不会删除已有数据，只会更新 seed 的固定 ID 数据）
./scripts/reseed-db.sh
```
