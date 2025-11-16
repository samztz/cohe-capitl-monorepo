import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

/**
 * DTO for updating treasury address
 */
export class UpdateTreasuryDto {
  @ApiProperty({
    description: 'Treasury wallet address (must be valid Ethereum address)',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    pattern: '^0x[a-fA-F0-9]{40}$',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Address must be a valid Ethereum address (0x + 40 hex characters)',
  })
  address!: string;
}
