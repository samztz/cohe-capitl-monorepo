/**
 * Review Policy DTO
 *
 * Request body for admin policy review actions (approve/reject)
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Review action enum
 * - 'approve': Activate the policy and set coverage period
 * - 'reject': Reject the policy application
 */
export type ReviewAction = 'approve' | 'reject';

/**
 * Request body for PATCH /admin/policies/:id
 *
 * Allows admin to approve or reject a policy under review
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
}
