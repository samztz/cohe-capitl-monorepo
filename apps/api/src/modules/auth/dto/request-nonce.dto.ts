/**
 * DTO for requesting a SIWE nonce
 */

import { ApiProperty } from '@nestjs/swagger';

export class RequestNonceDto {
  @ApiProperty({
    description: 'Ethereum wallet address (checksummed or lowercase)',
    example: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    pattern: '^0x[a-fA-F0-9]{40}$',
  })
  walletAddress!: string;
}
