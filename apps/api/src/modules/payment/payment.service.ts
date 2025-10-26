/**
 * Payment Service
 *
 * Business logic for payment confirmation with on-chain verification.
 * Handles payment upsert and policy status updates.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from './blockchain.service';

/**
 * Payment entity with string amounts for JSON serialization
 */
export interface Payment {
  id: string;
  policyId: string;
  txHash: string;
  chainId: number;
  tokenAddress: string;
  fromAddress: string;
  toAddress: string;
  amount: string; // Decimal as string
  confirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Confirm payment input
 */
export interface ConfirmPaymentInput {
  policyId: string;
  txHash: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
  ) {}

  /**
   * Confirm payment with on-chain verification
   *
   * Process:
   * 1. Load policy and SKU
   * 2. Verify transaction on-chain
   * 3. Validate token, from, to, amount
   * 4. Upsert payment record
   * 5. Update policy status to "under_review"
   *
   * @param input - Confirmation data (policyId, txHash)
   * @returns Confirmed payment record
   * @throws NotFoundException if policy/SKU not found
   * @throws BadRequestException if verification fails
   */
  async confirmPayment(input: ConfirmPaymentInput): Promise<Payment> {
    const { policyId, txHash } = input;

    // Load policy with SKU
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: { sku: true },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    const { sku } = policy;

    // Verify transaction on-chain
    this.logger.log(
      `Verifying transaction ${txHash} for policy ${policyId}...`,
    );

    const verifiedTransfer = await this.blockchain.verifyTransfer(
      txHash,
      sku.tokenAddress,
      policy.walletAddress,
      policy.premiumAmt.toString(),
    );

    this.logger.log(
      `Transaction verified: ${verifiedTransfer.amount} tokens from ${verifiedTransfer.from}`,
    );

    // Upsert payment record
    const payment = await this.prisma.payment.upsert({
      where: { txHash },
      create: {
        policyId: policy.id,
        txHash,
        chainId: verifiedTransfer.chainId,
        tokenAddress: verifiedTransfer.tokenAddress,
        fromAddress: verifiedTransfer.from,
        toAddress: verifiedTransfer.to,
        amount: verifiedTransfer.amount,
        confirmed: true,
      },
      update: {
        confirmed: true,
        updatedAt: new Date(),
      },
    });

    // Update policy status to under_review
    await this.prisma.policy.update({
      where: { id: policyId },
      data: { status: 'under_review' },
    });

    this.logger.log(
      `Payment confirmed for policy ${policyId}, status updated to under_review`,
    );

    return {
      ...payment,
      amount: payment.amount.toString(),
    };
  }
}
