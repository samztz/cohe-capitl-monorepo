/**
 * JWT Authentication Guard
 *
 * Protects routes by requiring a valid JWT token in the Authorization header.
 * Uses the JwtStrategy to validate tokens and attach user information to requests.
 *
 * Usage:
 * ```typescript
 * @Get('protected')
 * @UseGuards(JwtAuthGuard)
 * async getProtectedResource(@Req() req: { user: AuthenticatedUser }) {
 *   // req.user contains { userId, address }
 * }
 * ```
 */

import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * JWT Authentication Guard
 *
 * Extends Passport's AuthGuard to use the 'jwt' strategy.
 * When applied to a route, it:
 * 1. Extracts JWT token from Authorization header
 * 2. Verifies token signature and expiration
 * 3. Calls JwtStrategy.validate() to retrieve user info
 * 4. Attaches user info to request.user
 * 5. Returns 401 Unauthorized if any step fails
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Determine if the request should be allowed
   *
   * Invokes the JWT authentication strategy to validate the token.
   * This method is called automatically by NestJS when the guard is applied.
   *
   * @param context - Execution context containing request information
   * @returns true if authentication succeeds, false or throws UnauthorizedException otherwise
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}
