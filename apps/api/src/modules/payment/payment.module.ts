/**
 * Payment Module
 *
 * Handles payment confirmation with on-chain verification.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BlockchainService } from './blockchain.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentController],
  providers: [PaymentService, BlockchainService],
  exports: [PaymentService],
})
export class PaymentModule {}
