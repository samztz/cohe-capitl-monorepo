/**
 * Admin Policy List Query DTO
 *
 * Query parameters for listing policies with pagination and filtering
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

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
   * @example 'under_review'
   */
  @ApiProperty({
    description: 'Filter by policy status',
    example: 'under_review',
    required: false,
    enum: ['pending', 'under_review', 'active', 'rejected', 'expired'],
  })
  @IsOptional()
  @IsString({ message: 'status must be a string' })
  @IsIn(['pending', 'under_review', 'active', 'rejected', 'expired'], {
    message:
      'status must be one of: pending, under_review, active, rejected, expired',
  })
  status?: string;
}
