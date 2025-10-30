/**
 * SIWE (Sign-In with Ethereum) Utility Functions
 * Implements EIP-4361 message formatting
 */

export interface SiweMessageParams {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version?: string;
  chainId: number;
  nonce: string;
  issuedAt?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

/**
 * Format a SIWE message according to EIP-4361 specification
 * @param params - The parameters for the SIWE message
 * @returns Formatted SIWE message string
 */
export function formatSiweMessage(params: SiweMessageParams): string {
  const {
    domain,
    address,
    statement = 'Sign in to Cohe Capital',
    uri,
    version = '1',
    chainId,
    nonce,
    issuedAt = new Date().toISOString(),
    expirationTime,
    notBefore,
    requestId,
    resources,
  } = params;

  // Build the message parts
  const messageParts: string[] = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    statement,
    '',
    `URI: ${uri}`,
    `Version: ${version}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ];

  // Add optional fields if present
  if (expirationTime) {
    messageParts.push(`Expiration Time: ${expirationTime}`);
  }

  if (notBefore) {
    messageParts.push(`Not Before: ${notBefore}`);
  }

  if (requestId) {
    messageParts.push(`Request ID: ${requestId}`);
  }

  if (resources && resources.length > 0) {
    messageParts.push('Resources:');
    resources.forEach(resource => {
      messageParts.push(`- ${resource}`);
    });
  }

  return messageParts.join('\n');
}

/**
 * Parse a SIWE message string into its components
 * @param message - The SIWE message string to parse
 * @returns Parsed message components
 */
export function parseSiweMessage(message: string): Partial<SiweMessageParams> {
  const lines = message.split('\n');
  const result: Partial<SiweMessageParams> = {};

  // Parse domain and address from first two lines
  const domainMatch = lines[0]?.match(/^(.+) wants you to sign in with your Ethereum account:$/);
  if (domainMatch) {
    result.domain = domainMatch[1];
  }
  result.address = lines[1];

  // Parse other fields
  lines.forEach(line => {
    if (line.startsWith('URI: ')) {
      result.uri = line.substring(5);
    } else if (line.startsWith('Version: ')) {
      result.version = line.substring(9);
    } else if (line.startsWith('Chain ID: ')) {
      result.chainId = parseInt(line.substring(10), 10);
    } else if (line.startsWith('Nonce: ')) {
      result.nonce = line.substring(7);
    } else if (line.startsWith('Issued At: ')) {
      result.issuedAt = line.substring(11);
    } else if (line.startsWith('Expiration Time: ')) {
      result.expirationTime = line.substring(17);
    } else if (line.startsWith('Not Before: ')) {
      result.notBefore = line.substring(12);
    } else if (line.startsWith('Request ID: ')) {
      result.requestId = line.substring(12);
    }
  });

  // Parse statement (everything between address and URI)
  const statementStartIdx = 3; // Skip domain, address, and empty line
  const uriLineIdx = lines.findIndex(l => l.startsWith('URI: '));
  if (uriLineIdx > statementStartIdx) {
    const statementLines = lines.slice(statementStartIdx, uriLineIdx - 1);
    result.statement = statementLines.filter(l => l).join('\n');
  }

  // Parse resources if present
  const resourcesIdx = lines.findIndex(l => l === 'Resources:');
  if (resourcesIdx !== -1) {
    result.resources = lines
      .slice(resourcesIdx + 1)
      .filter(l => l.startsWith('- '))
      .map(l => l.substring(2));
  }

  return result;
}

/**
 * Validate a SIWE message has all required fields
 * @param params - The SIWE message parameters to validate
 * @returns True if valid, false otherwise
 */
export function validateSiweMessage(params: Partial<SiweMessageParams>): boolean {
  const required = ['domain', 'address', 'uri', 'chainId', 'nonce'];
  return required.every(field => params[field as keyof SiweMessageParams] !== undefined);
}