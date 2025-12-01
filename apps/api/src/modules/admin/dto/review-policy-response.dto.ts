/**
 * Review Policy Response DTO
 *
 * Response format for PATCH /admin/policies/:id after approval/rejection
 * Supports "Review then Pay" workflow
 */

import { ApiProperty } from '@nestjs/swagger';
import { PolicyStatus } from '@prisma/client';

/**
 * Response after approving or rejecting a policy
 */
export class ReviewPolicyResponse {
  /**
   * Policy ID
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @ApiProperty({
    description: 'Policy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  /**
   * Updated policy status
   * @example 'APPROVED_AWAITING_PAYMENT'
   */
  @ApiProperty({
    description:
      'Policy status after review. ' +
      'APPROVED_AWAITING_PAYMENT for approved policies (awaiting payment), ' +
      'REJECTED for rejected policies.',
    example: PolicyStatus.APPROVED_AWAITING_PAYMENT,
    enum: PolicyStatus,
  })
  status!: PolicyStatus;

  /**
   * Payment deadline (only for approved policies)
   * User must pay before this time for the policy to become ACTIVE
   * @example '2025-12-31T23:59:59.000Z'
   */
  @ApiProperty({
    description:
      'Payment deadline (ISO 8601). ' +
      'Only present when status is APPROVED_AWAITING_PAYMENT. ' +
      'User must pay before this time.',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  paymentDeadline?: string;

  /**
   * Coverage start time (set when payment is confirmed, not during approval)
   * @example '2024-01-01T00:00:00.000Z'
   */
  @ApiProperty({
    description:
      'Coverage start time (ISO 8601). ' +
      'Set when payment is confirmed, not during approval phase.',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  startAt?: string;

  /**
   * Coverage end time (set when payment is confirmed, not during approval)
   * @example '2024-04-01T00:00:00.000Z'
   */
  @ApiProperty({
    description:
      'Coverage end time (ISO 8601). ' +
      'Set when payment is confirmed, not during approval phase.',
    example: '2024-04-01T00:00:00.000Z',
    required: false,
  })
  endAt?: string;
}
