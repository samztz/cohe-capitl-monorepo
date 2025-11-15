/**
 * DTO for policy response
 *
 * Supports "Review then Pay" workflow with strict PolicyStatus enum
 */

import { ApiProperty } from '@nestjs/swagger';
import { PolicyStatus } from 'generated/prisma/enums';

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
    description:
      'Policy status - supports "Review then Pay" workflow\n\n' +
      '- DRAFT: Initial state after policy creation\n' +
      '- PENDING_UNDERWRITING: User signed contract, awaiting admin review\n' +
      '- APPROVED_AWAITING_PAYMENT: Admin approved, awaiting payment before paymentDeadline\n' +
      '- ACTIVE: Payment received, policy active from startAt to endAt\n' +
      '- REJECTED: Admin rejected during review\n' +
      '- EXPIRED_UNPAID: Payment not received before paymentDeadline\n' +
      '- EXPIRED: Policy expired after endAt',
    example: PolicyStatus.DRAFT,
    enum: PolicyStatus,
  })
  status!: PolicyStatus;

  @ApiProperty({
    description: 'Contract hash (0x-prefixed, set after signing)',
    example: '0xa1b2c3d4e5f6...',
    required: false,
  })
  contractHash?: string;

  @ApiProperty({
    description: 'Coverage start time (set when policy becomes ACTIVE)',
    example: '2025-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
    required: false,
  })
  startAt?: Date;

  @ApiProperty({
    description: 'Coverage end time (set when policy becomes ACTIVE)',
    example: '2025-04-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
    required: false,
  })
  endAt?: Date;

  @ApiProperty({
    description:
      'Payment deadline (set when admin approves, for APPROVED_AWAITING_PAYMENT status)',
    example: '2025-01-15T23:59:59.000Z',
    type: String,
    format: 'date-time',
    required: false,
  })
  paymentDeadline?: Date;

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
