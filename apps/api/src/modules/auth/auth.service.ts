import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SiweMessage } from 'siwe';
import { sign } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

type Address = `0x${string}`;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async requestNonce(walletAddress: Address): Promise<{ nonce: string }> {
    const normalizedAddress = this.normalizeAddress(walletAddress);
    const nonce = randomUUID();

    await this.prisma.user.upsert({
      where: { walletAddress: normalizedAddress },
      create: { walletAddress: normalizedAddress, nonce },
      update: { nonce },
    });

    return { nonce };
  }

  async verifySignature(
    message: string,
    signature: string,
  ): Promise<{ token: string; address: string }> {
    let siweMessage: SiweMessage;

    try {
      siweMessage = new SiweMessage(message);
    } catch {
      throw new BadRequestException({ message: 'Invalid SIWE message format' });
    }

    // Verify signature and ensure recovered address matches siwe.address
    const verificationResult = await siweMessage.verify({ signature });

    if (!verificationResult.success) {
      throw new BadRequestException({ message: 'Invalid signature' });
    }

    const normalizedAddress = this.normalizeAddress(
      siweMessage.address as Address,
    );

    // Fetch user and verify nonce
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      throw new BadRequestException({ message: 'User not found' });
    }

    if (user.nonce !== siweMessage.nonce) {
      throw new BadRequestException({ message: 'Nonce mismatch' });
    }

    // Generate new nonce and update lastLoginAt
    const newNonce = randomUUID();
    await this.prisma.user.update({
      where: { walletAddress: normalizedAddress },
      data: {
        nonce: newNonce,
        lastLoginAt: new Date(),
      },
    });

    // Issue JWT with 15m expiry
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = sign(
      { address: normalizedAddress },
      jwtSecret,
      { expiresIn: '15m' },
    );

    return { token, address: normalizedAddress };
  }

  private normalizeAddress(address: Address): Address {
    return address.toLowerCase() as Address;
  }
}
