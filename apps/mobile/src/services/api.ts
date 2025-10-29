/**
 * API Client (Axios)
 * Configures axios instance with base URL and auth interceptor
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import config from '../utils/config';
import { useAuthStore } from '../store/auth';

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Automatically attaches JWT token to Authorization header if present
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { jwt } = useAuthStore.getState();

    if (jwt && config.headers) {
      config.headers.Authorization = `Bearer ${jwt}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles global error responses (e.g., 401 Unauthorized)
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - logout user
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
    }

    return Promise.reject(error);
  }
);

/**
 * API Service methods
 */
export const api = {
  /**
   * GET /products - Fetch insurance products
   */
  getProducts: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  /**
   * POST /policy - Create policy
   */
  createPolicy: async (data: { skuId: string }) => {
    const response = await apiClient.post('/policy', data);
    return response.data;
  },

  /**
   * POST /policy/contract-sign - Sign contract
   */
  signContract: async (data: {
    policyId: string;
    contractPayload: Record<string, unknown>;
    userSig: string;
  }) => {
    const response = await apiClient.post('/policy/contract-sign', data);
    return response.data;
  },

  /**
   * POST /payment/confirm - Confirm payment
   */
  confirmPayment: async (data: { policyId: string; txHash: string }) => {
    const response = await apiClient.post('/payment/confirm', data);
    return response.data;
  },

  /**
   * GET /policy/:id/countdown - Get policy countdown
   */
  getPolicyCountdown: async (policyId: string) => {
    const response = await apiClient.get(`/policy/${policyId}/countdown`);
    return response.data;
  },

  // TODO: Add SIWE authentication endpoints
  // - POST /auth/siwe/nonce - Get nonce for SIWE
  // - POST /auth/siwe/verify - Verify signature and get JWT
};

export default apiClient;
