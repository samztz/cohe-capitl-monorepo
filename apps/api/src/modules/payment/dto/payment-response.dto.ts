/**
 * DTO for payment confirmation response
 */

import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Payment ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Policy ID (UUID)',
    example: '650e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  policyId!: string;

  @ApiProperty({
    description: 'Transaction hash',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  txHash!: string;

  @ApiProperty({
    description: 'Chain ID',
    example: 56,
  })
  chainId!: number;

  @ApiProperty({
    description: 'Token contract address',
    example: '0x55d398326f99059fF775485246999027B3197955',
  })
  tokenAddress!: string;

  @ApiProperty({
    description: 'From address (payer)',
    example: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  })
  fromAddress!: string;

  @ApiProperty({
    description: 'To address (treasury)',
    example: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
  })
  toAddress!: string;

  @ApiProperty({
    description: 'Payment amount (in token smallest unit, as string)',
    example: '100.0',
  })
  amount!: string;

  @ApiProperty({
    description: 'Confirmation status',
    example: true,
  })
  confirmed!: boolean;

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
