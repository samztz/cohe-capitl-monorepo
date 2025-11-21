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
- Nginx 反向代理配置
- 验证清单与健康检查
- 生产环境加固
- 回滚与运维命令

### 4. [⚙️ 运维指南](./OPERATIONS.md)
- 日志查看与分析
- 资源监控
- 数据库备份与恢复
- 证书续期
- 常见运维操作

### 5. [📝 变更日志](./CHANGELOG.md)
- 开发历史记录
- 功能迭代日志
- Bug 修复记录

### 6. [🗺️ 路线图](./ROADMAP.md)
- 当前进度 (71.6% 完成)
- Epic 状态追踪
- 下一步计划

---

## 📖 深入文档

### 架构与设计

- [🏗️ Cohe Capital 架构系统白皮书](./Cohe-Capital-架构系统白皮书.md)
  - **最全面的技术文档** (71,000+ 字)
  - 系统架构、业务流程、技术栈详解
  - 数据模型、安全设计、区块链集成
  - 适用于技术团队培训、投资者尽调、新人 onboarding

---

## 🗄️ 归档文档

以下文档记录了项目的演进历史和过程性知识，作为**只读参考**保留：

### [archived/ 目录](./archived/)

- **部署脚本改进历史**
  - `DEPLOYMENT_SCRIPTS_IMPROVEMENTS.md`

- **Docker 问题修复记录**
  - `DOCKER_FIXES_SUMMARY.md`
  - `DOCKER_FIXES_ROUND2.md`

- **安全审计报告**
  - `SIWE_LOGIN_AUDIT_REPORT.md` (SIWE 登录安全审计)

- **开发内部资料**
  - `PROMPTS.md` (AI 协作提示词)
  - `PROJECT_DEMO_GUIDE.md` (早期演示指南)
  - `DOCKER_TESTING_GUIDE.md` (Docker 测试指南 - 已合并到 LOCAL_DEVELOPMENT.md)
  - `QUICK_START_LOCAL_DOCKER.md` (快速启动指南 - 已合并)
  - `DEPLOYMENT_GUIDE.md` (旧版部署指南 - 已合并)
  - `DOCKER_PRODUCTION_HARDENING.md` (生产加固指南 - 已合并)
  - `PROJECT_BRIEF.md` (项目简介 - 已合并到架构白皮书)
  - `PROJECT_OVERVIEW.md` (项目概览 - 内容与根 README.md 和架构白皮书重复，已归档)

---

## 🔗 快速链接

### 开发相关

- **本地快速启动**: `./setup-local-dev.sh`
- **API 文档 (Swagger)**: http://localhost:3001/api-docs (本地) / http://yourdomain.com/api-docs (生产)
- **健康检查**: http://localhost:3001/healthz (API 直连) / http://localhost/healthz (经 Nginx)
- **Prisma Studio**: `pnpm --filter api prisma:studio`

### 代码规范

- [CODEX.md](../CODEX.md) - 编码规范与最佳实践
- [CLAUDE.md](../CLAUDE.md) - AI 协作指南

### 项目根目录文档

- [README.md](../README.md) - 项目总览与快速开始
- [pnpm-workspace.yaml](../pnpm-workspace.yaml) - Monorepo 配置
- [turbo.json](../turbo.json) - 构建编排配置

---

## ❓ 常见问题

### 我应该从哪份文档开始？

| 角色 | 推荐文档 |
|------|---------|
| **新开发者** | 1. (根目录) README.md<br/>2. LOCAL_DEVELOPMENT.md<br/>3. CODEX.md |
| **DevOps 工程师** | 1. DEPLOYMENT.md<br/>2. OPERATIONS.md |
| **技术负责人** | 1. Cohe-Capital-架构系统白皮书.md<br/>2. ROADMAP.md |
| **产品经理** | 1. (根目录) README.md<br/>2. ROADMAP.md<br/>3. CHANGELOG.md |

### 文档有误或过时怎么办？

1. 检查文档顶部的 **最后更新时间**
2. 查看 [CHANGELOG.md](./CHANGELOG.md) 确认最新变更
3. 如发现不一致，请创建 GitHub Issue 报告

### 如何贡献文档？

1. **核心文档修改**: 直接编辑 SSoT 文档并提交 PR
2. **归档文档**: 不建议修改，如需记录新的过程性知识，创建新文件并添加到 `archived/`
3. **遵循原则**: 保持单一事实来源，避免信息重复

---

## 📊 文档统计

| 类别 | 文件数 | 说明 |
|------|--------|------|
| **核心文档 (SSoT)** | 6 | 必读文档 |
| **架构文档** | 1 | 架构白皮书 |
| **归档文档** | 10+ | 历史参考 |

**最后更新**: 2025-01-20

---

**© 2025 Cohe Capital. All rights reserved.**
