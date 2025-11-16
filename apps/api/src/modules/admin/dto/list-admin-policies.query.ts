/**
 * Admin Policy List Query DTO
 *
 * Query parameters for listing policies with pagination and filtering
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PolicyStatus } from 'generated/prisma/enums';

/**
 * Query parameters for GET /admin/policies
 *
 * Supports pagination (page, pageSize) and filtering by status
 */
export class ListAdminPoliciesQuery {
  /**
   * Page number (1-indexed)
   * @example 1
   */
  @ApiProperty({
    description: 'Page number (1-indexed)',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  /**
   * Number of items per page
   * @example 20
   */
  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize must be an integer' })
  @Min(1, { message: 'pageSize must be at least 1' })
  pageSize?: number = 20;

  /**
   * Filter by policy status
   * @example 'PENDING_UNDERWRITING'
   */
  @ApiProperty({
    description: 'Filter by policy status',
    example: PolicyStatus.PENDING_UNDERWRITING,
    required: false,
    enum: PolicyStatus,
  })
  @IsOptional()
  @IsEnum(PolicyStatus, {
    message: `status must be one of: ${Object.values(PolicyStatus).join(', ')}`,
  })
  status?: PolicyStatus;

  /**
   * Search query (searches in policy ID, wallet address, and user email)
   * @example '0x1234'
   */
  @ApiProperty({
    description: 'Search query for policy ID, wallet address, or user email',
    example: '0x1234',
    required: false,
  })
  @IsOptional()
  q?: string;
}
