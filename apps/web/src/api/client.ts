import axios, { AxiosInstance } from 'axios'

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  NONCE: '/auth/nonce',
  VERIFY: '/auth/verify',
  ME: '/auth/me',

  // Products
  PRODUCTS: '/products',

  // Policies
  POLICIES: '/policy',
  POLICY_CONTRACT_SIGN: '/policy/contract-sign',
  POLICY_PAYMENT_CONFIRM: '/policy/payment-confirm',
} as const

interface ApiClientConfig {
  baseURL: string
  getToken?: () => string | null
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor to add auth token
  client.interceptors.request.use((requestConfig) => {
    const token = config.getToken?.()
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`
    }
    return requestConfig
  })

  return client
}
