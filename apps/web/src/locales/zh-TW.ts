/**
 * Traditional Chinese Translations (繁體中文)
 * Cohe Capital Web Application
 */

export const zhTW = {
  // Common
  common: {
    appName: 'COHE.CAPITL',
    loading: '載入中...',
    cancel: '取消',
    confirm: '確認',
    save: '儲存',
    delete: '刪除',
    edit: '編輯',
    back: '返回',
    next: '下一步',
    submit: '提交',
    close: '關閉',
    yes: '是',
    no: '否',
    ok: '確定',
    error: '錯誤',
    success: '成功',
    warning: '警告',
    info: '資訊',
    on: '開啟',
    off: '關閉',
    disconnect: '斷開',
  },

  // Welcome / Connect Page
  welcome: {
    title: '首個加密貨幣',
    titleHighlight: '首個',
    subtitle1: '加密貨幣',
    subtitle2: '保險',
    subtitle3: '替代方案',
    tagline: '自 2025 年起為加密貨幣提供保障',
    connectWallet: '連接錢包',
    connecting: '正在連接錢包...',
    signingIn: '正在使用錢包登入...',
    pleaseCheckWallet: '請檢查您的錢包',
    disconnecting: '正在斷開連接...',
    logout: '登出',
    switchLanguage: '切換語言',
    english: 'English',
    traditionalChinese: '繁體中文',
  },

  // Authentication
  auth: {
    connectWallet: '連接錢包',
    walletConnected: '錢包已連接',
    walletDisconnected: '錢包已斷開',
    signatureRequired: '需要簽名',
    signatureRejected: '簽名請求已取消',
    loginExpired: '登入已過期，請重試',
    networkError: '網絡錯誤，請檢查您的連接',
    wrongNetwork: '請在錢包中切換到 {{network}}',
    authenticationFailed: '認證失敗',
    redirecting: '正在跳轉到控制台...',
  },

  // Dashboard
  dashboard: {
    title: '控制台',
    welcome: '歡迎',
    totalCoverage: '總保障額',
    activePolicies: '有效保單',
    pendingClaims: '待處理理賠',
    availableBalance: '可用餘額',
    recentActivity: '近期活動',
    viewAll: '查看全部',
    noPolicies: '無有效保單',
    getStarted: '購買保單開始使用',
  },

  // Policies
  policies: {
    title: '保單',
    myPolicies: '我的保單',
    availablePolicies: '可購買保單',
    policyDetails: '保單詳情',
    purchasePolicy: '購買保單',
    active: '有效',
    pending: '待處理',
    expired: '已過期',
    cancelled: '已取消',
    coverageAmount: '保障金額',
    premium: '保費',
    startDate: '開始日期',
    endDate: '結束日期',
    status: '狀態',
    noPoliciesFound: '未找到保單',
    purchaseNew: '購買新保單',
  },

  // Claims
  claims: {
    title: '理賠',
    myClaims: '我的理賠',
    submitClaim: '提交理賠',
    claimDetails: '理賠詳情',
    claimAmount: '理賠金額',
    claimStatus: '理賠狀態',
    submitted: '已提交',
    underReview: '審核中',
    approved: '已批准',
    rejected: '已拒絕',
    paid: '已支付',
    noClaimsFound: '未找到理賠',
    submitNewClaim: '提交新理賠',
  },

  // Settings
  settings: {
    title: '設定',
    subtitle: '管理您的帳戶和偏好設定',
    description: '管理您的帳戶和偏好設定',
    accountSection: '帳戶',
    preferencesSection: '偏好設定',
    securitySection: '安全性',
    supportSection: '支援',
    account: '帳戶',
    preferences: '偏好設定',
    security: '安全性',
    support: '支援',

    // Account Section
    walletAddress: '錢包地址',
    email: '電子郵件',
    notConnected: '未連接',

    // Preferences Section
    notifications: '通知',
    notificationsOn: '開啟',
    notificationsOff: '關閉',
    language: '語言',
    languageEnglish: 'English',
    languageTraditionalChinese: '繁體中文',

    // Security Section
    changePassword: '變更密碼',
    twoFactorAuth: '雙重驗證',
    twoFactorEnabled: '已啟用',
    twoFactorDisabled: '已停用',
    disabled: '已停用',

    // Support Section
    helpCenter: '幫助中心',
    termsAndPrivacy: '條款與隱私',

    // App Info
    appVersion: '應用程式版本',
    chain: '鏈',
    chainMainnet: 'BSC 主網',
    chainTestnet: 'BSC 測試網',

    // Disconnect
    disconnectWallet: '斷開錢包',
    disconnectTitle: '斷開錢包？',
    disconnectMessage: '您將登出並需要重新連接錢包才能訪問您的帳戶。',
    disconnecting: '正在斷開連接...',
  },

  // Bottom Navigation
  nav: {
    dashboard: '控制台',
    products: '產品',
    policies: '保單',
    claims: '理賠',
    settings: '設定',
  },

  // Error Messages
  errors: {
    somethingWentWrong: '發生錯誤',
    tryAgain: '請重試',
    networkError: '網絡錯誤',
    invalidInput: '輸入無效',
    requiredField: '此欄位為必填',
    walletNotConnected: '錢包未連接',
    insufficientBalance: '餘額不足',
    transactionFailed: '交易失敗',
    unauthorized: '未經授權的訪問',
    switchNetwork: '請在您的錢包中切換至 {network}',
    signInFailed: '登入失敗，請重試。',
    walletModalFailed: '無法開啟錢包視窗',
    logoutFailed: '登出失敗，請重試。',
  },

  // Success Messages
  success: {
    transactionComplete: '交易完成',
    policySaved: '保單儲存成功',
    claimSubmitted: '理賠提交成功',
    settingsUpdated: '設定更新成功',
    walletConnected: '錢包連接成功',
    walletDisconnected: '錢包斷開成功',
  },

  // Confirmation Messages
  confirm: {
    areYouSure: '您確定嗎？',
    cannotBeUndone: '此操作無法撤銷',
    proceedWithCaution: '請謹慎操作',
  },

  // Date & Time
  date: {
    today: '今天',
    yesterday: '昨天',
    tomorrow: '明天',
    daysAgo: '{{count}} 天前',
    hoursAgo: '{{count}} 小時前',
    minutesAgo: '{{count}} 分鐘前',
    justNow: '剛剛',
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
