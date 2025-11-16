/**
 * Settings Service
 *
 * Manages application settings stored in database.
 * Key-value store for configuration like treasury address.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const TREASURY_KEY = 'treasury_address';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get treasury address
   *
   * Priority:
   * 1. Database (Setting table)
   * 2. Environment variable (TREASURY_ADDRESS)
   * 3. null (not configured)
   *
   * @returns Treasury address or null
   */
  async getTreasuryAddress(): Promise<string | null> {
    try {
      // Try database first
      const setting = await this.prisma.setting.findUnique({
        where: { key: TREASURY_KEY },
      });

      if (setting?.value) {
        this.logger.log(`Treasury address loaded from database: ${setting.value}`);
        return setting.value;
      }

      // Fallback to env
      const envAddress = this.config.get<string>('TREASURY_ADDRESS');
      if (envAddress) {
        this.logger.log(`Treasury address loaded from env: ${envAddress}`);
        return envAddress;
      }

      this.logger.warn('Treasury address not configured');
      return null;
    } catch (error) {
      this.logger.error('Failed to get treasury address', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback to env on error
      return this.config.get<string>('TREASURY_ADDRESS') || null;
    }
  }

  /**
   * Set treasury address
   *
   * Stores in database (upsert).
   *
   * @param address - Treasury wallet address
   */
  async setTreasuryAddress(address: string): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key: TREASURY_KEY },
      update: { value: address },
      create: {
        key: TREASURY_KEY,
        value: address,
      },
    });

    this.logger.log(`Treasury address updated: ${address}`);
  }

  /**
   * Get setting by key
   */
  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  /**
   * Set setting by key
   */
  async setSetting(key: string, value: string): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
