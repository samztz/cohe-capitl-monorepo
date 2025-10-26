/**
 * Products Service
 *
 * Business logic for managing insurance product SKUs.
 * Handles querying and filtering of available insurance products.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * SKU status type
 * Controls product visibility and availability
 */
type SkuStatus = 'active' | 'inactive';

/**
 * Insurance product SKU
 * Represents an insurance plan with coverage details and pricing
 */
export interface Sku {
  id: string;
  name: string;
  chainId: number;
  tokenAddress: string;
  termDays: number;
  premiumAmt: string; // Decimal as string for JSON serialization
  coverageAmt: string; // Decimal as string for JSON serialization
  termsUrl: string;
  status: SkuStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active insurance products
   *
   * Returns only SKUs with status='active', sorted by name.
   * Decimal amounts are converted to strings for safe JSON serialization.
   *
   * @returns List of active insurance product SKUs
   */
  async getActiveProducts(): Promise<Sku[]> {
    const skus = await this.prisma.sku.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });

    // Convert Decimal to string for JSON serialization
    return skus.map((sku) => ({
      ...sku,
      premiumAmt: sku.premiumAmt.toString(),
      coverageAmt: sku.coverageAmt.toString(),
      status: sku.status as SkuStatus,
    }));
  }
}
