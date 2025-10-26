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
}
