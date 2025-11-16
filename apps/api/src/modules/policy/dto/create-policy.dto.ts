/**
 * DTO for creating a policy
 */

import { ApiProperty } from '@nestjs/swagger';

export class CreatePolicyDto {
  @ApiProperty({
    description: 'Insurance product SKU ID',
    example: 'bsc-usdt-plan-seed',
  })
  skuId!: string;

  @ApiProperty({
    description: 'User-specified premium amount in USDT (as decimal string)',
    example: '100.50',
  })
  premiumAmt!: string;

  @ApiProperty({
    description: 'User-specified coverage amount in USDT (as decimal string)',
    example: '10000.00',
  })
  coverageAmt!: string;
}
