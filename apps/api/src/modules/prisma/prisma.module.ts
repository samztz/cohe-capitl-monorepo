/**
 * Prisma Module
 *
 * Global module that provides Prisma database client throughout the application.
 * The @Global decorator makes PrismaService available to all modules without
 * needing to import PrismaModule explicitly.
 *
 * This module:
 * - Registers PrismaService as a global provider
 * - Exports PrismaService for injection into other services
 * - Handles database connection lifecycle (connect on init, disconnect on destroy)
 *
 * Usage in other modules:
 * ```typescript
 * // No need to import PrismaModule in other modules
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly prisma: PrismaService) {}
 *
 *   async findUser(address: string) {
 *     return this.prisma.user.findUnique({ where: { walletAddress: address } });
 *   }
 * }
 * ```
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma Global Module Configuration
 *
 * @Global decorator: Makes PrismaService available to all modules without explicit imports
 *
 * Providers:
 * - PrismaService: Database client with lifecycle management
 *
 * Exports:
 * - PrismaService: Available for dependency injection in any module
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
