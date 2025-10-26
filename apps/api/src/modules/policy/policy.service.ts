/**
 * Policy Service
 *
 * Business logic for managing insurance policies.
 * Handles policy creation, SKU validation, and duplicate prevention.
 */

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
