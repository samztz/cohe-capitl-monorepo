# ⚠️ DEPRECATED - Cohe Capital Mobile App

> **项目已废弃**: 本 Mobile 端（React Native）已暂停开发，项目已转向 **Web 端**（Next.js 14）。
>
> **请使用**: [apps/web/](../web/) - Next.js 14 Web DApp
>
> **原因**: Web 端更易于开发和部署，用户可直接通过浏览器访问，无需下载 APP。
>
> **代码保留**: 此目录仅作为参考保留，不再维护。部分功能（如 SIWE 登录、钱包连接）已成功迁移至 Web 端。

---

React Native mobile application for Cohe Capital Web3 Insurance platform built with Expo.

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation (Native Stack)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **UI Library**: React Native Paper
- **Date Handling**: Day.js

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
# API Configuration
EXPO_PUBLIC_API_BASE=http://localhost:3001

# SIWE (Sign-In with Ethereum) Configuration
EXPO_PUBLIC_SIWE_DOMAIN=localhost
EXPO_PUBLIC_SIWE_URI=http://localhost:3001

# Blockchain Configuration
EXPO_PUBLIC_CHAIN_ID=97  # BSC Testnet (56 for Mainnet)
```

**Environment Variables Explained**:
- `EXPO_PUBLIC_API_BASE`: Backend API base URL
- `EXPO_PUBLIC_SIWE_DOMAIN`: Domain used in SIWE message (should match backend expectation)
- `EXPO_PUBLIC_SIWE_URI`: URI used in SIWE message (typically same as API base)
- `EXPO_PUBLIC_CHAIN_ID`: Blockchain network chain ID (97 for BSC Testnet)

## Development

Start the Expo development server:

```bash
# Using pnpm workspace
pnpm --filter mobile dev

# Or directly
npm run dev
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app for physical device

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── navigation/     # Navigation configuration
├── hooks/          # Custom React hooks
├── services/       # API service layer
├── store/          # Zustand stores
├── utils/          # Utility functions
└── types/          # TypeScript type definitions
```

## Scripts

- `pnpm --filter mobile dev` - Start Expo dev server
- `pnpm --filter mobile android` - Run on Android
- `pnpm --filter mobile ios` - Run on iOS
- `pnpm --filter mobile web` - Run in web browser

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_BASE` | Backend API URL | `http://localhost:3001` |
| `EXPO_PUBLIC_CHAIN_ID` | Blockchain Chain ID | `97` (BSC Testnet) |

## Features (Planned)

- [ ] Wallet connection (WalletConnect / MetaMask)
- [ ] Product catalog browsing
- [ ] Policy purchase flow
- [ ] Contract signing
- [ ] Payment processing
- [ ] Policy status tracking
- [ ] Countdown timer for active policies
