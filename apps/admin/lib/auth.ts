const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

export interface AdminUser {
  email: string
  name: string
}

export function isAuthed(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(TOKEN_KEY)
}

export function login(email: string, password: string): AdminUser | null {
  // Mock validation
  if (email === 'admin@cohe.capital' && password === 'admin123') {
    const user = { email, name: 'Admin' }
    localStorage.setItem(TOKEN_KEY, 'demo-admin-token')
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return user
  }
  return null
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getUser(): AdminUser | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem(USER_KEY)
  return userStr ? JSON.parse(userStr) : null
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}
