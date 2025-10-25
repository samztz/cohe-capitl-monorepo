import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthService = {
    findUserByAddress: jest.fn(),
  };

  beforeEach(async () => {
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    const mockAddress = '0xabc1234567890123456789012345678901234567';

    it('should return user data when user exists', async () => {
      const mockUser = {
        id: 'user-id-123',
        walletAddress: mockAddress,
      };

      mockAuthService.findUserByAddress.mockResolvedValue(mockUser);

      const result = await strategy.validate({ address: mockAddress });

      expect(result).toEqual({
        userId: 'user-id-123',
        address: mockAddress,
      });
      expect(mockAuthService.findUserByAddress).toHaveBeenCalledWith(
        mockAddress,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockAuthService.findUserByAddress.mockResolvedValue(null);

      await expect(strategy.validate({ address: mockAddress })).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate({ address: mockAddress })).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('constructor', () => {
    it('should throw error when JWT_SECRET is not configured', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => {
        new JwtStrategy(authService);
      }).toThrow('JWT_SECRET not configured');

      process.env.JWT_SECRET = originalSecret;
    });
  });
});
