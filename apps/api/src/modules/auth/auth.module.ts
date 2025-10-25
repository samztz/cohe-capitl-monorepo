/**
 * Authentication Module
 *
 * Configures Sign-In with Ethereum (SIWE) authentication for the application.
 * Provides JWT-based authentication using Passport.js strategy pattern.
 *
 * This module:
 * - Registers Passport with JWT as the default authentication strategy
 * - Provides AuthService for SIWE nonce generation and signature verification
 * - Exposes AuthController with /auth/siwe endpoints (nonce, verify, me)
 * - Exports JwtAuthGuard for protecting routes in other modules
 *
 * Usage in other modules:
 * ```typescript
 * import { JwtAuthGuard } from '@/modules/auth/jwt.guard';
 *
 * @Get('protected')
 * @UseGuards(JwtAuthGuard)
 * async protectedRoute(@Req() req: { user: AuthenticatedUser }) {
 *   // req.user contains { userId, address }
 * }
 * ```
 */

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt.guard';

/**
 * Authentication Module Configuration
 *
 * Imports:
 * - PrismaModule: For database access to User table
 * - PassportModule: Configured with 'jwt' as default strategy
 *
 * Controllers:
 * - AuthController: Handles /auth/siwe/* endpoints
 *
 * Providers:
 * - AuthService: Core SIWE authentication logic
 * - JwtStrategy: Passport strategy for validating JWT tokens
 * - JwtAuthGuard: Guard for protecting routes (exported for use in other modules)
 *
 * Exports:
 * - JwtAuthGuard: Can be used by other modules to protect their routes
 */
@Module({
  imports: [PrismaModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
