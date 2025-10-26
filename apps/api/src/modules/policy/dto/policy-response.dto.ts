/**
 * DTO for policy response
 */

import { ApiProperty } from '@nestjs/swagger';

export class PolicyResponseDto {
  @ApiProperty({
    description: 'Policy ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'User ID (UUID)',
    example: '650e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  userId!: string;

  @ApiProperty({
    description: 'Product SKU ID',
    example: 'bsc-usdt-plan-seed',
  })
  skuId!: string;

  @ApiProperty({
    description: 'Wallet address (lowercase)',
    example: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    pattern: '^0x[a-f0-9]{40}$',
  })
  walletAddress!: string;

  @ApiProperty({
    description: 'Premium amount (in token smallest unit, as string)',
    example: '100.0',
  })
  premiumAmt!: string;

  @ApiProperty({
    description: 'Policy status',
    example: 'pending',
    enum: ['pending', 'under_review', 'active', 'rejected', 'expired'],
  })
  status!: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: Date;
}
