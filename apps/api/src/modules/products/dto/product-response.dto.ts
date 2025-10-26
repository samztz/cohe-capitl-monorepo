/**
 * DTO for product (SKU) response
 */

import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Product SKU ID',
    example: 'bsc-usdt-plan-seed',
  })
  id!: string;

  @ApiProperty({
    description: 'Human-readable product name',
    example: 'BSC USDT Insurance - Seed Round',
  })
  name!: string;

  @ApiProperty({
    description: 'Blockchain chain ID',
    example: 56,
  })
  chainId!: number;

  @ApiProperty({
    description: 'BEP-20/ERC-20 token contract address',
    example: '0x55d398326f99059fF775485246999027B3197955',
    pattern: '^0x[a-fA-F0-9]{40}$',
  })
  tokenAddress!: string;

  @ApiProperty({
    description: 'Token decimals',
    example: 18,
  })
  decimals!: number;

  @ApiProperty({
    description: 'Premium amount (in token smallest unit, as string)',
    example: '100.0',
  })
  premiumAmt!: string;

  @ApiProperty({
    description: 'Coverage amount (in token smallest unit, as string)',
    example: '10000.0',
  })
  coverageAmt!: string;

  @ApiProperty({
    description: 'Policy term in days',
    example: 90,
  })
  termDays!: number;

  @ApiProperty({
    description: 'Product status',
    example: 'active',
    enum: ['active', 'inactive'],
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
