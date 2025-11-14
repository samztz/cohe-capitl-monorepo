const { SiweMessage } = require('siwe');

// Test 1: Our format (without statement) - valid checksum address and valid nonce (alphanumeric)
const msg1 = `localhost wants you to sign in with your Ethereum account:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

URI: http://localhost:3001
Version: 1
Chain ID: 97
Nonce: wD5bHPxpRSfXWkYNK8m3v
Issued At: 2024-01-01T00:00:00.000Z`;

// Test 2: Same but WITH trailing newline
const msg2 = `localhost wants you to sign in with your Ethereum account:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

URI: http://localhost:3001
Version: 1
Chain ID: 97
Nonce: wD5bHPxpRSfXWkYNK8m3v
Issued At: 2024-01-01T00:00:00.000Z
`;

// Test 3: Backend test format WITH statement
const msg3 = `example.com wants you to sign in with your Ethereum account:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Sign in with Ethereum

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: wD5bHPxpRSfXWkYNK8m3v
Issued At: 2024-01-01T00:00:00.000Z`;

console.log('===== Test 1: WITHOUT statement, NO trailing newline =====');
try {
  const siweMsg1 = new SiweMessage(msg1);
  console.log('✅ SUCCESS!');
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

console.log('\n===== Test 2: WITHOUT statement, WITH trailing newline =====');
try {
  const siweMsg2 = new SiweMessage(msg2);
  console.log('✅ SUCCESS!');
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

console.log('\n===== Test 3: WITH statement (backend test format) =====');
try {
  const siweMsg3 = new SiweMessage(msg3);
  console.log('✅ SUCCESS!');
  console.log('Parsed fields:', {
    domain: siweMsg3.domain,
    address: siweMsg3.address,
    statement: siweMsg3.statement,
    uri: siweMsg3.uri,
    version: siweMsg3.version,
    chainId: siweMsg3.chainId,
    nonce: siweMsg3.nonce,
  });
} catch (error) {
  console.log('❌ FAILED:', error.message);
}
