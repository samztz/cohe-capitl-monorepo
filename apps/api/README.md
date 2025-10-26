# Cohe Capital API

NestJS-based REST API for the Cohe Capital Web3 insurance platform with Sign-In with Ethereum (SIWE) authentication.

## 🚀 Quick Start (10 minutes)

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file to the monorepo root:

```bash
# From monorepo root
cp apps/api/.env.example .env
```

Edit `.env` and update at minimum:
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `DATABASE_URL` - Should match your PostgreSQL credentials

### 3. Start PostgreSQL Database

From the monorepo root:

```bash
docker compose -f infra/docker/docker-compose.yml up -d db
```

Verify the database is running:

```bash
docker compose -f infra/docker/docker-compose.yml ps
```

### 4. Run Database Migrations

```bash
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
```

This will:
- Generate Prisma Client types
- Create/update database schema
- Apply all migrations

### 5. Start the API

Development mode with hot reload:

```bash
pnpm --filter api dev
```

The API will be available at: `http://localhost:3001`

### 6. Verify Installation

Health check:

```bash
curl http://localhost:3001
```

Request a SIWE nonce:

```bash
curl -X POST http://localhost:3001/auth/siwe/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}'
```

Expected response:
```json
{
  "nonce": "uuid-v4-string"
}
```

---

## 📚 Development Guide

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm --filter api dev` | Start development server with hot reload |
| `pnpm --filter api build` | Build for production |
| `pnpm --filter api start` | Start production server |
| `pnpm --filter api test` | Run unit tests |
| `pnpm --filter api test:watch` | Run tests in watch mode |
| `pnpm --filter api test:e2e` | Run end-to-end tests |
| `pnpm --filter api test:cov` | Run tests with coverage |

### Prisma & Database Scripts

| Script | Description |
|--------|-------------|
| `pnpm --filter api prisma:generate` | Generate Prisma Client |
| `pnpm --filter api prisma:migrate` | Create and apply migrations (dev) |
| `pnpm --filter api prisma:deploy` | Apply migrations (production) |
| `pnpm --filter api prisma:studio` | Open Prisma Studio (DB GUI) |

### Project Structure

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/              # SIWE authentication
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt.guard.ts
│   │   └── prisma/            # Database client
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── test/                      # E2E tests
└── dist/                      # Build output
```

### Tech Stack

- **Framework**: NestJS 11 + Fastify
- **Database**: PostgreSQL 16 + Prisma ORM
- **Authentication**: JWT + Sign-In with Ethereum (SIWE)
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Jest + Supertest

---

## 🔐 Authentication Flow

### SIWE (Sign-In with Ethereum) Process

1. **Request Nonce**
   ```
   POST /auth/siwe/nonce
   Body: { "walletAddress": "0x..." }
   Response: { "nonce": "uuid" }
   ```

2. **Sign Message** (Client-side)
   ```typescript
   import { SiweMessage } from 'siwe';
   import { Wallet } from 'ethers';

   const siweMessage = new SiweMessage({
     domain: 'localhost',
     address: wallet.address,
     uri: 'http://localhost:3001',
     version: '1',
     chainId: 1,
     nonce: receivedNonce,
   });

   const message = siweMessage.prepareMessage();
   const signature = await wallet.signMessage(message);
   ```

3. **Verify Signature & Get JWT**
   ```
   POST /auth/siwe/verify
   Body: {
     "message": "SIWE message string",
     "signature": "0x..."
   }
   Response: {
     "token": "jwt-token",
     "address": "0x..."
   }
   ```

4. **Access Protected Endpoints**
   ```
   GET /auth/siwe/me
   Headers: { "Authorization": "Bearer jwt-token" }
   Response: {
     "userId": "uuid",
     "address": "0x..."
   }
   ```

### JWT Configuration

- **Token Lifetime**: 15 minutes
- **Payload**: `{ address: string }`
- **Secret**: Set via `JWT_SECRET` environment variable

---

## 🗄️ Database Management

### View Database

Open Prisma Studio (visual database browser):

```bash
pnpm --filter api prisma:studio
```

Navigate to: `http://localhost:5555`

### Create a Migration

After modifying `prisma/schema.prisma`:

```bash
pnpm --filter api prisma:migrate
```

Prisma will:
1. Generate SQL migration files
2. Apply changes to the database
3. Regenerate Prisma Client

### Reset Database

⚠️ **WARNING**: This will delete all data!

```bash
docker compose -f infra/docker/docker-compose.yml down -v
docker compose -f infra/docker/docker-compose.yml up -d db
pnpm --filter api prisma:migrate
```

### Backup Database

```bash
docker exec cohe-capital-postgres pg_dump -U postgres cohe_capital_dev > backup.sql
```

### Restore Database

```bash
docker exec -i cohe-capital-postgres psql -U postgres cohe_capital_dev < backup.sql
```

---

## 🧪 Testing

### Run All Tests

```bash
# Unit tests
pnpm --filter api test

# E2E tests (requires running database)
pnpm --filter api test:e2e

# All tests with coverage
pnpm --filter api test:cov
```

### E2E Test Setup

E2E tests require a running PostgreSQL database. See `test/README.md` for details.

The tests cover:
- Complete SIWE authentication flow
- JWT token generation and validation
- Protected endpoint access
- Error scenarios (invalid signatures, nonce mismatch, etc.)

---

## 🌍 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `JWT_SECRET` | Secret for signing JWT tokens | Generate with `openssl rand -base64 32` |
| `SIWE_DOMAIN` | Domain for SIWE messages (no protocol) | `localhost` |
| `SIWE_URI` | Full URI of your application | `http://localhost:3001` |
| `SIWE_CHAIN_ID` | Ethereum chain ID | `1` (Mainnet), `56` (BSC), `5` (Goerli) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `HOST` | API server host | `0.0.0.0` |
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |

---

## 🚢 Deployment

### Production Build

```bash
pnpm --filter api build
```

### Run Production Server

```bash
# Apply migrations
pnpm --filter api prisma:deploy

# Start server
NODE_ENV=production pnpm --filter api start
```

### Environment Checklist

- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Configure proper `DATABASE_URL` with credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` to your frontend domain
- [ ] Update `SIWE_DOMAIN` and `SIWE_URI` to production values
- [ ] Set appropriate `SIWE_CHAIN_ID` for your network

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: `Error: P1001: Can't reach database server`

**Solutions**:
1. Verify PostgreSQL is running: `docker compose -f infra/docker/docker-compose.yml ps`
2. Check `DATABASE_URL` in `.env`
3. Restart database: `docker compose -f infra/docker/docker-compose.yml restart db`

### Prisma Client Errors

**Problem**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
pnpm --filter api prisma:generate
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solutions**:
1. Change `PORT` in `.env`
2. Kill process using port 3001:
   ```bash
   # Find process
   lsof -i :3001
   # Kill it
   kill -9 <PID>
   ```

### Migration Conflicts

**Problem**: Migration file conflicts or schema drift

**Solution**:
```bash
# Reset migrations (development only!)
rm -rf prisma/migrations
pnpm --filter api prisma:migrate
```

---

## 📖 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Sign-In with Ethereum](https://docs.login.xyz/)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)

---

## 🤝 Contributing

1. Follow the coding standards in `CODEX.md`
2. Write tests for new features
3. Update documentation as needed
4. Use conventional commits

---

## 📝 License

ISC
