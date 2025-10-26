/**
 * DTO for contract signing response
 */

import { ApiProperty } from '@nestjs/swagger';

export class ContractSignResponseDto {
  @ApiProperty({
    description:
      'SHA256 hash of the canonical JSON contract payload (0x-prefixed hex)',
    example:
      '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    pattern: '^0x[a-f0-9]{64}$',
  })
  contractHash!: string;
}
