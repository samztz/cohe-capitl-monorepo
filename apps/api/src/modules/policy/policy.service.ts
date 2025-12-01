/**
 * Policy Service
 *
 * Business logic for managing insurance policies.
 * Handles policy creation, SKU validation, and contract signing.
 * Users can purchase multiple policies for the same product.
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PolicyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SignatureStorageService } from './signature-storage.service';
import { generateContractHash } from './utils/contract-hash.util';

/** Ethereum address type alias (0x + 40 hex characters) */
type Address = `0x${string}`;

/**
 * Policy entity
 * Represents an insurance policy with status machine support
 */
export interface Policy {
  id: string;
  userId: string;
  skuId: string;
  walletAddress: Address;
  premiumAmt: string; // Decimal as string for JSON serialization
  coverageAmt: string; // Decimal as string for JSON serialization
  status: string;
  contractHash?: string;
  startAt?: Date;
  endAt?: Date;
  paymentDeadline?: Date;
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
  premiumAmt: string; // User-specified premium amount
  coverageAmt: string; // User-specified coverage amount
}

/**
 * Contract signing input
 */
export interface ContractSignInput {
  policyId: string;
  contractPayload: Record<string, unknown>;
  userSig: string;
  userId: string; // For ownership verification
  signatureImageBase64?: string; // Optional handwritten signature (Base64)
  signatureWalletAddress?: string; // Optional wallet address at signing time
  typedDataSignature?: string; // Optional EIP-712 typed data signature
  clientIp?: string; // Client IP address
  userAgent?: string; // Client User-Agent
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
  private readonly logger = new Logger(PolicyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly signatureStorageService: SignatureStorageService,
  ) {}

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
   *
   * Note: Users can purchase multiple policies for the same SKU
   */
  async createPolicy(input: CreatePolicyInput): Promise<Policy> {
    const { skuId, userId, walletAddress, premiumAmt, coverageAmt } = input;

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

    // Validate amounts are positive numbers
    const premium = parseFloat(premiumAmt);
    const coverage = parseFloat(coverageAmt);

    if (isNaN(premium) || premium <= 0) {
      throw new BadRequestException('Premium amount must be a positive number');
    }

    if (isNaN(coverage) || coverage <= 0) {
      throw new BadRequestException('Coverage amount must be a positive number');
    }

    try {
      // Create policy with user-specified amounts
      // Policy is created directly in PENDING_UNDERWRITING status (awaiting contract signature)
      const policy = await this.prisma.policy.create({
        data: {
          userId,
          skuId,
          walletAddress: normalizedAddress,
          premiumAmt: premiumAmt,
          coverageAmt: coverageAmt,
          status: PolicyStatus.PENDING_UNDERWRITING,
        },
      });

      return {
        id: policy.id,
        userId: policy.userId,
        skuId: policy.skuId,
        walletAddress: policy.walletAddress as Address,
        premiumAmt: policy.premiumAmt.toString(),
        coverageAmt: policy.coverageAmt.toString(),
        status: policy.status,
        contractHash: policy.contractHash || undefined,
        startAt: policy.startAt || undefined,
        endAt: policy.endAt || undefined,
        paymentDeadline: policy.paymentDeadline || undefined,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
      };
    } catch (error: any) {
      // Log and re-throw any errors
      this.logger.error('Failed to create policy', {
        error: error.message,
        code: error.code,
        userId,
        skuId,
      });
      throw error;
    }
  }

  /**
   * Sign a policy contract
   *
   * Generates a canonical hash of the contract payload and stores
   * it along with the user's signature. Updates policy status to "under_review".
   * Optionally stores handwritten signature image and metadata.
   *
   * Process:
   * 1. Verify policy exists and belongs to the authenticated user
   * 2. Verify policy is in "pending" status (can only sign once)
   * 3. Generate canonical JSON hash of contract payload
   * 4. If signature image provided: decode, save, and hash it
   * 5. Store contractHash, userSig, and signature metadata
   * 6. Update status to "under_review"
   *
   * @param input - Contract signing data
   * @returns Contract hash (0x-prefixed)
   * @throws NotFoundException if policy not found
   * @throws BadRequestException if policy already signed or doesn't belong to user
   */
  async signContract(
    input: ContractSignInput,
  ): Promise<ContractSignResult> {
    const {
      policyId,
      contractPayload,
      userSig,
      userId,
      signatureImageBase64,
      signatureWalletAddress,
      typedDataSignature,
      clientIp,
      userAgent,
    } = input;

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

    // Verify policy status - can only sign policies in PENDING_UNDERWRITING status
    if (policy.status !== PolicyStatus.PENDING_UNDERWRITING) {
      throw new BadRequestException(
        `Policy status is "${policy.status}" - can only sign policies in "PENDING_UNDERWRITING" status`,
      );
    }

    // Already signed check
    if (policy.contractHash || policy.userSig) {
      throw new BadRequestException('Policy contract has already been signed');
    }

    // Generate canonical hash
    const contractHash = generateContractHash(contractPayload);

    // Process signature image if provided
    let signatureImageUrl: string | undefined;
    let signatureHash: string | undefined;

    if (signatureImageBase64) {
      try {
        // Remove data URL prefix if present (data:image/png;base64,)
        const base64Data = signatureImageBase64.replace(
          /^data:image\/\w+;base64,/,
          '',
        );

        // Decode Base64 to Buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Determine MIME type (default to PNG)
        const mimeType = signatureImageBase64.startsWith('data:image/png')
          ? 'image/png'
          : 'image/jpeg';

        // Save signature image and get URL + hash
        const result = await this.signatureStorageService.saveSignatureImage(
          imageBuffer,
          mimeType,
          policyId,
        );

        signatureImageUrl = result.url;
        signatureHash = result.hash;

        this.logger.log(
          `Signature image saved for policy ${policyId}: ${signatureImageUrl}`,
        );
      } catch (error: any) {
        this.logger.error(
          `Failed to process signature image: ${error.message}`,
        );
        throw new BadRequestException(
          'Failed to process signature image. Ensure it is valid Base64-encoded PNG/JPEG.',
        );
      }
    }

    // Update policy with contract hash, signature, and metadata
    await this.prisma.policy.update({
      where: { id: policyId },
      data: {
        contractHash,
        userSig,
        status: PolicyStatus.PENDING_UNDERWRITING,
        // Signature metadata (optional fields)
        signatureImageUrl,
        signatureHash,
        signatureSignedAt: signatureImageBase64 ? new Date() : undefined,
        signatureIp: clientIp,
        signatureUserAgent: userAgent,
        signatureWalletAddress,
      },
    });

    this.logger.log(
      `Contract signed for policy ${policyId} by user ${userId}`,
      {
        contractHash,
        hasSignatureImage: !!signatureImageUrl,
        clientIp,
      },
    );

    return { contractHash };
  }

  /**
   * Get user policies
   *
   * Retrieves all policies for a specific user, ordered by creation date (newest first).
   *
   * @param userId - User UUID
   * @returns Array of policy objects with safe fields
   */
  async getUserPolicies(userId: string): Promise<Policy[]> {
    const policies = await this.prisma.policy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return policies.map((policy) => ({
      id: policy.id,
      userId: policy.userId,
      skuId: policy.skuId,
      walletAddress: policy.walletAddress as Address,
      premiumAmt: policy.premiumAmt.toString(),
      coverageAmt: policy.coverageAmt.toString(),
      status: policy.status,
      contractHash: policy.contractHash || undefined,
      startAt: policy.startAt || undefined,
      endAt: policy.endAt || undefined,
      paymentDeadline: policy.paymentDeadline || undefined,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    }));
  }

  /**
   * Get policy by ID
   *
   * Retrieves a policy by its UUID, returning safe fields for API response.
   * Does not include sensitive data like userSig.
   *
   * @param policyId - Policy UUID
   * @returns Policy details with safe fields
   * @throws NotFoundException if policy not found
   */
  async getPolicyById(policyId: string): Promise<Policy> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    return {
      id: policy.id,
      userId: policy.userId,
      skuId: policy.skuId,
      walletAddress: policy.walletAddress as Address,
      premiumAmt: policy.premiumAmt.toString(),
      coverageAmt: policy.coverageAmt.toString(),
      status: policy.status,
      contractHash: policy.contractHash || undefined,
      startAt: policy.startAt || undefined,
      endAt: policy.endAt || undefined,
      paymentDeadline: policy.paymentDeadline || undefined,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
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
    if (policy.status === PolicyStatus.ACTIVE && policy.endAt) {
      const endAtTime = policy.endAt.getTime();
      const nowTime = now.getTime();

      if (nowTime >= endAtTime) {
        // Policy has expired
        status = PolicyStatus.EXPIRED;
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
