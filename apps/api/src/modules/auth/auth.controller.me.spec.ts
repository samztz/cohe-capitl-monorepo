import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { AuthenticatedUser } from './jwt.strategy';

describe('AuthController - GET /me', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    requestNonce: jest.fn(),
    verifySignature: jest.fn(),
    findUserByAddress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn((context) => {
          const request = context.switchToHttp().getRequest();
          // Simulate successful JWT authentication
          if (request.headers?.authorization === 'Bearer valid-token') {
            request.user = {
              userId: 'user-id-123',
              address: '0xabc1234567890123456789012345678901234567',
            };
            return true;
          }
          throw new UnauthorizedException();
        }),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should return user data when authenticated', async () => {
      const mockUser: AuthenticatedUser = {
        userId: 'user-id-123',
        address: '0xabc1234567890123456789012345678901234567',
      };

      const req = { user: mockUser };
      const result = await controller.getMe(req);

      expect(result).toEqual({
        userId: 'user-id-123',
        address: '0xabc1234567890123456789012345678901234567',
      });
    });

    it('should return correct userId and address format', async () => {
      const mockUser: AuthenticatedUser = {
        userId: 'another-user-id',
        address: '0x1234567890123456789012345678901234567890',
      };

      const req = { user: mockUser };
      const result = await controller.getMe(req);

      expect(result.userId).toBe('another-user-id');
      expect(result.address).toBe('0x1234567890123456789012345678901234567890');
      expect(result.address).toMatch(/^0x[a-f0-9]{40}$/i);
    });
  });
});
