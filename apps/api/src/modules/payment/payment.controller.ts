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
   * Supports "Review then Pay" workflow.
   * Verifies ERC20 transfer transaction on-chain and confirms payment.
   * Only allows payment for policies in APPROVED_AWAITING_PAYMENT status within paymentDeadline.
   * Activates policy on successful payment (status → ACTIVE, sets startAt/endAt).
   *
   * Business rules:
   * - Policy must be in APPROVED_AWAITING_PAYMENT status
   * - Payment must be made before paymentDeadline
   * - Validates token address, sender, recipient, and amount match policy
   * - Idempotent: duplicate txHash returns existing payment without error
   * - On success: activates policy (status=ACTIVE, startAt=now, endAt=now+termDays)
   *
   * @param body - Request body containing policyId and txHash
   * @returns Confirmed payment record
   * @throws BadRequestException if policy not approved, payment expired, or verification fails
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
   * Response (Success):
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
   *
   * @example
   * Error (Policy not approved):
   * 400 {
   *   "code": "INVALID_STATUS",
   *   "message": "Policy status is \"PENDING_UNDERWRITING\" - only policies with status \"APPROVED_AWAITING_PAYMENT\" can confirm payment"
   * }
   *
   * @example
   * Error (Payment expired):
   * 400 {
   *   "code": "PAYMENT_EXPIRED",
   *   "message": "Payment deadline has passed (deadline: 2025-01-01T00:00:00.000Z, now: 2025-01-02T00:00:00.000Z)"
   * }
   */
  @Post('confirm')
  @ApiOperation({
    summary: 'Confirm payment - Review then Pay workflow',
    description:
      'Verifies ERC20 transfer transaction on BSC and confirms payment. ' +
      'Supports "Review then Pay" workflow:\n' +
      '- Only allows payment for APPROVED_AWAITING_PAYMENT policies\n' +
      '- Payment must be made before paymentDeadline\n' +
      '- Validates token address, from/to addresses, and amount\n' +
      '- Idempotent: duplicate txHash returns existing payment\n' +
      '- On success: activates policy (status=ACTIVE, sets startAt/endAt)',
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
      'Invalid request - validation failed, policy not approved, payment expired, transaction not found, or verification mismatch',
    schema: {
      properties: {
        code: {
          type: 'string',
          enum: ['INVALID_STATUS', 'PAYMENT_EXPIRED', 'MISSING_DEADLINE'],
          example: 'INVALID_STATUS',
        },
        message: {
          type: 'string',
          example:
            'Policy status is "PENDING_UNDERWRITING" - only policies with status "APPROVED_AWAITING_PAYMENT" can confirm payment',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Policy not found',
    schema: {
      properties: {
        code: { type: 'string', example: 'NOT_FOUND' },
        message: { type: 'string', example: 'Policy with ID xxx not found' },
      },
    },
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
