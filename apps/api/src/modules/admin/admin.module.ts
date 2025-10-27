/**
 * Admin Module
 *
 * Provides admin policy review functionality.
 * Exports controllers and services for policy management.
 */

import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Admin module for policy review operations
 *
 * Features:
 * - List policies with pagination and filtering
 * - Approve/reject policies under review
 * - Automatic coverage period calculation
 */
@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
