/**
 * English Translations
 * Cohe Capital Web Application
 */

export const en = {
  // Common
  common: {
    appName: 'COHE.CAPITL',
    loading: 'Loading...',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    on: 'On',
    off: 'Off',
    disconnect: 'Disconnect',
  },

  // Welcome / Connect Page
  welcome: {
    title: 'THE FIRST CRYPTO',
    titleHighlight: 'FIRST',
    subtitle1: 'CRYPTO',
    subtitle2: 'INSURANCE',
    subtitle3: 'ALTERNATIVE',
    tagline: 'COVERING CRYPTO SINCE 2025',
    connectWallet: 'Connect Wallet',
    connecting: 'Connecting wallet...',
    signingIn: 'Signing in with wallet...',
    pleaseCheckWallet: 'Please check your wallet',
    disconnecting: 'Disconnecting...',
    logout: 'Logout',
    switchLanguage: 'Switch Language',
    english: 'English',
    traditionalChinese: '繁體中文',
  },

  // Authentication
  auth: {
    connectWallet: 'Connect Wallet',
    walletConnected: 'Wallet Connected',
    walletDisconnected: 'Wallet Disconnected',
    signatureRequired: 'Signature Required',
    signatureRejected: 'Signature request was cancelled',
    loginExpired: 'Login expired. Please try again',
    networkError: 'Network error. Please check your connection',
    wrongNetwork: 'Please switch to {{network}} in your wallet',
    authenticationFailed: 'Authentication failed',
    redirecting: 'Redirecting to dashboard...',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome',
    totalCoverage: 'Total Coverage',
    activePolicies: 'Active Policies',
    pendingClaims: 'Pending Claims',
    availableBalance: 'Available Balance',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    noPolicies: 'No active policies',
    getStarted: 'Get started by purchasing a policy',
  },

  // Policies
  policies: {
    title: 'Policies',
    myPolicies: 'My Policies',
    availablePolicies: 'Available Policies',
    policyDetails: 'Policy Details',
    purchasePolicy: 'Purchase Policy',
    active: 'Active',
    pending: 'Pending',
    expired: 'Expired',
    cancelled: 'Cancelled',
    coverageAmount: 'Coverage Amount',
    premium: 'Premium',
    startDate: 'Start Date',
    endDate: 'End Date',
    status: 'Status',
    noPoliciesFound: 'No policies found',
    purchaseNew: 'Purchase New Policy',
  },

  // Claims
  claims: {
    title: 'Claims',
    myClaims: 'My Claims',
    submitClaim: 'Submit Claim',
    claimDetails: 'Claim Details',
    claimAmount: 'Claim Amount',
    claimStatus: 'Claim Status',
    submitted: 'Submitted',
    underReview: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
    noClaimsFound: 'No claims found',
    submitNewClaim: 'Submit New Claim',
  },

  // Settings
  settings: {
    title: 'Settings',
    subtitle: 'Manage your account and preferences',
    description: 'Manage your account and preferences',
    accountSection: 'Account',
    preferencesSection: 'Preferences',
    securitySection: 'Security',
    supportSection: 'Support',
    account: 'Account',
    preferences: 'Preferences',
    security: 'Security',
    support: 'Support',

    // Account Section
    walletAddress: 'Wallet Address',
    email: 'Email',
    notConnected: 'Not Connected',

    // Preferences Section
    notifications: 'Notifications',
    notificationsOn: 'On',
    notificationsOff: 'Off',
    language: 'Language',
    languageEnglish: 'English',
    languageTraditionalChinese: '繁體中文',

    // Security Section
    changePassword: 'Change Password',
    twoFactorAuth: 'Two-Factor Auth',
    twoFactorEnabled: 'Enabled',
    twoFactorDisabled: 'Disabled',
    disabled: 'Disabled',

    // Support Section
    helpCenter: 'Help Center',
    termsAndPrivacy: 'Terms & Privacy',

    // App Info
    appVersion: 'App Version',
    chain: 'Chain',
    chainMainnet: 'BSC Mainnet',
    chainTestnet: 'BSC Testnet',

    // Disconnect
    disconnectWallet: 'Disconnect Wallet',
    disconnectTitle: 'Disconnect Wallet?',
    disconnectMessage: 'You will be logged out and need to reconnect your wallet to access your account.',
    disconnecting: 'Disconnecting...',
  },

  // Bottom Navigation
  nav: {
    dashboard: 'Dashboard',
    products: 'Products',
    policies: 'Policies',
    claims: 'Claims',
    settings: 'Settings',
  },

  // Error Messages
  errors: {
    somethingWentWrong: 'Something went wrong',
    tryAgain: 'Please try again',
    networkError: 'Network error',
    invalidInput: 'Invalid input',
    requiredField: 'This field is required',
    walletNotConnected: 'Wallet not connected',
    insufficientBalance: 'Insufficient balance',
    transactionFailed: 'Transaction failed',
    unauthorized: 'Unauthorized access',
    switchNetwork: 'Please switch to {network} in your wallet',
    signInFailed: 'Failed to sign in. Please try again.',
    walletModalFailed: 'Failed to open wallet modal',
    logoutFailed: 'Failed to logout. Please try again.',
  },

  // Success Messages
  success: {
    transactionComplete: 'Transaction complete',
    policySaved: 'Policy saved successfully',
    claimSubmitted: 'Claim submitted successfully',
    settingsUpdated: 'Settings updated successfully',
    walletConnected: 'Wallet connected successfully',
    walletDisconnected: 'Wallet disconnected successfully',
  },

  // Confirmation Messages
  confirm: {
    areYouSure: 'Are you sure?',
    cannotBeUndone: 'This action cannot be undone',
    proceedWithCaution: 'Please proceed with caution',
  },

  // Date & Time
  date: {
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    daysAgo: '{{count}} days ago',
    hoursAgo: '{{count}} hours ago',
    minutesAgo: '{{count}} minutes ago',
    justNow: 'Just now',
  },

  // Currency & Numbers
  currency: {
    usd: 'USD',
    usdt: 'USDT',
    bnb: 'BNB',
    btc: 'BTC',
    eth: 'ETH',
  },
}

export type Translations = typeof en
