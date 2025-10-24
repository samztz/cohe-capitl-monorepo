import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from './auth.service';

type Address = `0x${string}`;

const SiweNonceRequestSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'WALLET_ADDRESS_INVALID'),
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
}
