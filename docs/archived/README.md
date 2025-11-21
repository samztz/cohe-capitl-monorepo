# 🗄️ Archived Documentation

This directory contains **historical and process-oriented documentation** that has been archived but preserved for reference.

**Purpose**: These documents record the project's evolution, past decisions, and detailed debugging processes. They are **read-only** and should not be modified unless adding new historical records.

---

## 📂 Archived Files

### Deployment & Infrastructure

| File | Date | Description | Merged Into |
|------|------|-------------|-------------|
| **DEPLOYMENT_GUIDE.md** | 2025-01-19 | Complete deployment guide with testing checklist | [DEPLOYMENT.md](../DEPLOYMENT.md) |
| **DOCKER_PRODUCTION_HARDENING.md** | 2025-01-19 | Production security hardening guide | [DEPLOYMENT.md](../DEPLOYMENT.md) (Chapter: Production Hardening) |
| **QUICK_START_LOCAL_DOCKER.md** | 2025-01-19 | Quick start guide for local Docker setup | [LOCAL_DEVELOPMENT.md](../LOCAL_DEVELOPMENT.md) |
| **DOCKER_TESTING_GUIDE.md** | 2025-01-19 | Docker testing and validation guide | [LOCAL_DEVELOPMENT.md](../LOCAL_DEVELOPMENT.md) (Validation section) |

### Development Process Records

| File | Date | Description | Reference |
|------|------|-------------|-----------|
| **DEPLOYMENT_SCRIPTS_IMPROVEMENTS.md** | 2024-11-XX | History of deployment script enhancements | Historical record of script evolution |
| **DOCKER_FIXES_SUMMARY.md** | 2024-11-XX | Summary of Docker configuration fixes | Debugging notes for Docker setup |
| **DOCKER_FIXES_ROUND2.md** | 2024-11-XX | Second round of Docker troubleshooting | Additional Docker issue resolution |
| **DOCKER_BUILD_FIXES.md** | 2025-01-20 | Docker build TypeScript compilation errors and fixes | Third round of Docker troubleshooting (tsconfig, skipLibCheck, public dir) |

### Project Overview & Demo

| File | Date | Description | Updated To |
|------|------|-------------|-----------|
| **PROJECT_BRIEF.md** | 2025-01-20 | Original project brief and highlights | [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) |
| **PROJECT_DEMO_GUIDE.md** | 2024-11-XX | Early demo presentation guide | Integrated into PROJECT_OVERVIEW.md |

### Security & Audit

| File | Date | Description | Status |
|------|------|-------------|--------|
| **SIWE_LOGIN_AUDIT_REPORT.md** | 2024-11-XX | Comprehensive SIWE authentication security audit | Complete audit report |

### Development Resources

| File | Date | Description | Purpose |
|------|------|-------------|---------|
| **PROMPTS.md** | 2024-11-XX | AI collaboration prompts and instructions | Internal development reference |

### Payment & Testing

| File | Date | Description | Status |
|------|------|-------------|--------|
| **PAYMENT_INTEGRATION_STATUS.md** | 2024-10-XX | Payment integration status and notes | Historical progress tracker |
| **TESTING_REPEAT_PURCHASES.md** | 2024-10-XX | Testing guide for repeat purchase scenarios | Testing documentation |

---

## 📌 When to Use Archived Docs

### ✅ Use archived docs when:

- **Understanding historical decisions**: "Why was this approach chosen?"
- **Debugging similar issues**: "Has this problem occurred before?"
- **Learning from past mistakes**: "What went wrong last time?"
- **Onboarding new team members**: "How did we get here?"

### ❌ Do NOT use archived docs for:

- **Current development**: Use SSoT docs in `docs/` instead
- **Deployment operations**: Refer to [DEPLOYMENT.md](../DEPLOYMENT.md)
- **Local development setup**: Refer to [LOCAL_DEVELOPMENT.md](../LOCAL_DEVELOPMENT.md)

---

**Last Updated**: 2025-01-20
