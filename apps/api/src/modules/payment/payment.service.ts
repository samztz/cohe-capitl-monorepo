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
import { PolicyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from './blockchain.service';
import { SettingsService } from '../settings/settings.service';

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
    private readonly settings: SettingsService,
  ) {}

  /**
   * Confirm payment with on-chain verification
   *
   * Supports "Review then Pay" workflow.
   * Only allows payment for policies in APPROVED_AWAITING_PAYMENT status within paymentDeadline.
   *
   * Process:
   * 1. Load policy and SKU
   * 2. Validate policy status is APPROVED_AWAITING_PAYMENT
   * 3. Validate payment deadline (now <= paymentDeadline)
   * 4. Verify transaction on-chain
   * 5. Validate token, from, to, amount
   * 6. Upsert payment record (idempotent with txHash unique constraint)
   * 7. Activate policy: status=ACTIVE, set startAt=now, endAt=now+termDays
   *
   * @param input - Confirmation data (policyId, txHash)
   * @returns Confirmed payment record
   * @throws NotFoundException if policy/SKU not found
   * @throws BadRequestException if policy not approved, payment expired, or verification fails
   */
  async confirmPayment(input: ConfirmPaymentInput): Promise<Payment> {
    const { policyId, txHash } = input;

    // Load policy with SKU
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: { sku: true },
    });

    if (!policy) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Policy with ID ${policyId} not found`,
      });
    }

    // Validate policy status: must be APPROVED_AWAITING_PAYMENT
    if (policy.status !== PolicyStatus.APPROVED_AWAITING_PAYMENT) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: `Policy status is "${policy.status}" - only policies with status "APPROVED_AWAITING_PAYMENT" can confirm payment`,
      });
    }

    // Validate payment deadline
    if (!policy.paymentDeadline) {
      throw new BadRequestException({
        code: 'MISSING_DEADLINE',
        message: 'Policy has no payment deadline set',
      });
    }

    const now = new Date();
    if (now > policy.paymentDeadline) {
      throw new BadRequestException({
        code: 'PAYMENT_EXPIRED',
        message: `Payment deadline has passed (deadline: ${policy.paymentDeadline.toISOString()}, now: ${now.toISOString()})`,
      });
    }

    const { sku } = policy;

    // Check if payment already exists (idempotency)
    const existingPayment = await this.prisma.payment.findUnique({
      where: { txHash },
    });

    if (existingPayment && existingPayment.confirmed) {
      this.logger.log(
        `Payment already confirmed for txHash ${txHash}, returning existing record`,
      );
      return {
        ...existingPayment,
        amount: existingPayment.amount.toString(),
      };
    }

    // Get treasury address from database/settings
    const treasuryAddress = await this.settings.getTreasuryAddress();
    if (!treasuryAddress) {
      throw new BadRequestException({
        code: 'TREASURY_NOT_CONFIGURED',
        message: 'Treasury address is not configured',
      });
    }

    // Verify transaction on-chain
    this.logger.log(
      `Verifying transaction ${txHash} for policy ${policyId} on chain ${sku.chainId}...`,
    );

    // Convert premiumAmt to wei (18 decimals)
    // premiumAmt is stored as Decimal, e.g., "0.05" -> "50000000000000000"
    const premiumAmtWei = BigInt(
      Math.floor(parseFloat(policy.premiumAmt.toString()) * 1e18),
    ).toString();

    this.logger.log(
      `Expected payment: ${policy.premiumAmt} tokens (${premiumAmtWei} wei) from ${policy.walletAddress} to treasury ${treasuryAddress}`,
    );

    const verifiedTransfer = await this.blockchain.verifyTransfer(
      txHash,
      sku.chainId,
      sku.tokenAddress,
      policy.walletAddress,
      premiumAmtWei,
      treasuryAddress,
    );

    this.logger.log(
      `Transaction verified: ${verifiedTransfer.amount} wei from ${verifiedTransfer.from}`,
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

    // Activate policy: set status=ACTIVE, startAt=now, endAt=now+termDays
    const termDays = sku.termDays || 90;
    const startAt = new Date();
    const endAt = new Date(startAt);
    endAt.setDate(endAt.getDate() + termDays);

    await this.prisma.policy.update({
      where: { id: policyId },
      data: {
        status: PolicyStatus.ACTIVE,
        startAt,
        endAt,
      },
    });

    this.logger.log(
      `Payment confirmed for policy ${policyId}, status updated to ACTIVE (startAt: ${startAt.toISOString()}, endAt: ${endAt.toISOString()})`,
    );

    return {
      ...payment,
      amount: payment.amount.toString(),
    };
  }
}
