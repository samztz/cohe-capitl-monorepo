/**
 * Blockchain Service
 *
 * Handles on-chain transaction verification for ERC20 token transfers.
 * Uses ethers v6 to fetch and parse transaction receipts.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonRpcProvider, TransactionReceipt, Interface } from 'ethers';

/**
 * ERC20 Transfer event signature
 * event Transfer(address indexed from, address indexed to, uint256 value)
 */
const ERC20_TRANSFER_EVENT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

/**
 * Verified transfer details from on-chain transaction
 */
export interface VerifiedTransfer {
  tokenAddress: string; // Contract address (lowercase)
  from: string; // Sender address (lowercase)
  to: string; // Recipient address (lowercase)
  amount: string; // Amount in token smallest unit (wei)
  chainId: number; // Chain ID
}

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly provider: JsonRpcProvider;
  private readonly treasuryAddress: string;

  constructor(private readonly config: ConfigService) {
    const rpcUrl = this.config.get<string>('RPC_BSC');
    if (!rpcUrl) {
      throw new Error('RPC_BSC environment variable is not set');
    }

    const treasury = this.config.get<string>('TREASURY_ADDRESS');
    if (!treasury) {
      throw new Error('TREASURY_ADDRESS environment variable is not set');
    }

    this.provider = new JsonRpcProvider(rpcUrl);
    this.treasuryAddress = treasury.toLowerCase();
    this.logger.log(`Blockchain service initialized with RPC: ${rpcUrl}`);
  }

  /**
   * Verify ERC20 transfer transaction
   *
   * Fetches transaction receipt and validates:
   * 1. Transaction exists and succeeded
   * 2. Contains ERC20 Transfer event
   * 3. Transfer to treasury address matches expected
   * 4. Token address matches expected
   * 5. From address matches expected
   * 6. Amount matches expected (with 18 decimals)
   *
   * @param txHash - Transaction hash (0x-prefixed)
   * @param expectedTokenAddress - Expected token contract address
   * @param expectedFromAddress - Expected sender address
   * @param expectedAmount - Expected amount in token smallest unit (wei as string)
   * @returns Verified transfer details
   * @throws BadRequestException if verification fails
   */
  async verifyTransfer(
    txHash: string,
    expectedTokenAddress: string,
    expectedFromAddress: string,
    expectedAmount: string,
  ): Promise<VerifiedTransfer> {
    // Normalize addresses to lowercase
    const normalizedTokenAddress = expectedTokenAddress.toLowerCase();
    const normalizedFromAddress = expectedFromAddress.toLowerCase();

    // Fetch transaction receipt
    const receipt = await this.provider.getTransactionReceipt(txHash);

    if (!receipt) {
      throw new BadRequestException(
        `Transaction ${txHash} not found on chain`,
      );
    }

    // Check transaction succeeded
    if (receipt.status !== 1) {
      throw new BadRequestException(
        `Transaction ${txHash} failed (status: ${receipt.status})`,
      );
    }

    // Parse Transfer events
    const transferInterface = new Interface(ERC20_TRANSFER_EVENT_ABI);
    const transferLogs = receipt.logs
      .map((log) => {
        try {
          const parsed = transferInterface.parseLog({
            topics: [...log.topics],
            data: log.data,
          });
          return {
            tokenAddress: log.address.toLowerCase(),
            from: parsed?.args[0]?.toLowerCase() ?? '',
            to: parsed?.args[1]?.toLowerCase() ?? '',
            amount: parsed?.args[2]?.toString() ?? '0',
          };
        } catch {
          // Not a Transfer event, skip
          return null;
        }
      })
      .filter((log) => log !== null);

    if (transferLogs.length === 0) {
      throw new BadRequestException(
        `No Transfer events found in transaction ${txHash}`,
      );
    }

    // Find matching transfer to treasury
    const matchingTransfer = transferLogs.find(
      (log) =>
        log!.to === this.treasuryAddress &&
        log!.tokenAddress === normalizedTokenAddress,
    );

    if (!matchingTransfer) {
      throw new BadRequestException(
        `No Transfer to treasury (${this.treasuryAddress}) found for token ${normalizedTokenAddress} in transaction ${txHash}`,
      );
    }

    // Validate from address
    if (matchingTransfer.from !== normalizedFromAddress) {
      throw new BadRequestException(
        `Transfer from address mismatch: expected ${normalizedFromAddress}, got ${matchingTransfer.from}`,
      );
    }

    // Validate amount
    if (matchingTransfer.amount !== expectedAmount) {
      throw new BadRequestException(
        `Transfer amount mismatch: expected ${expectedAmount}, got ${matchingTransfer.amount}`,
      );
    }

    // Get chain ID
    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);

    this.logger.log(
      `Verified transfer: ${matchingTransfer.amount} tokens from ${matchingTransfer.from} to ${matchingTransfer.to} (tx: ${txHash})`,
    );

    return {
      tokenAddress: matchingTransfer.tokenAddress,
      from: matchingTransfer.from,
      to: matchingTransfer.to,
      amount: matchingTransfer.amount,
      chainId,
    };
  }
}
