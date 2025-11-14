/**
 * Reown AppKit Configuration for Web
 * Based on: https://docs.reown.com/appkit/react/core/installation
 */

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { bsc, bscTestnet } from '@reown/appkit/networks'

// Get project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'e1d4344896342c6efb5aab6396d3ae24'

// Create metadata
const metadata = {
  name: 'COHE.CAPITL',
  description: 'The First Crypto Insurance Alternative',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://cohe.capital',
  icons: ['https://cohe.capital/icon.png']
}

// Create AppKit instance
export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [bsc, bscTestnet],
  defaultNetwork: bscTestnet, // Use testnet by default
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false, // Disable email login
    socials: false, // Disable social logins
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#FFD54F',
    '--w3m-border-radius-master': '8px',
  }
})
