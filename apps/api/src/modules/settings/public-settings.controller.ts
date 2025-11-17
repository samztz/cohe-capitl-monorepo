/**
 * Public Settings Controller
 *
 * Public endpoints for retrieving read-only application settings.
 * Does not require authentication.
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('Public Settings')
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get treasury address (public)
   *
   * Returns the configured treasury address for receiving payments.
   * This is a public endpoint accessible without authentication.
   * Priority: Database > Environment variable.
   */
  @Get('treasury-address')
  @ApiOperation({ summary: 'Get treasury address (public)' })
  @ApiResponse({
    status: 200,
    description: 'Treasury address retrieved',
    schema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          nullable: true,
          example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        },
      },
    },
  })
  async getTreasuryAddress(): Promise<{ address: string | null }> {
    const address = await this.settingsService.getTreasuryAddress();
    return { address };
  }
}
