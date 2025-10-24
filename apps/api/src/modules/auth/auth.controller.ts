import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from './auth.service';

type Address = `0x${string}`;

const SiweNonceRequestSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'WALLET_ADDRESS_INVALID'),
});

const SiweVerifyRequestSchema = z.object({
  message: z.string().min(1, 'MESSAGE_REQUIRED'),
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]{130}$/, 'SIGNATURE_INVALID'),
});

@Controller('auth/siwe')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('nonce')
  async createNonce(@Body() body: unknown): Promise<{ nonce: string }> {
    const parsed = SiweNonceRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({ message: 'Invalid wallet address' });
    }

    const walletAddress = parsed.data.walletAddress as Address;
    return this.authService.requestNonce(walletAddress);
  }

  @Post('verify')
  async verify(
    @Body() body: unknown,
  ): Promise<{ token: string; address: string }> {
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
}
