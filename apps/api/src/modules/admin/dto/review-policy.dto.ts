/**
 * Review Policy DTO
 *
 * Request body for admin policy review actions (approve/reject)
 * Supports "Review then Pay" workflow
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Review action enum
 * - 'approve': Set policy to APPROVED_AWAITING_PAYMENT with paymentDeadline
 * - 'reject': Reject the policy application (set to REJECTED)
 */
export type ReviewAction = 'approve' | 'reject';

/**
 * Request body for PATCH /admin/policies/:id
 *
 * Allows admin to approve or reject a policy under review.
 * For "Review then Pay" workflow: approve sets paymentDeadline, user pays later.
 */
export class ReviewPolicyDto {
  /**
   * Review action: approve or reject
   * @example 'approve'
   */
  @ApiProperty({
    description: 'Review action to perform',
    example: 'approve',
    enum: ['approve', 'reject'],
  })
  action!: ReviewAction;

  /**
   * Payment deadline (ISO 8601 string) - required when action is 'approve'
   * If not provided, server defaults to now + 24 hours
   * @example '2025-12-31T23:59:59.000Z'
   */
  @ApiProperty({
    description:
      'Payment deadline for approved policies (ISO 8601 format). ' +
      'Required when action is "approve". ' +
      'If not provided, defaults to 24 hours from now.',
    example: '2025-12-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
    required: false,
  })
  paymentDeadline?: string;

  /**
   * Optional reviewer note/comment
   * @example 'Approved after verification'
   */
  @ApiProperty({
    description:
      'Optional reviewer note or comment. ' +
      'Can be used for both approve and reject actions.',
    example: 'Approved after verification',
    required: false,
  })
  reviewerNote?: string;
}
