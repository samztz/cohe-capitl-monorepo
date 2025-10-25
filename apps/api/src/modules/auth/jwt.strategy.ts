/**
 * JWT Authentication Strategy
 *
 * Implements Passport JWT strategy for validating and extracting user information
 * from JWT tokens. This strategy is automatically used by JwtAuthGuard to protect
 * endpoints requiring authentication.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

/** Ethereum address type alias (0x + 40 hex characters) */
type Address = `0x${string}`;

/**
 * JWT payload structure
 * Contains the wallet address embedded in the JWT token
 */
interface JwtPayload {
  address: string;
}

/**
 * Authenticated user information
 * Attached to the request object after successful JWT validation
 */
export interface AuthenticatedUser {
  userId: string;
  address: Address;
}

/**
 * JWT Strategy for Passport authentication
 *
 * Configures how JWT tokens are extracted from requests and validated.
 * On successful validation, attaches user information to the request object.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Initialize JWT strategy with configuration
   *
   * Configures the strategy to:
   * - Extract JWT from Authorization header (Bearer token)
   * - Reject expired tokens
   * - Verify signature using JWT_SECRET
   *
   * @param authService - Service for user lookup and validation
   * @throws Error if JWT_SECRET environment variable is not set
   */
  constructor(private readonly authService: AuthService) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract from "Authorization: Bearer <token>"
      ignoreExpiration: false, // Reject expired tokens
      secretOrKey: jwtSecret, // Secret used to verify token signature
    });
  }

  /**
   * Validate JWT payload and retrieve user information
   *
   * Called automatically by Passport after JWT signature is verified.
   * Looks up the user in the database using the wallet address from the token.
   * The returned user object is attached to the request as `req.user`.
   *
   * @param payload - Decoded JWT payload containing wallet address
   * @returns Authenticated user object with userId and address
   * @throws UnauthorizedException if user is not found in database
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authService.findUserByAddress(
      payload.address as Address,
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user info to be attached to request.user
    return {
      userId: user.id,
      address: user.walletAddress as Address,
    };
  }
}
