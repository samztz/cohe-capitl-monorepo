/**
 * Settings Controller
 *
 * Admin-only endpoints for managing application settings.
 */

import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SettingsService } from './settings.service';
import { UpdateTreasuryDto } from './dto/update-treasury.dto';

@ApiTags('Admin Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get treasury address
   *
   * Returns the configured treasury address for receiving payments.
   * Priority: Database > Environment variable.
   */
  @Get('treasury')
  @ApiOperation({ summary: 'Get treasury address' })
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

  /**
   * Update treasury address
   *
   * Admin-only endpoint to configure the treasury address.
   * This address will receive all insurance premium payments.
   */
  @Put('treasury')
  @ApiOperation({ summary: 'Update treasury address' })
  @ApiResponse({
    status: 200,
    description: 'Treasury address updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        address: { type: 'string', example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address format',
  })
  async updateTreasuryAddress(
    @Body() dto: UpdateTreasuryDto,
  ): Promise<{ success: boolean; address: string }> {
    await this.settingsService.setTreasuryAddress(dto.address.toLowerCase());
    return {
      success: true,
      address: dto.address.toLowerCase(),
    };
  }
}
