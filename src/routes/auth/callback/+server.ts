import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This route is used for handling Supabase auth callbacks (email confirmation, password reset, etc.)
export const GET: RequestHandler = async ({ url, locals }) => {
  // Extract the code and next parameters from the URL
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  if (code) {
    // Successful auth redirect
    return redirect(303, `/${next.startsWith('/') ? next.slice(1) : next}`);
  }

  // If there's no code, redirect to home page
  return redirect(303, '/');
}; 