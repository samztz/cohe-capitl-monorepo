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
  Get,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { PolicyService, Policy, ContractSignResult } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { PolicyResponseDto } from './dto/policy-response.dto';
import { ContractSignDto } from './dto/contract-sign.dto';
import { ContractSignResponseDto } from './dto/contract-sign-response.dto';
import { CountdownResponseDto } from './dto/countdown-response.dto';

/**
 * Validation schema for policy creation request
 * Validates SKU ID is a non-empty string
 */
const CreatePolicyRequestSchema = z.object({
  skuId: z.string().min(1, 'SKU_ID_REQUIRED'),
});

/**
 * Validation schema for contract signing request
 * Validates policyId (UUID), contractPayload (object), and userSig (hex string)
 */
const ContractSignRequestSchema = z.object({
  policyId: z.string().uuid('POLICY_ID_MUST_BE_UUID'),
  contractPayload: z.record(z.string(), z.unknown()).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'CONTRACT_PAYLOAD_CANNOT_BE_EMPTY' },
  ),
  userSig: z.string().regex(/^0x[a-fA-F0-9]+$/, 'USER_SIG_MUST_BE_HEX'),
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

  /**
   * Sign a policy contract
   *
   * POST /policy/contract-sign
   *
   * Generates a canonical hash of the contract payload and stores it
   * with the user's signature. Updates policy status to "under_review".
   *
   * @param body - Request body containing policyId, contractPayload, userSig
   * @param req - Request with authenticated user info from JWT
   * @returns Contract hash (0x-prefixed)
   * @throws BadRequestException if validation fails or policy already signed
   * @throws NotFoundException if policy not found
   *
   * @example
   * Request:
   * POST /policy/contract-sign
   * Authorization: Bearer <jwt-token>
   * {
   *   "policyId": "uuid",
   *   "contractPayload": { "key": "value", ... },
   *   "userSig": "0x1234..."
   * }
   *
   * Response:
   * {
   *   "contractHash": "0xa1b2c3..."
   * }
   */
  @Post('contract-sign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Sign policy contract',
    description:
      'Generate canonical hash of contract payload, store signature, and update policy status to "under_review". ' +
      'Can only sign policies in "pending" status that belong to the authenticated user.',
  })
  @ApiBody({ type: ContractSignDto })
  @ApiResponse({
    status: 201,
    description: 'Contract signed successfully, hash returned',
    type: ContractSignResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid request - validation failed, policy already signed, or wrong status',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found',
  })
  async signContract(
    @Body() body: unknown,
    @Req() req: { user: AuthenticatedUser },
  ): Promise<ContractSignResult> {
    // Validate request body using Zod schema
    const parsed = ContractSignRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        errors: parsed.error.issues,
      });
    }

    const { policyId, contractPayload, userSig } = parsed.data;
    const { userId } = req.user;

    // Sign contract with authenticated user's ID
    return this.policyService.signContract({
      policyId,
      contractPayload,
      userSig,
      userId,
    });
  }

  /**
   * Get policy countdown
   *
   * GET /policy/:id/countdown
   *
   * Returns time remaining for active policies. Shows expired status if past endAt.
   *
   * Business logic:
   * - If status !== 'active': returns current status with secondsRemaining=0
   * - If status === 'active':
   *   - Calculates secondsRemaining = max(0, endAt - now)
   *   - Calculates daysRemaining = floor(secondsRemaining / 86400)
   *   - If now >= endAt: returns status='expired', secondsRemaining=0
   *
   * @param id - Policy UUID
   * @returns Countdown information with time remaining
   * @throws BadRequestException if ID format is invalid
   * @throws NotFoundException if policy not found
   *
   * @example
   * Request:
   * GET /policy/550e8400-e29b-41d4-a716-446655440000/countdown
   *
   * Response (Active):
   * {
   *   "policyId": "550e8400-e29b-41d4-a716-446655440000",
   *   "status": "active",
   *   "now": "2025-10-27T00:00:00.000Z",
   *   "startAt": "2025-10-27T00:00:00.000Z",
   *   "endAt": "2026-01-25T00:00:00.000Z",
   *   "secondsRemaining": 7776000,
   *   "daysRemaining": 90
   * }
   *
   * @example
   * Response (Expired):
   * {
   *   "policyId": "550e8400-e29b-41d4-a716-446655440000",
   *   "status": "expired",
   *   "now": "2026-02-01T00:00:00.000Z",
   *   "startAt": "2025-10-27T00:00:00.000Z",
   *   "endAt": "2026-01-25T00:00:00.000Z",
   *   "secondsRemaining": 0,
   *   "daysRemaining": 0
   * }
   *
   * @example
   * Response (Non-active):
   * {
   *   "policyId": "550e8400-e29b-41d4-a716-446655440000",
   *   "status": "under_review",
   *   "now": "2025-10-27T00:00:00.000Z",
   *   "secondsRemaining": 0,
   *   "daysRemaining": 0
   * }
   */
  @Get(':id/countdown')
  @ApiOperation({
    summary: 'Get policy countdown',
    description:
      'Returns time remaining for active policies. ' +
      'Shows expired status if past endAt. ' +
      'Returns secondsRemaining=0 for non-active policies.',
  })
  @ApiParam({
    name: 'id',
    description: 'Policy UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Countdown information retrieved successfully',
    type: CountdownResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid policy ID format',
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found',
  })
  async getCountdown(@Param('id') id: string): Promise<CountdownResponseDto> {
    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const parsed = uuidSchema.safeParse(id);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid policy ID format',
        errors: parsed.error.issues,
      });
    }

    // Get countdown
    const result = await this.policyService.getCountdown(parsed.data);

    // Format response
    return {
      policyId: result.policyId,
      status: result.status as any,
      now: result.now.toISOString(),
      startAt: result.startAt?.toISOString(),
      endAt: result.endAt?.toISOString(),
      secondsRemaining: result.secondsRemaining,
      daysRemaining: result.daysRemaining,
    };
  }
}
