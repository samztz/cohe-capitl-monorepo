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

/**
 * Fallback RPC endpoints for BSC Mainnet
 */
const BSC_MAINNET_RPC_FALLBACKS = [
  'https://bsc-dataseed.binance.org',
  'https://bsc.publicnode.com',
  'https://bsc-rpc.publicnode.com',
  'https://bsc.drpc.org',
  'https://binance.llamarpc.com',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc-dataseed1.ninicoin.io',
];

/**
 * Fallback RPC endpoints for BSC Testnet
 */
const BSC_TESTNET_RPC_FALLBACKS = [
  'https://bsc-testnet.publicnode.com',
  'https://bsc-testnet-rpc.publicnode.com',
  'https://bsc-testnet.public.blastapi.io',
  'https://data-seed-prebsc-2-s1.binance.org:8545',
  'https://data-seed-prebsc-1-s2.binance.org:8545',
];

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly providers: Map<number, JsonRpcProvider> = new Map();
  private readonly rpcFallbacks: Map<number, string[]> = new Map();

  constructor(private readonly config: ConfigService) {
    // Initialize BSC Mainnet provider with fallback list
    const rpcBscMainnet = this.config.get<string>('RPC_BSC');
    const mainnetFallbacks = rpcBscMainnet
      ? [rpcBscMainnet, ...BSC_MAINNET_RPC_FALLBACKS]
      : BSC_MAINNET_RPC_FALLBACKS;

    this.rpcFallbacks.set(56, mainnetFallbacks);
    this.providers.set(56, new JsonRpcProvider(mainnetFallbacks[0], 56, { staticNetwork: true }));
    this.logger.log(`BSC Mainnet provider initialized: ${mainnetFallbacks[0]}`);
    this.logger.log(`BSC Mainnet has ${mainnetFallbacks.length} fallback RPCs configured`);

    // Initialize BSC Testnet provider with fallback list
    const rpcBscTestnet = this.config.get<string>('RPC_BSC_TESTNET');
    const testnetFallbacks = rpcBscTestnet
      ? [rpcBscTestnet, ...BSC_TESTNET_RPC_FALLBACKS]
      : BSC_TESTNET_RPC_FALLBACKS;

    this.rpcFallbacks.set(97, testnetFallbacks);
    this.providers.set(97, new JsonRpcProvider(testnetFallbacks[0], 97, { staticNetwork: true }));
    this.logger.log(`BSC Testnet provider initialized: ${testnetFallbacks[0]}`);
    this.logger.log(`BSC Testnet has ${testnetFallbacks.length} fallback RPCs configured`);
  }

  /**
   * Get provider for specific chain ID with automatic fallback on failure
   */
  private async getProviderWithFallback(chainId: number): Promise<JsonRpcProvider> {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No RPC provider configured for chain ID ${chainId}`);
    }

    // Test if provider is working with a simple call
    try {
      await provider.getBlockNumber();
      return provider;
    } catch (error) {
      this.logger.warn(`Primary RPC failed for chain ${chainId}, trying fallback...`);

      // Try fallback RPCs if available
      const fallbacks = this.rpcFallbacks.get(chainId);
      if (!fallbacks || fallbacks.length <= 1) {
        throw error; // No fallbacks available
      }

      // Try each fallback RPC
      for (let i = 1; i < fallbacks.length; i++) {
        const fallbackUrl = fallbacks[i];
        try {
          this.logger.log(`Trying fallback RPC ${i}/${fallbacks.length - 1}: ${fallbackUrl}`);
          const fallbackProvider = new JsonRpcProvider(fallbackUrl, chainId, { staticNetwork: true });
          await fallbackProvider.getBlockNumber(); // Test connection

          // Success! Replace primary provider
          this.providers.set(chainId, fallbackProvider);
          this.logger.log(`Successfully switched to fallback RPC: ${fallbackUrl}`);
          return fallbackProvider;
        } catch (fallbackError) {
          const errorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          this.logger.warn(`Fallback RPC ${fallbackUrl} failed: ${errorMsg}`);
          continue;
        }
      }

      // All fallbacks failed
      throw new Error(`All RPC endpoints failed for chain ${chainId}`);
    }
  }

  /**
   * Get provider for specific chain ID
   */
  private getProvider(chainId: number): JsonRpcProvider {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`No RPC provider configured for chain ID ${chainId}`);
    }
    return provider;
  }

  /**
   * Verify transfer transaction (both ERC20 and Native token)
   *
   * Fetches transaction receipt and validates:
   * 1. Transaction exists and succeeded
   * 2. For ERC20: Contains Transfer event with correct token/from/to/amount
   * 3. For Native: Direct transfer with correct from/to/amount
   * 4. Transfer to treasury address matches expected
   *
   * @param txHash - Transaction hash (0x-prefixed)
   * @param chainId - Chain ID to verify on
   * @param expectedTokenAddress - Expected token contract address (use "0x0" for native token)
   * @param expectedFromAddress - Expected sender address
   * @param expectedAmount - Expected amount in token smallest unit (wei as string)
   * @param expectedTreasuryAddress - Expected treasury recipient address
   * @returns Verified transfer details
   * @throws BadRequestException if verification fails
   */
  async verifyTransfer(
    txHash: string,
    chainId: number,
    expectedTokenAddress: string,
    expectedFromAddress: string,
    expectedAmount: string,
    expectedTreasuryAddress: string,
  ): Promise<VerifiedTransfer> {
    // Get provider for the specified chain (with automatic fallback)
    const provider = await this.getProviderWithFallback(chainId);

    // Normalize addresses to lowercase
    const normalizedTokenAddress = expectedTokenAddress.toLowerCase();
    const normalizedFromAddress = expectedFromAddress.toLowerCase();
    const normalizedTreasuryAddress = expectedTreasuryAddress.toLowerCase();
    const isNativeToken = normalizedTokenAddress === '0x0' || normalizedTokenAddress === '0x0000000000000000000000000000000000000000';

    // Fetch transaction and receipt
    const [tx, receipt] = await Promise.all([
      provider.getTransaction(txHash),
      provider.getTransactionReceipt(txHash),
    ]);

    if (!tx) {
      const chainName = chainId === 56 ? 'BSC Mainnet' : chainId === 97 ? 'BSC Testnet' : `Chain ${chainId}`;
      throw new BadRequestException(
        `Transaction ${txHash} not found on ${chainName} (chainId: ${chainId}). Please verify the transaction was sent on the correct network.`,
      );
    }

    if (!receipt) {
      const chainName = chainId === 56 ? 'BSC Mainnet' : chainId === 97 ? 'BSC Testnet' : `Chain ${chainId}`;
      throw new BadRequestException(
        `Transaction receipt ${txHash} not found on ${chainName} (chainId: ${chainId}). The transaction may not be confirmed yet.`,
      );
    }

    // Check transaction succeeded
    if (receipt.status !== 1) {
      throw new BadRequestException(
        `Transaction ${txHash} failed (status: ${receipt.status})`,
      );
    }

    // Handle Native token transfer
    if (isNativeToken) {
      const txFrom = tx.from.toLowerCase();
      const txTo = (tx.to || '').toLowerCase();
      const txValue = tx.value.toString();

      // Validate from address
      if (txFrom !== normalizedFromAddress) {
        throw new BadRequestException(
          `Native transfer from address mismatch: expected ${normalizedFromAddress}, got ${txFrom}`,
        );
      }

      // Validate to address (treasury)
      if (txTo !== normalizedTreasuryAddress) {
        throw new BadRequestException(
          `Native transfer to address mismatch: expected ${normalizedTreasuryAddress}, got ${txTo}`,
        );
      }

      // Validate amount
      if (txValue !== expectedAmount) {
        throw new BadRequestException(
          `Native transfer amount mismatch: expected ${expectedAmount}, got ${txValue}`,
        );
      }

      this.logger.log(
        `Verified native transfer: ${txValue} wei from ${txFrom} to ${txTo} on chain ${chainId} (tx: ${txHash})`,
      );

      return {
        tokenAddress: '0x0',
        from: txFrom,
        to: txTo,
        amount: txValue,
        chainId,
      };
    }

    // Handle ERC20 token transfer
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
        log!.to === normalizedTreasuryAddress &&
        log!.tokenAddress === normalizedTokenAddress,
    );

    if (!matchingTransfer) {
      throw new BadRequestException(
        `No Transfer to treasury (${normalizedTreasuryAddress}) found for token ${normalizedTokenAddress} in transaction ${txHash}`,
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

    this.logger.log(
      `Verified ERC20 transfer: ${matchingTransfer.amount} tokens from ${matchingTransfer.from} to ${matchingTransfer.to} on chain ${chainId} (tx: ${txHash})`,
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
