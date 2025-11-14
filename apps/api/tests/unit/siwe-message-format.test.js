const { SiweMessage } = require('siwe');

// Test WITH statement - correct format
const msgCorrect = `example.com wants you to sign in with your Ethereum account:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Sign in with Ethereum

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: wD5bHPxpRSfXWkYNK8m3v
Issued At: 2024-01-01T00:00:00.000Z`;

// Test WITH statement - WRONG format (two blank lines between statement and URI)
const msgWrong = `example.com wants you to sign in with your Ethereum account:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Sign in with Ethereum


URI: https://example.com
Version: 1
Chain ID: 1
Nonce: wD5bHPxpRSfXWkYNK8m3v
Issued At: 2024-01-01T00:00:00.000Z`;

console.log('===== Test 1: CORRECT format (one blank line after statement) =====');
console.log('Lines:', msgCorrect.split('\n').length);
msgCorrect.split('\n').forEach((line, i) => {
  console.log(`Line ${i}: "${line}"`);
});
try {
  const siweMsg1 = new SiweMessage(msgCorrect);
  console.log('✅ SUCCESS!');
} catch (error) {
  console.log('❌ FAILED:', error.message);
}

console.log('\n===== Test 2: WRONG format (two blank lines after statement) =====');
console.log('Lines:', msgWrong.split('\n').length);
msgWrong.split('\n').forEach((line, i) => {
  console.log(`Line ${i}: "${line}"`);
});
try {
  const siweMsg2 = new SiweMessage(msgWrong);
  console.log('✅ SUCCESS!');
} catch (error) {
  console.log('❌ FAILED:', error.message);
}
