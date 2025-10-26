/**
 * DTO for nonce response
 */

import { ApiProperty } from '@nestjs/swagger';

export class NonceResponseDto {
  @ApiProperty({
    description: 'UUID nonce for SIWE message',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  nonce!: string;
}
