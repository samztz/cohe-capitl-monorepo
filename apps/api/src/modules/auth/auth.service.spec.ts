import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SiweMessage } from 'siwe';

// Mock SIWE module
jest.mock('siwe');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    jest.clearAllMocks();

    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('requestNonce', () => {
    it('should generate and store nonce for wallet address', async () => {
      const walletAddress = '0xAbC1234567890123456789012345678901234567' as `0x${string}`;
      const mockNonce = 'test-nonce-uuid';

      mockPrismaService.user.upsert.mockResolvedValue({
        id: 'user-id',
        walletAddress: walletAddress.toLowerCase(),
        nonce: mockNonce,
        email: null,
        createdAt: new Date(),
        lastLoginAt: null,
      });

      const result = await service.requestNonce(walletAddress);

      expect(result).toHaveProperty('nonce');
      expect(typeof result.nonce).toBe('string');
      expect(mockPrismaService.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { walletAddress: walletAddress.toLowerCase() },
          create: expect.objectContaining({
            walletAddress: walletAddress.toLowerCase(),
          }),
          update: expect.objectContaining({
            nonce: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('verifySignature', () => {
    const mockAddress = '0xabc1234567890123456789012345678901234567';
    const mockNonce = 'test-nonce-123';
    const mockMessage = `example.com wants you to sign in with your Ethereum account:
${mockAddress}

Sign in with Ethereum

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: ${mockNonce}
Issued At: 2024-01-01T00:00:00.000Z`;
    const mockSignature = '0x' + '1'.repeat(130);

    it('should return token and address for valid signature', async () => {
      const mockUser = {
        id: 'user-id',
        walletAddress: mockAddress,
        nonce: mockNonce,
        email: null,
        createdAt: new Date(),
        lastLoginAt: null,
      };

      // Mock SiweMessage constructor and verify method
      const mockVerify = jest.fn().mockResolvedValue({ success: true });
      (SiweMessage as jest.MockedClass<typeof SiweMessage>).mockImplementation(
        () =>
          ({
            address: mockAddress,
            nonce: mockNonce,
            verify: mockVerify,
          }) as any,
      );

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        nonce: 'new-nonce',
        lastLoginAt: new Date(),
      });

      const result = await service.verifySignature(mockMessage, mockSignature);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('address', mockAddress);
      expect(typeof result.token).toBe('string');
      expect(mockVerify).toHaveBeenCalledWith({ signature: mockSignature });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { walletAddress: mockAddress },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { walletAddress: mockAddress },
        data: {
          nonce: expect.any(String),
          lastLoginAt: expect.any(Date),
        },
      });
    });

    it('should throw BadRequestException for invalid SIWE message format', async () => {
      (SiweMessage as jest.MockedClass<typeof SiweMessage>).mockImplementation(
        () => {
          throw new Error('Invalid message');
        },
      );

      await expect(
        service.verifySignature('invalid message', mockSignature),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifySignature('invalid message', mockSignature),
      ).rejects.toThrow('Invalid SIWE message format');
    });

    it('should throw BadRequestException for invalid signature', async () => {
      const mockVerify = jest.fn().mockResolvedValue({ success: false });
      (SiweMessage as jest.MockedClass<typeof SiweMessage>).mockImplementation(
        () =>
          ({
            address: mockAddress,
            nonce: mockNonce,
            verify: mockVerify,
          }) as any,
      );

      await expect(
        service.verifySignature(mockMessage, mockSignature),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifySignature(mockMessage, mockSignature),
      ).rejects.toThrow('Invalid signature');
    });

    it('should throw BadRequestException when user not found', async () => {
      const mockVerify = jest.fn().mockResolvedValue({ success: true });
      (SiweMessage as jest.MockedClass<typeof SiweMessage>).mockImplementation(
        () =>
          ({
            address: mockAddress,
            nonce: mockNonce,
            verify: mockVerify,
          }) as any,
      );

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verifySignature(mockMessage, mockSignature),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifySignature(mockMessage, mockSignature),
      ).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException for nonce mismatch', async () => {
      const mockUser = {
        id: 'user-id',
        walletAddress: mockAddress,
        nonce: 'different-nonce',
        email: null,
        createdAt: new Date(),
        lastLoginAt: null,
      };

      const mockVerify = jest.fn().mockResolvedValue({ success: true });
      (SiweMessage as jest.MockedClass<typeof SiweMessage>).mockImplementation(
        () =>
          ({
            address: mockAddress,
            nonce: mockNonce,
            verify: mockVerify,
          }) as any,
      );

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.verifySignature(mockMessage, mockSignature),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifySignature(mockMessage, mockSignature),
      ).rejects.toThrow('Nonce mismatch');
    });

    it('should throw Error when JWT_SECRET is not configured', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const mockUser = {
        id: 'user-id',
        walletAddress: mockAddress,
        nonce: mockNonce,
        email: null,
        createdAt: new Date(),
        lastLoginAt: null,
      };

      const mockVerify = jest.fn().mockResolvedValue({ success: true });
      (SiweMessage as jest.MockedClass<typeof SiweMessage>).mockImplementation(
        () =>
          ({
            address: mockAddress,
            nonce: mockNonce,
            verify: mockVerify,
          }) as any,
      );

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.verifySignature(mockMessage, mockSignature),
      ).rejects.toThrow('JWT_SECRET not configured');

      // Restore JWT_SECRET
      process.env.JWT_SECRET = originalSecret;
    });
  });
});
