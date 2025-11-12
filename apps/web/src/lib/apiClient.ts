import { createApiClient } from '@/api/client'
import { storage } from '@/auth/storage'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'

export const apiClient = createApiClient({
  baseURL: API_BASE,
  getToken: () => storage.getToken(),
})
