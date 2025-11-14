const { SiweMessage } = require('siwe');

// Test with UUID nonce (with hyphens) - what backend generates
const msgWithUUID = `localhost wants you to sign in with your Ethereum account:
0x83B6e7E65F223336b7531CCAb6468017a5EB7f77

Sign in with Ethereum to the app.

URI: http://localhost:3001
Version: 1
Chain ID: 97
Nonce: 79ac432d-57ab-4a3b-a5aa-ff10e2d0e09a
Issued At: 2025-11-14T13:55:03.189Z`;

// Test with alphanumeric nonce (no hyphens)
const msgWithAlphanumeric = `localhost wants you to sign in with your Ethereum account:
0x83B6e7E65F223336b7531CCAb6468017a5EB7f77

Sign in with Ethereum to the app.

URI: http://localhost:3001
Version: 1
Chain ID: 97
Nonce: wD5bHPxpRSfXWkYNK8m3v
Issued At: 2025-11-14T13:55:03.189Z`;

console.log('===== Test 1: UUID Nonce (with hyphens) =====');
console.log('Nonce: 79ac432d-57ab-4a3b-a5aa-ff10e2d0e09a');
console.log('Lines:', msgWithUUID.split('\n').length);
try {
  const siweMsg1 = new SiweMessage(msgWithUUID);
  console.log('✅ SUCCESS!');
  console.log('Parsed nonce:', siweMsg1.nonce);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

console.log('\n===== Test 2: Alphanumeric Nonce (no hyphens) =====');
console.log('Nonce: wD5bHPxpRSfXWkYNK8m3v');
console.log('Lines:', msgWithAlphanumeric.split('\n').length);
try {
  const siweMsg2 = new SiweMessage(msgWithAlphanumeric);
  console.log('✅ SUCCESS!');
  console.log('Parsed nonce:', siweMsg2.nonce);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

// Test with UUID without hyphens
const msgWithUUIDNoHyphens = `localhost wants you to sign in with your Ethereum account:
0x83B6e7E65F223336b7531CCAb6468017a5EB7f77

Sign in with Ethereum to the app.

URI: http://localhost:3001
Version: 1
Chain ID: 97
Nonce: 79ac432d57ab4a3ba5aaff10e2d0e09a
Issued At: 2025-11-14T13:55:03.189Z`;

console.log('\n===== Test 3: UUID without hyphens =====');
console.log('Nonce: 79ac432d57ab4a3ba5aaff10e2d0e09a');
try {
  const siweMsg3 = new SiweMessage(msgWithUUIDNoHyphens);
  console.log('✅ SUCCESS!');
  console.log('Parsed nonce:', siweMsg3.nonce);
} catch (error) {
  console.log('❌ FAILED:', error.message);
}
