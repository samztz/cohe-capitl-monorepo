/**
 * Utility for generating canonical contract hashes
 */

import { createHash } from 'crypto';

/**
 * Create a canonical JSON string from an object
 * - Recursively sorts all object keys alphabetically
 * - Uses consistent JSON serialization
 * - Ensures deterministic output for hashing
 *
 * @param obj - Any JSON-serializable object
 * @returns Canonical JSON string with sorted keys
 */
export function canonicalJSON(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const canonicalArray = obj.map((item) => canonicalJSON(item));
    return `[${canonicalArray.join(',')}]`;
  }

  // Sort object keys alphabetically
  const sortedKeys = Object.keys(obj).sort();
  const canonicalPairs = sortedKeys.map((key) => {
    const value = (obj as Record<string, unknown>)[key];
    const canonicalValue = canonicalJSON(value);
    return `${JSON.stringify(key)}:${canonicalValue}`;
  });

  return `{${canonicalPairs.join(',')}}`;
}

/**
 * Generate SHA256 hash of canonical JSON
 *
 * @param payload - Contract payload object
 * @returns 0x-prefixed hex hash (66 chars: 0x + 64 hex digits)
 */
export function generateContractHash(
  payload: Record<string, unknown>,
): string {
  const canonical = canonicalJSON(payload);
  const hash = createHash('sha256').update(canonical, 'utf8').digest('hex');
  return `0x${hash}`;
}
