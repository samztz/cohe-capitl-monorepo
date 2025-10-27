/**
 * Policy Countdown Response DTO
 *
 * Response format for GET /policy/:id/countdown
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Policy status enum
 */
export type PolicyStatus =
  | 'pending'
  | 'under_review'
  | 'active'
  | 'expired'
  | 'rejected';

/**
 * Countdown response for a policy
 *
 * Provides time remaining information for active policies,
 * or shows expired status if past endAt.
 */
export class CountdownResponseDto {
  /**
   * Policy ID (UUID)
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @ApiProperty({
    description: 'Policy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  policyId!: string;

  /**
   * Current policy status
   * @example 'active'
   */
  @ApiProperty({
    description: 'Policy status',
    example: 'active',
    enum: ['pending', 'under_review', 'active', 'expired', 'rejected'],
  })
  status!: PolicyStatus;

  /**
   * Current server time (ISO 8601)
   * @example '2025-10-27T00:00:00.000Z'
   */
  @ApiProperty({
    description: 'Current server time (ISO 8601)',
    example: '2025-10-27T00:00:00.000Z',
  })
  now!: string;

  /**
   * Coverage start time (ISO 8601)
   * Only present for active/expired policies
   * @example '2025-10-27T00:00:00.000Z'
   */
  @ApiProperty({
    description: 'Coverage start time (ISO 8601)',
    example: '2025-10-27T00:00:00.000Z',
    required: false,
  })
  startAt?: string;

  /**
   * Coverage end time (ISO 8601)
   * Only present for active/expired policies
   * @example '2026-01-25T00:00:00.000Z'
   */
  @ApiProperty({
    description: 'Coverage end time (ISO 8601)',
    example: '2026-01-25T00:00:00.000Z',
    required: false,
  })
  endAt?: string;

  /**
   * Seconds remaining until expiration
   * 0 if policy is not active or already expired
   * @example 7776000
   */
  @ApiProperty({
    description: 'Seconds remaining until expiration',
    example: 7776000,
    minimum: 0,
  })
  secondsRemaining!: number;

  /**
   * Days remaining until expiration (floor)
   * 0 if policy is not active or already expired
   * @example 90
   */
  @ApiProperty({
    description: 'Days remaining (floor of secondsRemaining / 86400)',
    example: 90,
    minimum: 0,
  })
  daysRemaining!: number;
}
