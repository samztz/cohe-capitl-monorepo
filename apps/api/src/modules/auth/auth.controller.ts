/**
 * Authentication Controller
 *
 * Handles Sign-In with Ethereum (SIWE) authentication flow using EIP-4361.
 * Provides endpoints for nonce generation, signature verification, and user info retrieval.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { AuthenticatedUser } from './jwt.strategy';
import { RequestNonceDto } from './dto/request-nonce.dto';
import { VerifySignatureDto } from './dto/verify-signature.dto';
import { NonceResponseDto } from './dto/nonce-response.dto';
import { VerifyResponseDto } from './dto/verify-response.dto';
import { MeResponseDto } from './dto/me-response.dto';

/** Ethereum address type alias (0x + 40 hex characters) */
type Address = `0x${string}`;

/**
 * Validation schema for SIWE nonce request
 * Ensures wallet address is a valid Ethereum address format
 */
const SiweNonceRequestSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'WALLET_ADDRESS_INVALID'),
});

/**
 * Validation schema for SIWE signature verification
 * Validates SIWE message string and Ethereum signature (65 bytes in hex)
 */
const SiweVerifyRequestSchema = z.object({
  message: z.string().min(1, 'MESSAGE_REQUIRED'),
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]{130}$/, 'SIGNATURE_INVALID'),
});

/**
 * SIWE Authentication Controller
 * Base route: /auth/siwe
 */
@ApiTags('Auth')
@Controller('auth/siwe')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Request a nonce for SIWE authentication
   *
   * POST /auth/siwe/nonce
   *
   * Generates a unique nonce for the given wallet address. The nonce is stored
   * in the database and used to prevent replay attacks during signature verification.
   *
   * @param body - Request body containing wallet address
   * @returns Object containing the generated nonce
   * @throws BadRequestException if wallet address format is invalid
   */
  @Post('nonce')
  @ApiOperation({
    summary: 'Request SIWE nonce',
    description:
      'Generate a unique UUID nonce for Sign-In with Ethereum. The nonce is stored with the wallet address and must be included in the SIWE message.',
  })
  @ApiBody({ type: RequestNonceDto })
  @ApiResponse({
    status: 201,
    description: 'Nonce generated successfully',
    type: NonceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid wallet address format',
  })
  async createNonce(@Body() body: unknown): Promise<{ nonce: string }> {
    // Validate request body using Zod schema
    const parsed = SiweNonceRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({ message: 'Invalid wallet address' });
    }

    const walletAddress = parsed.data.walletAddress as Address;
    return this.authService.requestNonce(walletAddress);
  }

  /**
   * Verify SIWE signature and issue JWT token
   *
   * POST /auth/siwe/verify
   *
   * Verifies the SIWE message signature and issues a JWT token (15m expiry).
   * The signature is verified using the nonce previously requested for this address.
   * Upon successful verification, a new nonce is generated and the user's lastLoginAt is updated.
   *
   * @param body - Request body containing SIWE message and signature
   * @returns Object containing JWT token and normalized wallet address
   * @throws BadRequestException if message/signature is invalid or nonce doesn't match
   */
  @Post('verify')
  @ApiOperation({
    summary: 'Verify SIWE signature',
    description:
      'Verify the SIWE message signature and issue a JWT token (15 min expiry). Requires a valid SIWE message and Ethereum signature.',
  })
  @ApiBody({ type: VerifySignatureDto })
  @ApiResponse({
    status: 201,
    description: 'Signature verified, JWT token issued',
    type: VerifyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid SIWE message format, signature, or nonce mismatch',
  })
  async verify(
    @Body() body: unknown,
  ): Promise<{ token: string; address: string }> {
    // Validate request body using Zod schema
    console.log(body)
    const parsed = SiweVerifyRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid message or signature',
      });
    }

    return this.authService.verifySignature(
      parsed.data.message,
      parsed.data.signature,
    );
  }

  /**
   * Get current authenticated user information
   *
   * GET /auth/siwe/me
   *
   * Returns the authenticated user's ID and wallet address from the JWT token.
   * This endpoint is protected by JWT authentication guard.
   *
   * @param req - Request object containing authenticated user info
   * @returns Object containing user ID and wallet address
   * @throws UnauthorizedException if JWT token is missing or invalid (handled by guard)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Retrieve authenticated user information from JWT token. Requires valid JWT token in Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    type: MeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getMe(
    @Req() req: { user: AuthenticatedUser },
  ): Promise<{ userId: string; address: string }> {
    return {
      userId: req.user.userId,
      address: req.user.address,
    };
  }
}
