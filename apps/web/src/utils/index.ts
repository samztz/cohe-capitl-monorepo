/**
 * Shared utility functions
 */

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import type { BackendSku, Product } from '@/types';

dayjs.extend(duration);

/**
 * Format wallet address as 0xAb...1234
 */
export function formatAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Format date
 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(date).format(format);
}

/**
 * Calculate remaining time
 */
export function getRemainingTime(endDate: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = dayjs();
  const end = dayjs(endDate);
  const diff = end.diff(now);

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const dur = dayjs.duration(diff);
  return {
    days: Math.floor(dur.asDays()),
    hours: dur.hours(),
    minutes: dur.minutes(),
    seconds: dur.seconds(),
    total: diff,
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: string | number, decimals = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Handle invalid numbers
  if (isNaN(num) || num === null || num === undefined) {
    return '0.00';
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Map backend SKU response to frontend Product type
 * Adapts premiumAmt/coverageAmt field names to premiumAmount/coverageAmount
 */
export function mapProduct(sku: BackendSku): Product {
  return {
    id: sku.id,
    name: sku.name,
    premiumAmount: sku.premiumAmt,
    coverageAmount: sku.coverageAmt,
    termDays: sku.termDays,
    chainId: sku.chainId,
    tokenAddress: sku.tokenAddress,
    tokenSymbol: sku.tokenSymbol,
    decimals: sku.decimals,
    status: sku.status,
    isActive: sku.status === 'active',
    createdAt: typeof sku.createdAt === 'string' ? sku.createdAt : sku.createdAt.toISOString(),
    updatedAt: typeof sku.updatedAt === 'string' ? sku.updatedAt : sku.updatedAt.toISOString(),
  };
}
