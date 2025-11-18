/**
 * DTO for contract signing request
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ContractSignDto {
  @ApiProperty({
    description: 'Policy ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  policyId!: string;

  @ApiProperty({
    description:
      'Contract payload (arbitrary JSON object - will be canonicalized for hashing)',
    example: {
      policyId: '550e8400-e29b-41d4-a716-446655440000',
      walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      premiumAmount: '100.0',
      coverageAmount: '10000.0',
      termDays: 90,
      timestamp: 1704067200000,
    },
  })
  contractPayload!: Record<string, unknown>;

  @ApiProperty({
    description:
      'User signature (0x + hex string, signature of the contractHash)',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
    pattern: '^0x[a-fA-F0-9]+$',
  })
  userSig!: string;

  @ApiProperty({
    description: 'Handwritten signature image as Base64-encoded PNG (optional)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
    required: false,
  })
  @IsOptional()
  @IsString()
  signatureImageBase64?: string;

  @ApiProperty({
    description: 'Wallet address at time of signature (optional)',
    example: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    required: false,
  })
  @IsOptional()
  @IsString()
  signatureWalletAddress?: string;

  @ApiProperty({
    description: 'EIP-712 typed data signature (optional, for future use)',
    example: '0x...',
    required: false,
  })
  @IsOptional()
  @IsString()
  typedDataSignature?: string;
}
