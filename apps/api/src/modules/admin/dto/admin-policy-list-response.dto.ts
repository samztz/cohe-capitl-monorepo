/**
 * Admin Policy List Response DTO
 *
 * Response format for GET /admin/policies with pagination metadata
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Individual policy item in the list
 */
export class AdminPolicyItem {
  /**
   * Policy ID (UUID)
   * @example '550e8400-e29b-41d4-a716-446655440000'
   */
  @ApiProperty({
    description: 'Policy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  /**
   * Wallet address of the policy holder
   * @example '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
   */
  @ApiProperty({
    description: 'Wallet address of policy holder',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  })
  walletAddress!: string;

  /**
   * SKU ID (product identifier)
   * @example '550e8400-e29b-41d4-a716-446655440001'
   */
  @ApiProperty({
    description: 'Product SKU ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  skuId!: string;

  /**
   * SKU name (product name)
   * @example 'YULILY SHIELD INSURANCE'
   */
  @ApiProperty({
    description: 'Product name',
    example: 'YULILY SHIELD INSURANCE',
    required: false,
  })
  skuName?: string;

  /**
   * Coverage amount (as string to preserve precision)
   * @example '10000.0'
   */
  @ApiProperty({
    description: 'Coverage amount',
    example: '10000.0',
    required: false,
  })
  coverageAmt?: string;

  /**
   * Term duration in days
   * @example 90
   */
  @ApiProperty({
    description: 'Insurance term in days',
    example: 90,
    required: false,
  })
  termDays?: number;

  /**
   * Premium amount (as string to preserve precision)
   * @example '100.0'
   */
  @ApiProperty({
    description: 'Premium amount',
    example: '100.0',
  })
  premiumAmt!: string;

  /**
   * User email
   * @example 'user@example.com'
   */
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  /**
   * Current policy status
   * @example 'under_review'
   */
  @ApiProperty({
    description: 'Policy status',
    example: 'under_review',
    enum: ['pending', 'under_review', 'active', 'rejected', 'expired'],
  })
  status!: string;

  /**
   * Policy creation timestamp
   * @example '2024-01-01T00:00:00.000Z'
   */
  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: string;
}

/**
 * Paginated list response for admin policies
 */
export class AdminPolicyListResponse {
  /**
   * Total number of policies matching the filter
   * @example 150
   */
  @ApiProperty({
    description: 'Total number of policies',
    example: 150,
  })
  total!: number;

  /**
   * Current page number (1-indexed)
   * @example 1
   */
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  /**
   * Number of items per page
   * @example 20
   */
  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  pageSize!: number;

  /**
   * Array of policy items
   */
  @ApiProperty({
    description: 'List of policies',
    type: [AdminPolicyItem],
  })
  items!: AdminPolicyItem[];
}
