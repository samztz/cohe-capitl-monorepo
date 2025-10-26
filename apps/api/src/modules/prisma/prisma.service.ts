/**
 * Prisma Service
 *
 * Wrapper around Prisma Client that integrates with NestJS lifecycle.
 * Provides type-safe database access with automatic connection management.
 *
 * This service:
 * - Extends the generated Prisma Client from the schema
 * - Implements NestJS OnModuleDestroy for graceful shutdown
 * - Handles database disconnection on application shutdown
 *
 * The Prisma Client is generated from the schema at:
 * apps/api/prisma/schema.prisma
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * export class AuthService {
 *   constructor(private readonly prisma: PrismaService) {}
 *
 *   async findUser(address: string) {
 *     return this.prisma.user.findUnique({
 *       where: { walletAddress: address }
 *     });
 *   }
 * }
 * ```
 */

import { INestApplication, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client';

/**
 * Prisma Service
 *
 * NestJS-integrated database client with lifecycle management.
 * Automatically connects on application start and disconnects on shutdown.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  /**
   * Enable graceful shutdown hooks
   *
   * Registers a listener for Prisma's 'beforeExit' event to ensure
   * the NestJS application closes properly when Prisma disconnects.
   * This is typically called in main.ts during application setup.
   *
   * @param app - NestJS application instance
   */
  async enableShutdownHooks(app: INestApplication): Promise<void> {
    // Type assertion needed due to Prisma Client types
    (this.$on as any)('beforeExit', async () => {
      await app.close();
    });
  }

  /**
   * Cleanup on module destruction
   *
   * Called automatically by NestJS when the application shuts down.
   * Ensures database connections are properly closed to prevent
   * connection leaks and allow graceful shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
