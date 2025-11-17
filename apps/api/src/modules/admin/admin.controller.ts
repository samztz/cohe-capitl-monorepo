/**
 * Admin Controller
 *
 * Handles HTTP requests for admin policy review operations.
 * Provides endpoints for listing and reviewing policies.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { z } from 'zod';
import { AdminGuard } from '../auth/admin.guard';
import { AdminService } from './admin.service';
import { ListAdminPoliciesQuery } from './dto/list-admin-policies.query';
import { ReviewPolicyDto } from './dto/review-policy.dto';
import { AdminPolicyListResponse } from './dto/admin-policy-list-response.dto';
import { ReviewPolicyResponse } from './dto/review-policy-response.dto';

/**
 * Validation schema for review policy request
 * Validates action is either 'approve' or 'reject'
 * Optionally validates paymentDeadline as ISO 8601 string
 * Optionally validates reviewerNote as string
 */
const ReviewPolicySchema = z.object({
  action: z.enum(['approve', 'reject']),
  paymentDeadline: z.string().optional(),
  reviewerNote: z.string().optional(),
});

/**
 * Validation schema for UUID parameter
 */
const UuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

/**
 * Admin API Controller
 * Base route: /admin
 *
 * Provides policy review and management endpoints for administrators
 */
@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get statistics for admin dashboard
   *
   * GET /admin/stats
   *
   * Returns aggregated statistics for the admin dashboard.
   * Used by the dashboard to display summary cards with policy counts.
   *
   * @returns Statistics object with counts
   *
   * @example
   * Request:
   * GET /admin/stats
   *
   * Response:
   * {
   *   "total": 150,
   *   "underReview": 20,
   *   "approvedToday": 5,
   *   "rejectedToday": 2
   * }
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get admin dashboard statistics',
    description:
      'Returns aggregated statistics including total policies, policies under review, ' +
      'approved policies awaiting payment, and rejected policies. ' +
      'Note: "approvedToday" and "rejectedToday" currently return totals, not daily counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      properties: {
        total: { type: 'number', example: 150 },
        underReview: { type: 'number', example: 20 },
        approvedToday: { type: 'number', example: 5 },
        rejectedToday: { type: 'number', example: 2 },
      },
    },
  })
  async getStats() {
    return this.adminService.getStats();
  }

  /**
   * List policies with pagination and filtering
   *
   * GET /admin/policies?status=under_review&page=1&pageSize=20
   *
   * Returns a paginated list of policies with optional status filtering.
   * Useful for admin dashboards to review pending policies.
   *
   * @param query - Query parameters (page, pageSize, status)
   * @returns Paginated policy list with metadata
   *
   * @example
   * Request:
   * GET /admin/policies?status=under_review&page=1&pageSize=20
   *
   * Response:
   * {
   *   "total": 150,
   *   "page": 1,
   *   "pageSize": 20,
   *   "items": [
   *     {
   *       "id": "uuid",
   *       "walletAddress": "0xabc...",
   *       "skuId": "uuid",
   *       "premiumAmt": "100.0",
   *       "status": "under_review",
   *       "createdAt": "2024-01-01T00:00:00.000Z"
   *     }
   *   ]
   * }
   */
  @Get('policies')
  @ApiOperation({
    summary: 'List policies for admin review',
    description:
      'Returns a paginated list of policies with optional status filtering. ' +
      'Default page size is 20. Results are ordered by creation date (newest first).',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by policy status',
    enum: ['pending', 'under_review', 'active', 'rejected', 'expired'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-indexed)',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of items per page',
    example: 20,
    type: Number,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query for policy ID, wallet address, or user email',
    example: '0x1234',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Policy list retrieved successfully',
    type: AdminPolicyListResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async listPolicies(
    @Query() query: ListAdminPoliciesQuery,
  ): Promise<AdminPolicyListResponse> {
    const result = await this.adminService.listPolicies({
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 20,
      status: query.status,
      q: query.q,
    });

    return {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      items: result.items.map((item) => ({
        id: item.id,
        walletAddress: item.walletAddress,
        skuId: item.skuId,
        skuName: item.skuName,
        coverageAmt: item.coverageAmt,
        termDays: item.termDays,
        premiumAmt: item.premiumAmt,
        email: item.email,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Get a single policy by ID
   *
   * GET /admin/policies/:id
   *
   * Returns full policy details for admin review, including SKU information,
   * user details, and payment deadline.
   *
   * @param id - Policy UUID
   * @returns Full policy details
   * @throws BadRequestException if UUID format is invalid
   * @throws NotFoundException if policy not found
   *
   * @example
   * Request:
   * GET /admin/policies/550e8400-e29b-41d4-a716-446655440000
   *
   * Response:
   * {
   *   "id": "550e8400-e29b-41d4-a716-446655440000",
   *   "walletAddress": "0xabc...",
   *   "sku": {
   *     "id": "...",
   *     "name": "YULILY SHIELD INSURANCE",
   *     "coverageAmt": "10000.0",
   *     "termDays": 90
   *   },
   *   "user": {
   *     "email": "user@example.com"
   *   },
   *   "premiumAmt": "100.0",
   *   "status": "PENDING_UNDERWRITING",
   *   "paymentDeadline": "2025-11-16T08:00:00.000Z",
   *   "createdAt": "2025-11-15T08:00:00.000Z"
   * }
   */
  @Get('policies/:id')
  @ApiOperation({
    summary: 'Get policy details by ID',
    description:
      'Returns full policy details including SKU, user, and payment information. ' +
      'Used by admin portal to view policy details and payment deadlines.',
  })
  @ApiParam({
    name: 'id',
    description: 'Policy UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Policy details retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID format',
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found',
  })
  async getPolicyById(@Param('id') id: string) {
    // Validate UUID parameter
    const uuidResult = UuidSchema.safeParse(id);
    if (!uuidResult.success) {
      throw new BadRequestException({
        message: 'Invalid policy ID format',
        errors: uuidResult.error.issues,
      });
    }

    const policy = await this.adminService.getPolicyById(uuidResult.data);

    // Format response with Decimal to string conversion
    return {
      id: policy.id,
      walletAddress: policy.walletAddress,
      skuId: policy.skuId,
      sku: policy.sku
        ? {
            id: policy.sku.id,
            name: policy.sku.name,
            coverageAmt: policy.sku.coverageAmt.toString(),
            premiumAmt: policy.sku.premiumAmt.toString(),
            termDays: policy.sku.termDays,
            chainId: policy.sku.chainId,
            tokenAddress: policy.sku.tokenAddress,
          }
        : undefined,
      user: policy.user
        ? {
            id: policy.user.id,
            email: policy.user.email,
            walletAddress: policy.user.walletAddress,
          }
        : undefined,
      premiumAmt: policy.premiumAmt.toString(),
      status: policy.status,
      paymentDeadline: policy.paymentDeadline?.toISOString(),
      startAt: policy.startAt?.toISOString(),
      endAt: policy.endAt?.toISOString(),
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString(),
      payments: policy.payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount.toString(),
        txHash: payment.txHash,
        confirmed: payment.confirmed,
        chainId: payment.chainId,
        tokenAddress: payment.tokenAddress,
        fromAddress: payment.fromAddress,
        toAddress: payment.toAddress,
        createdAt: payment.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Review a policy (approve or reject)
   *
   * PATCH /admin/policies/:id
   *
   * Allows administrators to approve or reject policies that are under review.
   * Supports "Review then Pay" workflow.
   *
   * Business rules:
   * - Only policies with status=PENDING_UNDERWRITING can be reviewed
   * - Approve: sets status=APPROVED_AWAITING_PAYMENT with paymentDeadline (NOT ACTIVE yet)
   * - Reject: marks policy as REJECTED
   *
   * @param id - Policy UUID
   * @param body - Request body containing action and optional paymentDeadline
   * @returns Updated policy with new status and paymentDeadline (if approved)
   * @throws BadRequestException if validation fails or invalid status
   * @throws NotFoundException if policy not found
   *
   * @example
   * Request (Approve with custom deadline):
   * PATCH /admin/policies/550e8400-e29b-41d4-a716-446655440000
   * {
   *   "action": "approve",
   *   "paymentDeadline": "2025-12-31T23:59:59.000Z"
   * }
   *
   * Response:
   * {
   *   "id": "550e8400-e29b-41d4-a716-446655440000",
   *   "status": "APPROVED_AWAITING_PAYMENT",
   *   "paymentDeadline": "2025-12-31T23:59:59.000Z"
   * }
   *
   * @example
   * Request (Approve with default deadline):
   * PATCH /admin/policies/550e8400-e29b-41d4-a716-446655440000
   * { "action": "approve" }
   *
   * Response:
   * {
   *   "id": "550e8400-e29b-41d4-a716-446655440000",
   *   "status": "APPROVED_AWAITING_PAYMENT",
   *   "paymentDeadline": "2025-11-16T08:00:00.000Z"  // now + 24h
   * }
   *
   * @example
   * Request (Reject):
   * PATCH /admin/policies/550e8400-e29b-41d4-a716-446655440000
   * { "action": "reject" }
   *
   * Response:
   * {
   *   "id": "550e8400-e29b-41d4-a716-446655440000",
   *   "status": "REJECTED"
   * }
   */
  @Patch('policies/:id')
  @ApiOperation({
    summary: 'Review a policy (approve or reject) - Review then Pay',
    description:
      'Approve or reject a policy under review. ' +
      'Supports "Review then Pay" workflow:\n' +
      '- Approve: sets status to APPROVED_AWAITING_PAYMENT with paymentDeadline (user pays later)\n' +
      '- Reject: sets status to REJECTED\n' +
      'Only policies with status PENDING_UNDERWRITING can be reviewed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Policy UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: ReviewPolicyDto })
  @ApiResponse({
    status: 200,
    description: 'Policy reviewed successfully',
    type: ReviewPolicyResponse,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid request - validation failed or policy not in reviewable status',
    schema: {
      properties: {
        code: { type: 'string', example: 'INVALID_STATUS' },
        message: {
          type: 'string',
          example: 'Policy status is "active" - only policies with status "under_review" can be reviewed',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found',
    schema: {
      properties: {
        code: { type: 'string', example: 'NOT_FOUND' },
        message: {
          type: 'string',
          example: 'Policy with ID xxx not found',
        },
      },
    },
  })
  async reviewPolicy(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ReviewPolicyResponse> {
    // Validate UUID parameter
    const uuidResult = UuidSchema.safeParse(id);
    if (!uuidResult.success) {
      throw new BadRequestException({
        message: 'Invalid policy ID format',
        errors: uuidResult.error.issues,
      });
    }

    // Validate request body
    const bodyResult = ReviewPolicySchema.safeParse(body);
    if (!bodyResult.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        errors: bodyResult.error.issues,
      });
    }

    const { action, paymentDeadline, reviewerNote } = bodyResult.data;

    // Execute review
    const result = await this.adminService.reviewPolicy(
      uuidResult.data,
      action,
      paymentDeadline,
      reviewerNote,
    );

    // Format response
    return {
      id: result.id,
      status: result.status,
      paymentDeadline: result.paymentDeadline?.toISOString(),
      startAt: result.startAt?.toISOString(),
      endAt: result.endAt?.toISOString(),
    };
  }
}
