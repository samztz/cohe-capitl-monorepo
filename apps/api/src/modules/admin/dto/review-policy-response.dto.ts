/**
 * Review Policy Response DTO
 *
 * Response format for PATCH /admin/policies/:id after approval/rejection
 */

import { ApiProperty } from '@nestjs/swagger';

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
   * @example 'active'
   */
  @ApiProperty({
    description: 'Policy status after review',
    example: 'active',
    enum: ['active', 'rejected'],
  })
  status!: string;

  /**
   * Coverage start time (only for approved policies)
   * @example '2024-01-01T00:00:00.000Z'
   */
  @ApiProperty({
    description: 'Coverage start time (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  startAt?: string;

  /**
   * Coverage end time (only for approved policies)
   * @example '2024-04-01T00:00:00.000Z'
   */
  @ApiProperty({
    description: 'Coverage end time (ISO 8601)',
    example: '2024-04-01T00:00:00.000Z',
    required: false,
  })
  endAt?: string;
}
