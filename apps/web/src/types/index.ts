/**
 * Shared Types for Cohe Capital
 */

// Backend SKU Type (from API response)
export interface BackendSku {
  id: string;
  name: string;
  chainId: number;
  tokenAddress: string;
  decimals: number;
  premiumAmt: string;  // Backend field name
  coverageAmt: string; // Backend field name
  termDays: number;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Product/SKU Types (Frontend)
export interface Product {
  id: string;
  name: string;
  description?: string;
  coverageAmount: string; // Mapped from coverageAmt
  premiumAmount: string;  // Mapped from premiumAmt
  termDays: number;
  tokenAddress?: string;
  chainId?: number;
  decimals?: number;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Policy Types
export enum PolicyStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
  CLAIMED = 'claimed',
}

export interface Policy {
  id: string;
  skuId: string;
  userAddress: string;
  email: string;
  status: PolicyStatus;
  coverageAmount: string;
  premiumAmount: string;
  termDays: number;
  startDate?: string;
  endDate?: string;
  contractData?: any;
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export interface Payment {
  id: string;
  policyId: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenAddress: string;
  chainId: number;
  confirmations: number;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface User {
  id: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface AuthTokenResponse {
  token: string;
  address: string;
}

export interface MeResponse {
  userId: string;
  address: string;
}
