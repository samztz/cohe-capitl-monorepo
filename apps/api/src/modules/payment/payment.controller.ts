/**
 * Payment Controller
 *
 * Handles HTTP requests for payment confirmation.
 * Provides endpoint for on-chain payment verification.
 */

import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { z } from 'zod';
import { PaymentService, Payment } from './payment.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

/**
 * Validation schema for payment confirmation request
 * Validates policyId (UUID) and txHash (0x + 64 hex)
 */
const ConfirmPaymentRequestSchema = z.object({
  policyId: z.string().uuid('POLICY_ID_MUST_BE_UUID'),
  txHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'TX_HASH_MUST_BE_VALID_HEX'),
});

/**
 * Payment API Controller
 * Base route: /payment
 */
@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Confirm payment with on-chain verification
   *
   * POST /payment/confirm
   *
   * Verifies ERC20 transfer transaction on-chain and confirms payment.
   * Validates token address, sender, recipient, and amount match policy.
   * Updates policy status to "under_review" on successful verification.
   *
   * @param body - Request body containing policyId and txHash
   * @returns Confirmed payment record
   * @throws BadRequestException if validation or verification fails
   * @throws NotFoundException if policy not found
   *
   * @example
   * Request:
   * POST /payment/confirm
   * {
   *   "policyId": "550e8400-e29b-41d4-a716-446655440000",
   *   "txHash": "0x1234...abcdef"
   * }
   *
   * Response:
   * {
   *   "id": "payment-uuid",
   *   "policyId": "policy-uuid",
   *   "txHash": "0x1234...abcdef",
   *   "chainId": 56,
   *   "tokenAddress": "0x55d3...",
   *   "fromAddress": "0xf39f...",
   *   "toAddress": "0x8626...",
   *   "amount": "100000000000000000000",
   *   "confirmed": true,
   *   "createdAt": "2024-01-01T00:00:00Z",
   *   "updatedAt": "2024-01-01T00:00:00Z"
   * }
   */
  @Post('confirm')
  @ApiOperation({
    summary: 'Confirm payment with on-chain verification',
    description:
      'Verifies ERC20 transfer transaction on BSC and confirms payment. ' +
      'Validates token address, from address (policy wallet), to address (treasury), ' +
      'and amount (premium) match expected values. ' +
      'Creates/updates payment record with confirmed=true and sets policy status to "under_review".',
  })
  @ApiBody({ type: ConfirmPaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment confirmed successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid request - validation failed, transaction not found, or verification mismatch',
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found',
  })
  async confirmPayment(@Body() body: unknown): Promise<Payment> {
    // Validate request body using Zod schema
    const parsed = ConfirmPaymentRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        errors: parsed.error.issues,
      });
    }

    const { policyId, txHash } = parsed.data;

    // Confirm payment with on-chain verification
    return this.paymentService.confirmPayment({
      policyId,
      txHash,
    });
  }
}
