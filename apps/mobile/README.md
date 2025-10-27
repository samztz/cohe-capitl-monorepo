# Cohe Capital Mobile App

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
EXPO_PUBLIC_API_BASE=http://localhost:3001
EXPO_PUBLIC_CHAIN_ID=97
```

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
