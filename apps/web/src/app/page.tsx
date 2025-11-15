import { redirect } from 'next/navigation'

/**
 * Root Page - Immediate Redirect
 * Redirects all traffic to /auth/connect
 * The connect page handles authentication routing:
 * - Not authenticated -> Show wallet connect UI
 * - Authenticated -> Redirect to /dashboard
 */
export default function Home() {
  redirect('/auth/connect')
}
