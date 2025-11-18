/**
 * Policy Module
 *
 * Provides insurance policy management functionality.
 * Handles policy creation, validation, and lifecycle management.
 *
 * This module:
 * - Exposes authenticated endpoints for policy operations
 * - Enforces JWT authentication for all routes
 * - Validates policy creation requests with Zod
 * - Enforces unique constraint per wallet+SKU combination
 *
 * Authentication required for all endpoints.
 */

import { Module } from '@nestjs/common';
import { PolicyController } from './policy.controller';
import { PolicyService } from './policy.service';
import { SignatureStorageService } from './signature-storage.service';
import { AuthModule } from '../auth/auth.module';

/**
 * Policy Module Configuration
 *
 * Controllers:
 * - PolicyController: Handles POST /policy (JWT-protected)
 *
 * Providers:
 * - PolicyService: Business logic for policy creation
 * - SignatureStorageService: Handles signature image storage
 *
 * Dependencies:
 * - PrismaModule: Automatically available (global module)
 * - AuthModule: Provides JwtAuthGuard for route protection
 */
@Module({
  imports: [AuthModule],
  controllers: [PolicyController],
  providers: [PolicyService, SignatureStorageService],
  exports: [PolicyService],
})
export class PolicyModule {}
