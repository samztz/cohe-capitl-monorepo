/**
 * E2E Tests for Policy Creation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Wallet } from 'ethers';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('PolicyController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Hardhat test account #0
  const TEST_PRIVATE_KEY =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const wallet = new Wallet(TEST_PRIVATE_KEY);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Set test JWT secret
    process.env.JWT_SECRET = 'supersecret123';
  });

  afterAll(async () => {
    // Cleanup: Delete test user and their policies
    await prisma.policy.deleteMany({
      where: { walletAddress: wallet.address.toLowerCase() },
    });
    await prisma.user.delete({
      where: { walletAddress: wallet.address.toLowerCase() },
    }).catch(() => {});

    await app.close();
  });

  describe('POST /policy', () => {
    let jwtToken: string;
    let skuId: string;

    beforeAll(async () => {
      // 1. Get nonce
      const nonceRes = await request(app.getHttpServer())
        .post('/auth/siwe/nonce')
        .send({ walletAddress: wallet.address });

      const nonce = nonceRes.body.nonce;

      // 2. Create and sign SIWE message
      const message = `localhost wants you to sign in with your Ethereum account:
${wallet.address}

URI: http://localhost:3001
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

      const signature = await wallet.signMessage(message);

      // 3. Verify and get JWT
      const verifyRes = await request(app.getHttpServer())
        .post('/auth/siwe/verify')
        .send({ message, signature });

      jwtToken = verifyRes.body.token;

      // 4. Get SKU ID
      const productsRes = await request(app.getHttpServer()).get('/products');
      skuId = productsRes.body[0].id;
    });

    it('should create a policy successfully (first attempt)', async () => {
      const response = await request(app.getHttpServer())
        .post('/policy')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ skuId })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.skuId).toBe(skuId);
      expect(response.body.walletAddress).toBe(wallet.address.toLowerCase());
      expect(response.body.status).toBe('pending');
      expect(response.body).toHaveProperty('premiumAmt');
    });

    it('should return 409 Conflict when creating duplicate policy', async () => {
      const response = await request(app.getHttpServer())
        .post('/policy')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ skuId })
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should return 401 Unauthorized without JWT token', async () => {
      await request(app.getHttpServer())
        .post('/policy')
        .send({ skuId })
        .expect(401);
    });

    it('should return 400 Bad Request with invalid skuId', async () => {
      await request(app.getHttpServer())
        .post('/policy')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ skuId: '' })
        .expect(400);
    });

    it('should return 404 Not Found with non-existent skuId', async () => {
      await request(app.getHttpServer())
        .post('/policy')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ skuId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });
  });
});
