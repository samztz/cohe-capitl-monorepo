/**
 * Payment Assets Helper
 *
 * Constructs paymentAsset objects for Reown AppKit Pay integration.
 * Supports both native tokens (ETH, BNB) and ERC20 tokens (USDT, USDC).
 */

export interface TokenMetadata {
  symbol: string
  decimals: number
  name?: string
}

export interface SKU {
  chainId: number
  tokenAddress: string
  name: string
}

export interface PaymentAsset {
  network: string
  asset: string
  metadata: {
    name: string
    symbol: string
    decimals: number
  }
}

/**
 * Native token addresses (used to identify native payments)
 * These are zero addresses or special markers for native tokens
 */
const NATIVE_TOKEN_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Common placeholder for native
]

/**
 * Check if token address represents a native token
 */
function isNativeToken(tokenAddress: string): boolean {
  return NATIVE_TOKEN_ADDRESSES.includes(tokenAddress.toLowerCase())
}

/**
 * Get network identifier for AppKit Pay
 * Format: eip155:{chainId}
 *
 * Supported networks:
 * - 1: Ethereum Mainnet
 * - 56: BNB Smart Chain (BSC)
 * - 97: BSC Testnet
 * - 84532: Base Sepolia (testnet)
 *
 * Note: AppKit Pay support for BSC may be limited. For testing,
 * use Base Sepolia (84532) with baseSepoliaETH.
 */
function getNetworkIdentifier(chainId: number): string {
  return `eip155:${chainId}`
}

/**
 * Get default token metadata based on common tokens
 */
function getDefaultTokenMetadata(tokenAddress: string, chainId: number): TokenMetadata {
  const addr = tokenAddress.toLowerCase()

  // USDT on BSC
  if (addr === '0x55d398326f99059ff775485246999027b3197955' && chainId === 56) {
    return { symbol: 'USDT', decimals: 18, name: 'Tether USD' }
  }

  // USDC on BSC
  if (addr === '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' && chainId === 56) {
    return { symbol: 'USDC', decimals: 18, name: 'USD Coin' }
  }

  // Native BNB on BSC
  if (isNativeToken(addr) && chainId === 56) {
    return { symbol: 'BNB', decimals: 18, name: 'BNB' }
  }

  // Native ETH on Ethereum
  if (isNativeToken(addr) && chainId === 1) {
    return { symbol: 'ETH', decimals: 18, name: 'Ethereum' }
  }

  // Base Sepolia ETH (for testing)
  if (isNativeToken(addr) && chainId === 84532) {
    return { symbol: 'ETH', decimals: 18, name: 'Sepolia ETH' }
  }

  // Default fallback
  return { symbol: 'UNKNOWN', decimals: 18, name: 'Unknown Token' }
}

/**
 * Build payment asset object for AppKit Pay
 *
 * @param sku - Product SKU containing chainId and tokenAddress
 * @param tokenMeta - Optional token metadata (symbol, decimals, name)
 * @returns PaymentAsset object ready for AppKit Pay
 *
 * @example
 * // For USDT payment on BSC
 * const asset = buildPaymentAsset(
 *   { chainId: 56, tokenAddress: '0x55d398326f99059fF775485246999027B3197955', name: 'YULILY' },
 *   { symbol: 'USDT', decimals: 18 }
 * )
 *
 * @example
 * // For native BNB payment on BSC
 * const asset = buildPaymentAsset(
 *   { chainId: 56, tokenAddress: '0x0000000000000000000000000000000000000000', name: 'YULILY' },
 *   { symbol: 'BNB', decimals: 18 }
 * )
 *
 * @example
 * // For testing with Base Sepolia ETH
 * const asset = buildPaymentAsset(
 *   { chainId: 84532, tokenAddress: '0x0000000000000000000000000000000000000000', name: 'Test' },
 *   { symbol: 'ETH', decimals: 18 }
 * )
 */
export function buildPaymentAsset(
  sku: SKU,
  tokenMeta?: Partial<TokenMetadata>
): PaymentAsset {
  const { chainId, tokenAddress } = sku

  // Determine if this is a native token payment
  const isNative = isNativeToken(tokenAddress)

  // Get token metadata (provided or default)
  const defaultMeta = getDefaultTokenMetadata(tokenAddress, chainId)
  const metadata: TokenMetadata = {
    symbol: tokenMeta?.symbol || defaultMeta.symbol,
    decimals: tokenMeta?.decimals ?? defaultMeta.decimals,
    name: tokenMeta?.name || defaultMeta.name || `${defaultMeta.symbol} on Chain ${chainId}`,
  }

  return {
    network: getNetworkIdentifier(chainId),
    asset: isNative ? 'native' : tokenAddress.toLowerCase(),
    metadata: {
      name: metadata.name!,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
    },
  }
}

/**
 * Validate payment amount for AppKit Pay
 * Ensures amount is a valid positive number
 */
export function validatePaymentAmount(amount: string | number): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid payment amount: ${amount}`)
  }

  // Limit precision to avoid floating point issues
  // AppKit Pay typically handles amounts with reasonable precision
  return parseFloat(num.toFixed(6))
}

/**
 * Get display name for chain
 */
export function getChainDisplayName(chainId: number): string {
  const names: Record<number, string> = {
    1: 'Ethereum',
    56: 'BNB Smart Chain',
    97: 'BSC Testnet',
    84532: 'Base Sepolia',
  }
  return names[chainId] || `Chain ${chainId}`
}
