/**
 * Storage utilities for Web (localStorage)
 * RN should override these with SecureStore implementation
 */

const JWT_KEY = 'auth_jwt_token';
const USER_KEY = 'auth_user_data';

export interface StoredUser {
  id: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

// Web implementation (localStorage)
export const storage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(JWT_KEY);
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(JWT_KEY, token);
  },

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(JWT_KEY);
  },

  getUser(): StoredUser | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setUser(user: StoredUser): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
