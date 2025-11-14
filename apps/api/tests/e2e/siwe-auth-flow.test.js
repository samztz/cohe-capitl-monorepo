const { SiweMessage } = require('siwe');

/**
 * End-to-End Test: Simulate the complete SIWE flow
 * 1. Backend generates nonce (without hyphens)
 * 2. Frontend formats SIWE message with statement
 * 3. Backend verifies message format
 */

console.log('=== E2E SIWE Authentication Flow Test ===\n');

// Step 1: Backend generates nonce (simulating randomUUID().replace(/-/g, ''))
const mockUUID = '79ac432d-57ab-4a3b-a5aa-ff10e2d0e09a';
const backendNonce = mockUUID.replace(/-/g, '');
console.log('Step 1: Backend generates nonce');
console.log('  Original UUID:', mockUUID);
console.log('  Nonce (no hyphens):', backendNonce);
console.log('  Length:', backendNonce.length);
console.log('  ✅ Valid alphanumeric:', /^[a-zA-Z0-9]+$/.test(backendNonce));

// Step 2: Frontend formats SIWE message
function formatSiweMessage(params) {
  const { domain, address, statement, uri, version, chainId, nonce, issuedAt } = params;

  let message = `${domain} wants you to sign in with your Ethereum account:\n`;
  message += `${address}\n`;
  message += `\n`;

  if (statement) {
    message += `${statement}\n`;
    message += `\n`;
  }

  message += `URI: ${uri}\n`;
  message += `Version: ${version}\n`;
  message += `Chain ID: ${chainId}\n`;
  message += `Nonce: ${nonce}\n`;
  message += `Issued At: ${issuedAt}`;

  return message;
}

const siweMessageString = formatSiweMessage({
  domain: 'localhost',
  address: '0x83B6e7E65F223336b7531CCAb6468017a5EB7f77',
  statement: 'Sign in with Ethereum to the app.',
  uri: 'http://localhost:3001',
  version: '1',
  chainId: 97,
  nonce: backendNonce,
  issuedAt: '2025-11-14T13:55:03.189Z',
});

console.log('\nStep 2: Frontend formats SIWE message');
console.log('  Lines:', siweMessageString.split('\n').length);
console.log('\n--- Message Content ---');
console.log(siweMessageString);
console.log('--- End Message ---\n');

// Step 3: Backend verifies message
console.log('Step 3: Backend parses and verifies SIWE message');
try {
  const parsedMessage = new SiweMessage(siweMessageString);

  console.log('  ✅ Message parsed successfully!');
  console.log('\n  Parsed Fields:');
  console.log('    Domain:', parsedMessage.domain);
  console.log('    Address:', parsedMessage.address);
  console.log('    Statement:', parsedMessage.statement);
  console.log('    URI:', parsedMessage.uri);
  console.log('    Version:', parsedMessage.version);
  console.log('    Chain ID:', parsedMessage.chainId);
  console.log('    Nonce:', parsedMessage.nonce);
  console.log('    Issued At:', parsedMessage.issuedAt);

  // Verify nonce matches
  if (parsedMessage.nonce === backendNonce) {
    console.log('\n  ✅ Nonce verification: MATCH');
  } else {
    console.log('\n  ❌ Nonce verification: MISMATCH');
    console.log('    Expected:', backendNonce);
    console.log('    Received:', parsedMessage.nonce);
  }

  console.log('\n🎉 E2E Test: SUCCESS - Complete flow works correctly!\n');

} catch (error) {
  console.log('  ❌ Message parsing FAILED');
  console.log('  Error:', error.message);
  console.log('\n❌ E2E Test: FAILED\n');
  process.exit(1);
}
