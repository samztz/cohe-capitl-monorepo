const { SiweMessage } = require('siwe');

// Simulate our fixed formatSiweMessage function
function formatSiweMessage(params) {
  const {
    domain,
    address,
    statement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
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

  return message
}

// Test with statement (our actual use case)
const msgWithStatement = formatSiweMessage({
  domain: 'localhost',
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  statement: 'Sign in with Ethereum to the app.',
  uri: 'http://localhost:3001',
  version: '1',
  chainId: 97,
  nonce: 'wD5bHPxpRSfXWkYNK8m3v',
  issuedAt: '2024-01-01T00:00:00.000Z',
})

console.log('=== Generated Message WITH Statement ===')
console.log(msgWithStatement)
console.log('\n=== Line Analysis ===')
console.log('Total lines:', msgWithStatement.split('\n').length)
msgWithStatement.split('\n').forEach((line, i) => {
  console.log(`Line ${i}: "${line}"`)
})

console.log('\n=== SIWE Parsing Test ===')
try {
  const siweMsg = new SiweMessage(msgWithStatement)
  console.log('✅ SUCCESS! Message parsed correctly')
  console.log('Parsed fields:', {
    domain: siweMsg.domain,
    address: siweMsg.address,
    statement: siweMsg.statement,
    uri: siweMsg.uri,
    version: siweMsg.version,
    chainId: siweMsg.chainId,
    nonce: siweMsg.nonce,
  })
} catch (error) {
  console.log('❌ FAILED:', error.message)
}

// Test without statement (edge case)
console.log('\n\n=== Test WITHOUT Statement (edge case) ===')
const msgWithoutStatement = formatSiweMessage({
  domain: 'localhost',
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  uri: 'http://localhost:3001',
  version: '1',
  chainId: 97,
  nonce: 'wD5bHPxpRSfXWkYNK8m3v',
  issuedAt: '2024-01-01T00:00:00.000Z',
})

console.log(msgWithoutStatement)
console.log('\nTotal lines:', msgWithoutStatement.split('\n').length)
try {
  const siweMsg2 = new SiweMessage(msgWithoutStatement)
  console.log('✅ SUCCESS!')
} catch (error) {
  console.log('❌ FAILED:', error.message)
}
