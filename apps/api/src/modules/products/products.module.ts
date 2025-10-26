/**
 * Products Module
 *
 * Provides insurance product SKU browsing functionality.
 * Manages the catalog of available insurance plans.
 *
 * This module:
 * - Exposes public endpoints for browsing products
 * - Queries Prisma for SKU data
 * - Filters products by status (active/inactive)
 *
 * No authentication required for product listing.
 */

import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

/**
 * Products Module Configuration
 *
 * Controllers:
 * - ProductsController: Handles GET /products
 *
 * Providers:
 * - ProductsService: Business logic for SKU queries
 *
 * Dependencies:
 * - PrismaModule: Automatically available (global module)
 */
@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
