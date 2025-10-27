/**
 * Policy Service
 *
 * Business logic for managing insurance policies.
 * Handles policy creation, SKU validation, and duplicate prevention.
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateContractHash } from './utils/contract-hash.util';

/** Ethereum address type alias (0x + 40 hex characters) */
type Address = `0x${string}`;

/**
 * Policy entity
 * Represents an insurance policy with draft/pending status
 */
export interface Policy {
  id: string;
  userId: string;
  skuId: string;
  walletAddress: Address;
  premiumAmt: string; // Decimal as string for JSON serialization
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create policy input
 */
export interface CreatePolicyInput {
  skuId: string;
  userId: string;
  walletAddress: Address;
}

/**
 * Contract signing input
 */
export interface ContractSignInput {
  policyId: string;
  contractPayload: Record<string, unknown>;
  userSig: string;
  userId: string; // For ownership verification
}

/**
 * Contract signing result
 */
export interface ContractSignResult {
  contractHash: string;
}

/**
 * Countdown result
 */
export interface CountdownResult {
  policyId: string;
  status: string;
  now: Date;
  startAt?: Date;
  endAt?: Date;
  secondsRemaining: number;
  daysRemaining: number;
}

@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new policy draft
   *
   * Creates a policy in "pending" status for the given SKU and user.
   * Enforces unique constraint: one policy per wallet address + SKU combination.
   *
   * Process:
   * 1. Validate SKU exists and is active
   * 2. Copy premium amount from SKU
   * 3. Normalize wallet address to lowercase
   * 4. Create policy record
   * 5. Handle duplicate conflicts (409)
   *
   * @param input - Policy creation data
   * @returns Created policy with ID
   * @throws NotFoundException if SKU not found or inactive
   * @throws ConflictException if policy already exists for this wallet+SKU
   */
  async createPolicy(input: CreatePolicyInput): Promise<Policy> {
    const { skuId, userId, walletAddress } = input;

    // Normalize wallet address to lowercase
    const normalizedAddress = walletAddress.toLowerCase() as Address;

    // Load SKU and validate
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
    });

    if (!sku) {
      throw new NotFoundException(`SKU with ID ${skuId} not found`);
    }

    if (sku.status !== 'active') {
      throw new NotFoundException(`SKU ${skuId} is not active`);
    }

    try {
      // Create policy with SKU's premium amount
      const policy = await this.prisma.policy.create({
        data: {
          userId,
          skuId,
          walletAddress: normalizedAddress,
          premiumAmt: sku.premiumAmt,
          status: 'pending',
        },
      });

      return {
        ...policy,
        premiumAmt: policy.premiumAmt.toString(),
        walletAddress: policy.walletAddress as Address,
      };
    } catch (error: any) {
      // Handle Prisma unique constraint violation
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Policy already exists for wallet ${normalizedAddress} and SKU ${skuId}`,
        );
      }
      throw error;
    }
  }

  /**
   * Sign a policy contract
   *
   * Generates a canonical hash of the contract payload and stores
   * it along with the user's signature. Updates policy status to "under_review".
   *
   * Process:
   * 1. Verify policy exists and belongs to the authenticated user
   * 2. Verify policy is in "pending" status (can only sign once)
   * 3. Generate canonical JSON hash of contract payload
   * 4. Store contractHash and userSig
   * 5. Update status to "under_review"
   *
   * @param input - Contract signing data
   * @returns Contract hash (0x-prefixed)
   * @throws NotFoundException if policy not found
   * @throws BadRequestException if policy already signed or doesn't belong to user
   */
  async signContract(
    input: ContractSignInput,
  ): Promise<ContractSignResult> {
    const { policyId, contractPayload, userSig, userId } = input;

    // Load policy and verify ownership
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    if (policy.userId !== userId) {
      throw new BadRequestException(
        'Policy does not belong to the authenticated user',
      );
    }

    // Verify policy status - can only sign pending policies
    if (policy.status !== 'pending') {
      throw new BadRequestException(
        `Policy status is "${policy.status}" - can only sign policies in "pending" status`,
      );
    }

    // Already signed check
    if (policy.contractHash || policy.userSig) {
      throw new BadRequestException('Policy contract has already been signed');
    }

    // Generate canonical hash
    const contractHash = generateContractHash(contractPayload);

    // Update policy with contract hash, signature, and new status
    await this.prisma.policy.update({
      where: { id: policyId },
      data: {
        contractHash,
        userSig,
        status: 'under_review',
      },
    });

    return { contractHash };
  }

  /**
   * Get policy countdown information
   *
   * Calculates time remaining for active policies and handles expiration.
   *
   * Business rules:
   * - If status !== 'active': return current status with secondsRemaining=0
   * - If status === 'active':
   *   - Calculate secondsRemaining = max(0, endAt - now)
   *   - Calculate daysRemaining = floor(secondsRemaining / 86400)
   *   - If now >= endAt: return status='expired', secondsRemaining=0
   *
   * Note: We do NOT persist the 'expired' status to the database because:
   * 1. Expiration is a time-based state that can be computed on-the-fly
   * 2. Avoids database writes on every countdown request
   * 3. Prevents race conditions from concurrent requests
   * 4. A separate batch job can periodically update expired policies if needed
   *
   * @param policyId - Policy UUID
   * @returns Countdown information with time remaining
   * @throws NotFoundException if policy not found
   *
   * @example
   * // Active policy with time remaining
   * const countdown = await policyService.getCountdown('uuid');
   * // Returns: { policyId, status: 'active', secondsRemaining: 7776000, daysRemaining: 90, ... }
   *
   * @example
   * // Expired policy
   * const countdown = await policyService.getCountdown('uuid');
   * // Returns: { policyId, status: 'expired', secondsRemaining: 0, daysRemaining: 0, ... }
   *
   * @example
   * // Non-active policy
   * const countdown = await policyService.getCountdown('uuid');
   * // Returns: { policyId, status: 'under_review', secondsRemaining: 0, daysRemaining: 0, ... }
   */
  async getCountdown(policyId: string): Promise<CountdownResult> {
    // Load policy
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    const now = new Date();
    let status = policy.status;
    let secondsRemaining = 0;
    let daysRemaining = 0;

    // Only calculate countdown for active policies
    if (policy.status === 'active' && policy.endAt) {
      const endAtTime = policy.endAt.getTime();
      const nowTime = now.getTime();

      if (nowTime >= endAtTime) {
        // Policy has expired
        status = 'expired';
        secondsRemaining = 0;
        daysRemaining = 0;
        // Note: We do NOT persist 'expired' status to DB here
        // See function documentation for reasoning
      } else {
        // Policy is still active - calculate remaining time
        const millisRemaining = endAtTime - nowTime;
        secondsRemaining = Math.floor(millisRemaining / 1000);
        daysRemaining = Math.floor(secondsRemaining / 86400);
      }
    }

    return {
      policyId: policy.id,
      status,
      now,
      startAt: policy.startAt || undefined,
      endAt: policy.endAt || undefined,
      secondsRemaining,
      daysRemaining,
    };
  }
}
