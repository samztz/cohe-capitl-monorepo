/**
 * DTO for /me endpoint response
 */

import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty({
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  userId!: string;

  @ApiProperty({
    description: 'Wallet address (lowercase)',
    example: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    pattern: '^0x[a-f0-9]{40}$',
  })
  address!: string;
}
