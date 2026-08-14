import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate both required env vars are present
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error(
      '[Supabase] MISSING environment variables!\n' +
      '  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ set' : '✗ MISSING',
      '\n  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ set' : '✗ MISSING'
    );
  }
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key'
);

// Debug: log on client side to confirm values are populated
if (typeof window !== 'undefined') {
  console.log(
    '[Supabase] Init | URL:', supabaseUrl ?? 'NOT SET',
    '| Key prefix:', supabaseAnonKey?.slice(0, 16) ?? 'NOT SET'
  );
}
