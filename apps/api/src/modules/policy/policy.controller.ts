/**
 * Policy Controller
 *
 * Handles HTTP requests for insurance policy management.
 * Provides endpoints for creating and managing policies.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { PolicyService, Policy } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { PolicyResponseDto } from './dto/policy-response.dto';

/**
 * Validation schema for policy creation request
 * Validates SKU ID is a non-empty string
 */
const CreatePolicyRequestSchema = z.object({
  skuId: z.string().min(1, 'SKU_ID_REQUIRED'),
});

/**
 * Policy API Controller
 * Base route: /policy
 *
 * All endpoints require JWT authentication
 */
@ApiTags('Policy')
@Controller('policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  /**
   * Create a new policy draft
   *
   * POST /policy
   *
   * Creates a pending policy for the authenticated user.
   * Uses SKU's premium amount and enforces unique constraint per wallet+SKU.
   *
   * @param body - Request body containing skuId
   * @param req - Request with authenticated user info from JWT
   * @returns Created policy object
   * @throws BadRequestException if validation fails
   * @throws NotFoundException if SKU not found or inactive
   * @throws ConflictException (409) if policy already exists for this wallet+SKU
   *
   * @example
   * Request:
   * POST /policy
   * Authorization: Bearer <jwt-token>
   * { "skuId": "uuid" }
   *
   * Response:
   * {
   *   "id": "uuid",
   *   "userId": "uuid",
   *   "skuId": "uuid",
   *   "walletAddress": "0xabc...",
   *   "premiumAmt": "100.0",
   *   "status": "pending",
   *   "createdAt": "2024-01-01T00:00:00Z",
   *   "updatedAt": "2024-01-01T00:00:00Z"
   * }
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Create insurance policy',
    description:
      'Create a new insurance policy draft for the authenticated user. ' +
      'Enforces unique constraint: one policy per wallet address per SKU. ' +
      'Premium amount is copied from the selected product SKU.',
  })
  @ApiBody({ type: CreatePolicyDto })
  @ApiResponse({
    status: 201,
    description: 'Policy created successfully',
    type: PolicyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request - missing or invalid skuId',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'SKU not found or inactive',
  })
  @ApiResponse({
    status: 409,
    description: 'Policy already exists for this wallet and SKU',
  })
  async createPolicy(
    @Body() body: unknown,
    @Req() req: { user: AuthenticatedUser },
  ): Promise<Policy> {
    // Validate request body using Zod schema
    const parsed = CreatePolicyRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        errors: parsed.error.issues,
      });
    }

    const { skuId } = parsed.data;
    const { userId, address } = req.user;

    // Create policy with authenticated user's info
    return this.policyService.createPolicy({
      skuId,
      userId,
      walletAddress: address,
    });
  }
}
