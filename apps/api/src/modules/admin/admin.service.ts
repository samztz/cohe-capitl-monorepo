/**
 * Admin Service
 *
 * Business logic for admin policy review operations.
 * Handles policy listing, approval, and rejection with state management.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewAction } from './dto/review-policy.dto';

/**
 * Query parameters for listing policies
 */
export interface ListPoliciesQuery {
  page: number;
  pageSize: number;
  status?: string;
}

/**
 * Paginated policy list result
 */
export interface PaginatedPolicies {
  total: number;
  page: number;
  pageSize: number;
  items: Array<{
    id: string;
    walletAddress: string;
    skuId: string;
    premiumAmt: string;
    status: string;
    createdAt: Date;
  }>;
}

/**
 * Policy review result
 */
export interface PolicyReviewResult {
  id: string;
  status: string;
  startAt?: Date;
  endAt?: Date;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List policies with pagination and optional filtering
   *
   * GET /admin/policies?status=under_review&page=1&pageSize=20
   *
   * Features:
   * - Pagination (page, pageSize)
   * - Status filtering (optional)
   * - Returns total count for pagination UI
   *
   * @param query - Pagination and filter parameters
   * @returns Paginated list of policies with metadata
   *
   * @example
   * const result = await adminService.listPolicies({
   *   page: 1,
   *   pageSize: 20,
   *   status: 'under_review'
   * });
   * // Returns: { total: 150, page: 1, pageSize: 20, items: [...] }
   */
  async listPolicies(query: ListPoliciesQuery): Promise<PaginatedPolicies> {
    const { page = 1, pageSize = 20, status } = query;

    // Calculate skip offset
    const skip = (page - 1) * pageSize;

    // Build filter conditions
    const where = status ? { status } : {};

    // Execute count and data query in parallel
    const [total, items] = await Promise.all([
      this.prisma.policy.count({ where }),
      this.prisma.policy.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          walletAddress: true,
          skuId: true,
          premiumAmt: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Convert Decimal to string for JSON serialization
    return {
      total,
      page,
      pageSize,
      items: items.map((item) => ({
        ...item,
        premiumAmt: item.premiumAmt.toString(),
      })),
    };
  }

  /**
   * Review a policy (approve or reject)
   *
   * PATCH /admin/policies/:id { action: 'approve' | 'reject' }
   *
   * Business rules:
   * - Only policies with status='under_review' can be reviewed
   * - Approve: sets status='active', startAt=now(), endAt=now()+termDays
   * - Reject: sets status='rejected'
   *
   * Process:
   * 1. Load policy and validate existence
   * 2. Verify status is 'under_review'
   * 3. If approve:
   *    a. Load SKU to get termDays (default 90)
   *    b. Calculate startAt (now) and endAt (now + termDays)
   *    c. Update policy with active status and dates
   * 4. If reject:
   *    a. Update policy with rejected status
   *
   * @param policyId - Policy UUID
   * @param action - 'approve' or 'reject'
   * @returns Updated policy with status and dates
   * @throws NotFoundException if policy not found
   * @throws BadRequestException if policy status is not 'under_review'
   *
   * @example
   * // Approve a policy
   * const result = await adminService.reviewPolicy('uuid', 'approve');
   * // Returns: { id: 'uuid', status: 'active', startAt: Date, endAt: Date }
   *
   * @example
   * // Reject a policy
   * const result = await adminService.reviewPolicy('uuid', 'reject');
   * // Returns: { id: 'uuid', status: 'rejected' }
   */
  async reviewPolicy(
    policyId: string,
    action: ReviewAction,
  ): Promise<PolicyReviewResult> {
    // Load policy with SKU relation
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

    // Verify policy is in reviewable state
    if (policy.status !== 'under_review') {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: `Policy status is "${policy.status}" - only policies with status "under_review" can be reviewed`,
      });
    }

    // Handle approve action
    if (action === 'approve') {
      // Get term days from SKU (default to 90)
      const termDays = policy.sku.termDays || 90;

      // Calculate coverage period
      const startAt = new Date();
      const endAt = new Date(startAt);
      endAt.setDate(endAt.getDate() + termDays);

      // Update policy to active with coverage dates
      const updated = await this.prisma.policy.update({
        where: { id: policyId },
        data: {
          status: 'active',
          startAt,
          endAt,
        },
      });

      return {
        id: updated.id,
        status: updated.status,
        startAt: updated.startAt!,
        endAt: updated.endAt!,
      };
    }

    // Handle reject action
    const updated = await this.prisma.policy.update({
      where: { id: policyId },
      data: {
        status: 'rejected',
      },
    });

    return {
      id: updated.id,
      status: updated.status,
    };
  }
}
