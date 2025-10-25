# E2E Tests

## Prerequisites

Before running e2e tests, ensure the following:

1. **Database is running**: The tests require a PostgreSQL database
   ```bash
   docker compose up -d postgres
   ```

2. **Database URL is configured**: Set `DATABASE_URL` in your `.env` file or environment
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/test_db
   ```

3. **Prisma migrations are applied**:
   ```bash
   pnpm --filter api prisma:migrate
   ```

## Running Tests

### Unit Tests
```bash
pnpm --filter api test
```

### E2E Tests
```bash
pnpm --filter api test:e2e
```

### All Tests
```bash
pnpm --filter api test && pnpm --filter api test:e2e
```

## E2E Test Structure

### `auth.e2e.spec.ts`
Tests the complete SIWE authentication flow:

1. **Full SIWE Flow**
   - Request nonce for wallet address
   - Sign SIWE message with ethers.Wallet
   - Verify signature and receive JWT token
   - Access protected `/me` endpoint with token

2. **Error Scenarios**
   - Invalid wallet address format → 400
   - Nonce mismatch → 400
   - Invalid signature → 400
   - Unauthorized access to `/me` → 401
   - Invalid token → 401
   - Malformed authorization header → 401

3. **Independent Test**
   - Complete flow with fresh random wallet to ensure test independence

## Test Wallet

The tests use a fixed test wallet for predictable testing:
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

This is the first Hardhat/Anvil default test account and is safe to use in test environments.

## Notes

- Tests run sequentially (`--runInBand`) to avoid database conflicts
- Tests automatically clean up created users after completion
- JWT_SECRET is set to a test value during e2e tests
