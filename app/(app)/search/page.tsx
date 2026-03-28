import { redirect } from 'next/navigation';

/**
 * /search route — deprecated.
 * Search is now integrated into the main dashboard at /app.
 * This page redirects to preserve any direct links to /search.
 */
export default function DeprecatedSearchPage() {
  redirect('/app');
}
