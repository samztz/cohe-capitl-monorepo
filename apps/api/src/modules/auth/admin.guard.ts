/**
 * Admin Authentication Guard
 *
 * Simple guard for admin-only endpoints.
 * Validates a hardcoded admin token for development/demo purposes.
 *
 * ⚠️ WARNING: This is for DEMO purposes only!
 * In production, implement proper admin authentication:
 * - Use separate admin JWT tokens
 * - Store admin credentials securely
 * - Implement role-based access control (RBAC)
 * - Use MFA for admin access
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  /**
   * Validate admin token from Authorization header
   *
   * Checks if the Bearer token matches the configured admin token.
   * In production, this should be replaced with proper JWT validation.
   *
   * @param context - Execution context
   * @returns true if valid admin token, throws UnauthorizedException otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization type');
    }

    // Get admin token from environment or use demo token
    const validAdminToken =
      process.env.ADMIN_TOKEN || 'demo-admin-token';

    if (token !== validAdminToken) {
      throw new UnauthorizedException('Invalid admin token');
    }

    // Attach mock admin user to request
    request.user = {
      userId: 'admin',
      email: 'admin@cohe.capital',
      role: 'admin',
    };

    return true;
  }
}
