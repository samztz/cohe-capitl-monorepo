/**
 * Products Controller
 *
 * Handles HTTP requests for browsing insurance product SKUs.
 * Provides endpoints for listing available insurance plans.
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService, Sku } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';

/**
 * Products API Controller
 * Base route: /products
 */
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Get all active insurance products
   *
   * GET /products
   *
   * Returns a list of all insurance products with status='active'.
   * Products include pricing, coverage amounts, and blockchain details.
   * No authentication required - this is a public endpoint.
   *
   * @returns Array of active insurance product SKUs
   *
   * @example
   * Response:
   * [
   *   {
   *     "id": "uuid",
   *     "name": "BSC USDT Protection Plan",
   *     "chainId": 56,
   *     "tokenAddress": "0x55d398326f99059fF775485246999027B3197955",
   *     "termDays": 90,
   *     "premiumAmt": "100.0",
   *     "coverageAmt": "10000.0",
   *     "termsUrl": "https://example.com/terms",
   *     "status": "active",
   *     "createdAt": "2024-01-01T00:00:00Z",
   *     "updatedAt": "2024-01-01T00:00:00Z"
   *   }
   * ]
   */
  @Get()
  @ApiOperation({
    summary: 'Get active insurance products',
    description:
      'Retrieve all active insurance product SKUs. Returns product details including pricing, coverage, chain info, and terms. Public endpoint - no authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active insurance products',
    type: [ProductResponseDto],
  })
  async getProducts(): Promise<Sku[]> {
    return this.productsService.getActiveProducts();
  }
}
