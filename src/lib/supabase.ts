import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Validate environment variables
if (browser && (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY)) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

// Create Supabase client
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY); 