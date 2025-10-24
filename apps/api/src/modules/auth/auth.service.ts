import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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

  private normalizeAddress(address: Address): Address {
    return address.toLowerCase() as Address;
  }
}
