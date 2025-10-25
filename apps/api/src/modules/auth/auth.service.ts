/**
 * Authentication Service
 *
 * Core business logic for Sign-In with Ethereum (SIWE) authentication.
 * Handles nonce generation, signature verification, JWT token issuance,
 * and user management for wallet-based authentication.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SiweMessage } from 'siwe';
import { sign } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

/** Ethereum address type alias (0x + 40 hex characters) */
type Address = `0x${string}`;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate and store a nonce for SIWE authentication
   *
   * Creates a unique UUID nonce and associates it with the wallet address.
   * If the user doesn't exist, creates a new user record. If they exist,
   * updates their nonce. This nonce will be used in the SIWE message to
   * prevent replay attacks.
   *
   * @param walletAddress - Ethereum wallet address (case-insensitive)
   * @returns Object containing the generated nonce UUID
   */
  async requestNonce(walletAddress: Address): Promise<{ nonce: string }> {
    const normalizedAddress = this.normalizeAddress(walletAddress);
    const nonce = randomUUID();

    // Upsert user: create if new, update nonce if existing
    await this.prisma.user.upsert({
      where: { walletAddress: normalizedAddress },
      create: { walletAddress: normalizedAddress, nonce },
      update: { nonce },
    });

    return { nonce };
  }

  /**
   * Verify SIWE signature and issue JWT token
   *
   * Performs the following steps:
   * 1. Parse the SIWE message (EIP-4361 format)
   * 2. Verify the cryptographic signature
   * 3. Validate the nonce matches the one stored for this address
   * 4. Generate a new nonce to prevent replay attacks
   * 5. Update user's lastLoginAt timestamp
   * 6. Issue a JWT token with 15-minute expiry
   *
   * @param message - SIWE message string in EIP-4361 format
   * @param signature - Ethereum signature (0x + 130 hex chars)
   * @returns Object containing JWT token and normalized wallet address
   * @throws BadRequestException if message format is invalid, signature verification fails,
   *                            user not found, or nonce doesn't match
   * @throws Error if JWT_SECRET environment variable is not configured
   */
  async verifySignature(
    message: string,
    signature: string,
  ): Promise<{ token: string; address: string }> {
    let siweMessage: SiweMessage;

    // Parse SIWE message (validates format according to EIP-4361)
    try {
      siweMessage = new SiweMessage(message);
    } catch {
      throw new BadRequestException({ message: 'Invalid SIWE message format' });
    }

    // Cryptographically verify the signature
    // This recovers the signer's address and compares it with siweMessage.address
    const verificationResult = await siweMessage.verify({ signature });

    if (!verificationResult.success) {
      throw new BadRequestException({ message: 'Invalid signature' });
    }

    const normalizedAddress = this.normalizeAddress(
      siweMessage.address as Address,
    );

    // Fetch user from database
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      throw new BadRequestException({ message: 'User not found' });
    }

    // Verify nonce to prevent replay attacks
    // The nonce in the signed message must match the one we generated
    if (user.nonce !== siweMessage.nonce) {
      throw new BadRequestException({ message: 'Nonce mismatch' });
    }

    // Refresh nonce and update last login timestamp
    // This invalidates the old nonce, preventing signature reuse
    const newNonce = randomUUID();
    await this.prisma.user.update({
      where: { walletAddress: normalizedAddress },
      data: {
        nonce: newNonce,
        lastLoginAt: new Date(),
      },
    });

    // Issue JWT token with 15-minute expiry
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

  /**
   * Find user by wallet address
   *
   * Retrieves minimal user information (id and walletAddress) by wallet address.
   * Used by the JWT strategy to validate tokens and attach user info to requests.
   *
   * @param walletAddress - Ethereum wallet address to search for
   * @returns User object with id and walletAddress, or null if not found
   */
  async findUserByAddress(
    walletAddress: Address,
  ): Promise<{ id: string; walletAddress: string } | null> {
    const normalizedAddress = this.normalizeAddress(walletAddress);
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: { id: true, walletAddress: true },
    });

    // Ensure both id and walletAddress are present
    if (!user || !user.id || !user.walletAddress) {
      return null;
    }

    return {
      id: user.id,
      walletAddress: user.walletAddress,
    };
  }

  /**
   * Normalize Ethereum address to lowercase
   *
   * Ethereum addresses are case-insensitive but checksummed addresses
   * contain uppercase characters. We normalize to lowercase for consistent
   * database storage and comparison.
   *
   * @param address - Ethereum address in any case
   * @returns Lowercase Ethereum address
   * @private
   */
  private normalizeAddress(address: Address): Address {
    return address.toLowerCase() as Address;
  }
}
