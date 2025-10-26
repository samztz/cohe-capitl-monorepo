/**
 * DTO for signature verification response
 */

import { ApiProperty } from '@nestjs/swagger';

export class VerifyResponseDto {
  @ApiProperty({
    description: 'JWT token for authentication (15 minutes expiry)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token!: string;

  @ApiProperty({
    description: 'Normalized wallet address (lowercase)',
    example: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    pattern: '^0x[a-f0-9]{40}$',
  })
  address!: string;
}
