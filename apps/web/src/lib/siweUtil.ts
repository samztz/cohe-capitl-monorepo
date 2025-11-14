/**
 * SIWE (Sign-In with Ethereum) Utility Functions
 * Formats SIWE messages according to EIP-4361 standard
 */

export interface SiweMessageParams {
  domain: string
  address: string
  statement?: string
  uri: string
  version: string
  chainId: number
  nonce: string
  issuedAt: string
  expirationTime?: string
  notBefore?: string
  requestId?: string
  resources?: string[]
}

/**
 * Format SIWE message according to EIP-4361
 * @see https://eips.ethereum.org/EIPS/eip-4361
 *
 * IMPORTANT: When no statement is provided, there should be only ONE blank line
 * after the address, not two. This matches the SIWE library's expected format.
 */
export function formatSiweMessage(params: SiweMessageParams): string {
  const {
    domain,
    address,
    statement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
    expirationTime,
    notBefore,
    requestId,
    resources,
  } = params

  let message = `${domain} wants you to sign in with your Ethereum account:\n`
  message += `${address}\n`

  // Add blank line after address
  message += `\n`

  // Add statement if provided (followed by blank line)
  if (statement) {
    message += `${statement}\n`
    message += `\n`
  }

  // URI line (no additional blank line needed - already added above)
  message += `URI: ${uri}\n`
  message += `Version: ${version}\n`
  message += `Chain ID: ${chainId}\n`
  message += `Nonce: ${nonce}\n`
  message += `Issued At: ${issuedAt}`

  if (expirationTime) {
    message += `\nExpiration Time: ${expirationTime}`
  }

  if (notBefore) {
    message += `\nNot Before: ${notBefore}`
  }

  if (requestId) {
    message += `\nRequest ID: ${requestId}`
  }

  if (resources && resources.length > 0) {
    message += `\nResources:`
    resources.forEach((resource) => {
      message += `\n- ${resource}`
    })
  }

  return message
}
