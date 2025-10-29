/**
 * SIWE (Sign-In With Ethereum) Service
 * TODO: Implement wallet connection and SIWE authentication
 */

// TODO: Install dependencies
// pnpm add @walletconnect/modal-react-native
// pnpm add siwe

/**
 * TODO: Implement SIWE Login Flow
 *
 * 1. Initialize WalletConnect Modal
 *    - Configure project ID from WalletConnect Cloud
 *    - Set up supported chains (BSC, Ethereum, etc.)
 *
 * 2. Connect Wallet
 *    - Show WalletConnect modal
 *    - Wait for user to connect wallet
 *    - Get wallet address and provider
 *
 * 3. Get Nonce from Backend
 *    - Call POST /auth/siwe/nonce
 *    - Receive nonce string
 *
 * 4. Create SIWE Message
 *    - Use siwe library to create message
 *    - Include domain, uri, version, chainId, nonce
 *
 * 5. Request Signature
 *    - Use wallet provider to sign message
 *    - Get signature from user's wallet
 *
 * 6. Verify Signature
 *    - Call POST /auth/siwe/verify with message and signature
 *    - Receive JWT token
 *    - Store token in auth store
 *
 * 7. Navigate to App
 *    - Update auth state
 *    - Navigate to Products screen
 */

// Example implementation (commented out):
/*
import { WalletConnectModal } from '@walletconnect/modal-react-native';
import { SiweMessage } from 'siwe';
import { useAuthStore } from '../store/auth';
import apiClient from './api';

export const connectWallet = async () => {
  // 1. Initialize WalletConnect
  const modal = new WalletConnectModal({
    projectId: process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID,
    chains: ['56'], // BSC
  });

  // 2. Connect wallet
  const { address, provider } = await modal.connect();

  // 3. Get nonce
  const { nonce } = await apiClient.post('/auth/siwe/nonce', { address });

  // 4. Create SIWE message
  const message = new SiweMessage({
    domain: 'cohe-capital.com',
    address,
    statement: 'Sign in to Cohe Capital Insurance',
    uri: origin,
    version: '1',
    chainId: 56,
    nonce,
  });

  const preparedMessage = message.prepareMessage();

  // 5. Request signature
  const signature = await provider.request({
    method: 'personal_sign',
    params: [preparedMessage, address],
  });

  // 6. Verify signature
  const { jwt } = await apiClient.post('/auth/siwe/verify', {
    message: preparedMessage,
    signature,
  });

  // 7. Update auth state
  const { setAuth } = useAuthStore.getState();
  setAuth(address, jwt);

  return { address, jwt };
};
*/

export default {};
