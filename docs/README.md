# 📚 Cohe Capital 文档中心

**欢迎来到 Cohe Capital 项目文档中心！**

本文档中心遵循 **单一事实来源 (Single Source of Truth, SSoT)** 原则，提供清晰、可执行、可交接的最小文档集合。

---

## 🗂️ 核心文档 (SSoT)

以下是项目的核心文档，涵盖从开发到部署的完整流程：

### 1. [📘 项目概览](../README.md)
- 项目简介与背景 (见根目录 README.md)
- 系统架构图
- 核心模块说明
- 技术栈概览
- 快速开始指南

### 2. [🔧 本地开发指南](./LOCAL_DEVELOPMENT.md)
- 快速启动 (推荐使用 `./setup-local-dev.sh`)
- 手动配置步骤 (环境变量、Docker Compose)
- 功能验证清单
- 常见问题排查

### 3. [🚀 部署指南](./DEPLOYMENT.md)
- 生产环境准备 (域名、SSL、环境变量)
- Docker Compose 部署流程
- 使用自动化脚本一键部署 (`./deploy.sh`)
- Nginx 反向代理配置
- 验证清单与健康检查
- 安全加固（HTTPS、CORS、Rate Limiting）
- 运维命令（日志、备份、更新）
- 故障排除

### 4. [⚙️ 运维指南](./OPERATIONS.md)
- 日志查看与分析
- 资源监控
- 数据库备份与恢复
- SSL证书续期
- 常见运维操作

### 5. [📝 变更日志](./CHANGELOG.md)
- 开发历史记录
- 功能迭代日志
- Bug 修复记录
- 最新更新：Railway Prisma 构建错误修复

### 6. [🗺️ 路线图](./ROADMAP.md)
- 当前进度追踪
- Epic 状态总览
- 下一步计划

### 7. [📖 系统架构白皮书](./Cohe-Capital-架构系统白皮书.md)
- 系统架构设计
- 技术选型说明
- 业务流程详解

---

## 🏗️ 架构概览

### 技术栈

**后端 (apps/api)**:
- NestJS 11 + Fastify
- Prisma 6 (PostgreSQL)
- SIWE (Sign-In with Ethereum)
- ethers v6 (区块链交互)

**前端 (apps/web, apps/admin)**:
- Next.js 14 + React 18
- TanStack Query (数据获取)
- Reown AppKit (钱包连接)
- Tailwind CSS (样式)

**基础设施**:
- Docker + Docker Compose
- Nginx (反向代理)
- PostgreSQL 16 (数据库)

**区块链**:
- BSC (Binance Smart Chain)
- ERC-20 代币支付
- 链上交易验证

---

## 🚀 快速开始

### 本地开发

```bash
# 一键启动
./setup-local-dev.sh

# 访问应用
# Web: http://web.localhost
# Admin: http://admin.localhost
# API Docs: http://web.localhost/api-docs
```

### 生产部署

```bash
# 1. 准备生产环境
./scripts/prepare-production.sh

# 2. 执行部署
./deploy.sh --prod --build

# 3. 验证部署
curl http://yourdomain.com/health
```

详细步骤请参考 [部署指南](./DEPLOYMENT.md)。

---

## 📂 文档组织结构

```
docs/
├── README.md                     # 本文件 - 文档导航
├── CHANGELOG.md                  # 变更日志 (7,878 行)
├── DEPLOYMENT.md                 # 部署指南 (统一)
├── LOCAL_DEVELOPMENT.md          # 本地开发指南
├── OPERATIONS.md                 # 运维指南
├── ROADMAP.md                    # 项目路线图
├── Cohe-Capital-架构系统白皮书.md # 系统架构白皮书
└── archived/                     # 历史文档存档
    ├── DEPLOYMENT_GUIDE.md
    ├── DOCKER_*                  # Docker 相关历史文档
    ├── PROJECT_*.md              # 项目相关历史文档
    ├── RAILWAY_DEPLOYMENT.md     # Railway 部署（已废弃）
    ├── DEPLOYMENT.zh-TW.md       # 繁体中文版（已整合）
    └── ...                       # 其他历史文档
```

---

## 🔄 文档维护原则

### 1. 单一事实来源 (SSoT)
- 每个主题只有一个权威文档
- 避免重复和矛盾

### 2. 版本化
- 所有文档标注最后更新日期
- 重大变更记录在 CHANGELOG.md

### 3. 可执行性
- 所有命令都经过测试
- 提供完整的上下文和示例

### 4. 归档策略
- 过时的文档移至 `archived/`
- 保留历史记录便于回溯

---

## 🆕 最近更新

**2025-11-26**:
- ✅ 整合部署文档（DEPLOYMENT.md）
- ✅ 归档 Railway/Render 相关文档
- ✅ 归档重复的中文部署文档
- ✅ 归档子域名设置完成记录
- ✅ 修复 Railway Prisma 构建错误

**主要改进**:
- 统一的部署流程文档
- 简化的文档结构（7个核心文档）
- 清晰的归档策略（21个历史文档）

---

## 📞 获取帮助

### 文档相关
- 本地开发问题 → [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
- 部署问题 → [DEPLOYMENT.md](./DEPLOYMENT.md)
- 运维问题 → [OPERATIONS.md](./OPERATIONS.md)

### 功能查找
- 功能实现记录 → [CHANGELOG.md](./CHANGELOG.md)
- 待实现功能 → [ROADMAP.md](./ROADMAP.md)
- 系统架构 → [Cohe-Capital-架构系统白皮书.md](./Cohe-Capital-架构系统白皮书.md)

---

## 📊 文档统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 核心文档 | 7 | 当前活跃的主要文档 |
| 归档文档 | 21 | 历史文档和已废弃方案 |
| 总行数 | 14,347 | docs/ 目录下所有文档 |

---

**维护者**: Cohe Capital 开发团队
**最后更新**: 2025-11-26
