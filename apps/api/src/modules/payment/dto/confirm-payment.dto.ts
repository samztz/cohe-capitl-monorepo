/**
 * DTO for payment confirmation request
 */

import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Policy ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  policyId!: string;

  @ApiProperty({
    description: 'Transaction hash (0x + 64 hex characters)',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    pattern: '^0x[a-fA-F0-9]{64}$',
  })
  txHash!: string;
}
