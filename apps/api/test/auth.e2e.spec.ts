import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { Wallet } from 'ethers';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Auth SIWE Flow (e2e)', () => {
  let app: NestFastifyApplication;
  let prismaService: PrismaService;

  // Fixed wallet for testing
  const TEST_PRIVATE_KEY =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new Wallet(TEST_PRIVATE_KEY);
  const walletAddress = wallet.address.toLowerCase();

  beforeAll(async () => {
    // Set test environment variables
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup: delete test user
    try {
      await prismaService.user.delete({
        where: { walletAddress },
      });
    } catch {
      // Ignore if user doesn't exist
    }

    await app.close();
  });

  describe('Full SIWE authentication flow', () => {
    let nonce: string;
    let token: string;

    it('should request a nonce for wallet address', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/siwe/nonce')
        .send({ walletAddress: wallet.address })
        .expect(201);

      expect(response.body).toHaveProperty('nonce');
      expect(typeof response.body.nonce).toBe('string');
      expect(response.body.nonce.length).toBeGreaterThan(0);

      nonce = response.body.nonce;
    });

    it('should verify signature and return JWT token', async () => {
      // Build SIWE message string manually following EIP-4361 spec
      const message = `localhost wants you to sign in with your Ethereum account:
${wallet.address}

URI: http://localhost:3001
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

      // Sign with wallet
      const signature = await wallet.signMessage(message);

      // Verify signature
      const response = await request(app.getHttpServer())
        .post('/auth/siwe/verify')
        .send({ message, signature })
        .expect(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('address');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.address).toBe(walletAddress);

      token = response.body.token;
    });

    it('should access protected /me endpoint with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/siwe/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('address');
      expect(typeof response.body.userId).toBe('string');
      expect(response.body.address).toBe(walletAddress);
    });
  });

  describe('Error scenarios', () => {
    it('should return 400 for invalid wallet address format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/siwe/nonce')
        .send({ walletAddress: 'invalid-address' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for nonce mismatch', async () => {
      // First, get a valid nonce
      const nonceResponse = await request(app.getHttpServer())
        .post('/auth/siwe/nonce')
        .send({ walletAddress: wallet.address })
        .expect(201);

      const validNonce = nonceResponse.body.nonce;

      // Build SIWE message with WRONG nonce
      const wrongNonce = '00000000-0000-0000-0000-000000000000';
      const message = `localhost wants you to sign in with your Ethereum account:
${wallet.address}

URI: http://localhost:3001
Version: 1
Chain ID: 1
Nonce: ${wrongNonce}
Issued At: ${new Date().toISOString()}`;

      const signature = await wallet.signMessage(message);

      // Try to verify with wrong nonce
      const response = await request(app.getHttpServer())
        .post('/auth/siwe/verify')
        .send({ message, signature })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/nonce/i);
    });

    it('should return 400 for invalid signature', async () => {
      // Get a valid nonce
      const nonceResponse = await request(app.getHttpServer())
        .post('/auth/siwe/nonce')
        .send({ walletAddress: wallet.address })
        .expect(201);

      const validNonce = nonceResponse.body.nonce;

      // Build valid SIWE message
      const message = `localhost wants you to sign in with your Ethereum account:
${wallet.address}

URI: http://localhost:3001
Version: 1
Chain ID: 1
Nonce: ${validNonce}
Issued At: ${new Date().toISOString()}`;

      // Use INVALID signature
      const invalidSignature = '0x' + '0'.repeat(130);

      const response = await request(app.getHttpServer())
        .post('/auth/siwe/verify')
        .send({ message, signature: invalidSignature })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for accessing /me without token', async () => {
      await request(app.getHttpServer()).get('/auth/siwe/me').expect(401);
    });

    it('should return 401 for accessing /me with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/siwe/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });

    it('should return 401 for accessing /me with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/siwe/me')
        .set('Authorization', 'NotBearer token')
        .expect(401);
    });
  });

  describe('Independent test: Full flow with fresh wallet', () => {
    it('should complete full SIWE flow independently', async () => {
      // Use a different wallet to ensure test independence
      const freshWallet = Wallet.createRandom();
      const freshAddress = freshWallet.address.toLowerCase();

      try {
        // Step 1: Request nonce
        const nonceRes = await request(app.getHttpServer())
          .post('/auth/siwe/nonce')
          .send({ walletAddress: freshWallet.address })
          .expect(201);

        expect(nonceRes.body).toHaveProperty('nonce');
        const nonce = nonceRes.body.nonce;

        // Step 2: Build and sign SIWE message
        const message = `localhost wants you to sign in with your Ethereum account:
${freshWallet.address}

URI: http://localhost:3001
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

        const signature = await freshWallet.signMessage(message);

        // Step 3: Verify and get token
        const verifyRes = await request(app.getHttpServer())
          .post('/auth/siwe/verify')
          .send({ message, signature })
          .expect(201);

        expect(verifyRes.body).toHaveProperty('token');
        expect(verifyRes.body.address).toBe(freshAddress);
        const token = verifyRes.body.token;

        // Step 4: Access protected endpoint
        const meRes = await request(app.getHttpServer())
          .get('/auth/siwe/me')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(meRes.body).toHaveProperty('userId');
        expect(meRes.body.address).toBe(freshAddress);

        // Cleanup
        await prismaService.user.delete({
          where: { walletAddress: freshAddress },
        });
      } catch (error) {
        // Cleanup on error
        try {
          await prismaService.user.delete({
            where: { walletAddress: freshAddress },
          });
        } catch {
          // Ignore cleanup errors
        }
        throw error;
      }
    });
  });
});
