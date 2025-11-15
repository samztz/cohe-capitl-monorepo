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
  Logger,
} from '@nestjs/common';
import { PolicyStatus } from 'generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewAction } from './dto/review-policy.dto';

/**
 * Query parameters for listing policies
 */
export interface ListPoliciesQuery {
  page: number;
  pageSize: number;
  status?: PolicyStatus;
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
    status: PolicyStatus;
    createdAt: Date;
  }>;
}

/**
 * Policy review result
 */
export interface PolicyReviewResult {
  id: string;
  status: PolicyStatus;
  paymentDeadline?: Date;
  startAt?: Date;
  endAt?: Date;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

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
   * PATCH /admin/policies/:id { action: 'approve' | 'reject', paymentDeadline?: string }
   *
   * Supports "Review then Pay" workflow.
   *
   * Business rules:
   * - Only policies with status=PENDING_UNDERWRITING can be reviewed
   * - Approve: sets status=APPROVED_AWAITING_PAYMENT with paymentDeadline (NOT ACTIVE yet)
   * - Reject: sets status=REJECTED
   *
   * Process (Approve):
   * 1. Load policy and validate existence
   * 2. Verify status is PENDING_UNDERWRITING
   * 3. Calculate paymentDeadline (from parameter or default now+24h)
   * 4. Update policy status to APPROVED_AWAITING_PAYMENT with paymentDeadline
   * 5. Do NOT set startAt/endAt (those are set when payment is confirmed)
   *
   * Process (Reject):
   * 1. Load policy and validate existence
   * 2. Verify status is PENDING_UNDERWRITING
   * 3. Update policy status to REJECTED
   *
   * @param policyId - Policy UUID
   * @param action - 'approve' or 'reject'
   * @param paymentDeadlineStr - Optional ISO 8601 string for payment deadline (defaults to now+24h)
   * @returns Updated policy with status and paymentDeadline (if approved)
   * @throws NotFoundException if policy not found
   * @throws BadRequestException if policy status is not PENDING_UNDERWRITING or invalid deadline
   *
   * @example
   * // Approve a policy with custom deadline
   * const result = await adminService.reviewPolicy('uuid', 'approve', '2025-12-31T23:59:59.000Z');
   * // Returns: { id: 'uuid', status: 'APPROVED_AWAITING_PAYMENT', paymentDeadline: Date }
   *
   * @example
   * // Approve with default deadline (now+24h)
   * const result = await adminService.reviewPolicy('uuid', 'approve');
   * // Returns: { id: 'uuid', status: 'APPROVED_AWAITING_PAYMENT', paymentDeadline: Date }
   *
   * @example
   * // Reject a policy
   * const result = await adminService.reviewPolicy('uuid', 'reject');
   * // Returns: { id: 'uuid', status: 'REJECTED' }
   */
  async reviewPolicy(
    policyId: string,
    action: ReviewAction,
    paymentDeadlineStr?: string,
    reviewerNote?: string,
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
    if (policy.status !== PolicyStatus.PENDING_UNDERWRITING) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: `Policy status is "${policy.status}" - only policies with status "PENDING_UNDERWRITING" can be reviewed`,
      });
    }

    // Handle approve action
    if (action === 'approve') {
      // Calculate payment deadline: use provided value or default to now + 24 hours
      let paymentDeadline: Date;
      if (paymentDeadlineStr) {
        paymentDeadline = new Date(paymentDeadlineStr);
        // Validate the date
        if (isNaN(paymentDeadline.getTime())) {
          throw new BadRequestException({
            code: 'INVALID_DEADLINE',
            message: `Invalid paymentDeadline format: "${paymentDeadlineStr}"`,
          });
        }
      } else {
        // Default: 24 hours from now
        paymentDeadline = new Date();
        paymentDeadline.setHours(paymentDeadline.getHours() + 24);
      }

      // Update policy to APPROVED_AWAITING_PAYMENT with paymentDeadline
      // Do NOT set startAt/endAt yet (those are set when payment is confirmed)
      const updated = await this.prisma.policy.update({
        where: { id: policyId },
        data: {
          status: PolicyStatus.APPROVED_AWAITING_PAYMENT,
          paymentDeadline,
        },
      });

      // Log reviewer note if provided
      if (reviewerNote) {
        this.logger.log(
          `Policy ${policyId} approved with note: "${reviewerNote}"`,
        );
      }

      return {
        id: updated.id,
        status: updated.status,
        paymentDeadline: updated.paymentDeadline!,
      };
    }

    // Handle reject action
    const updated = await this.prisma.policy.update({
      where: { id: policyId },
      data: {
        status: PolicyStatus.REJECTED,
      },
    });

    // Log reviewer note if provided
    if (reviewerNote) {
      this.logger.log(`Policy ${policyId} rejected with note: "${reviewerNote}"`);
    }

    return {
      id: updated.id,
      status: updated.status,
    };
  }
}
