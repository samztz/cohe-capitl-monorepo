/**
 * DTO for verifying SIWE signature
 */

import { ApiProperty } from '@nestjs/swagger';

export class VerifySignatureDto {
  @ApiProperty({
    description: 'SIWE message string in EIP-4361 format',
    example: `localhost wants you to sign in with your Ethereum account:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

URI: http://localhost:3001
Version: 1
Chain ID: 1
Nonce: 550e8400-e29b-41d4-a716-446655440000
Issued At: 2024-01-01T00:00:00.000Z`,
  })
  message!: string;

  @ApiProperty({
    description: 'Ethereum signature (0x + 130 hex characters)',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
    pattern: '^0x[a-fA-F0-9]{130}$',
  })
  signature!: string;
}
