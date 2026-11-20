import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function stripQuotesAndTrim(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"]+|['"]+$/g, '').trim();
}

function normalizeSupabaseUrl(raw: unknown): string | null {
  let candidate = stripQuotesAndTrim(raw);
  if (!candidate) return null;

  const upper = candidate.toUpperCase();
  if (
    upper.includes('YOUR_PROJECT_REF') ||
    upper.includes('YOUR_SUPABASE') ||
    upper.startsWith('MY_')
  ) {
    return null;
  }

  // Handle hostnames entered without protocol (e.g., abcdef.supabase.co)
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
    if (candidate.includes('.') && !candidate.includes(' ')) {
      candidate = `https://${candidate}`;
    } else {
      return null;
    }
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function normalizeSupabaseKey(raw: unknown): string | null {
  const candidate = stripQuotesAndTrim(raw);
  if (!candidate) return null;

  const upper = candidate.toUpperCase();
  if (
    upper.includes('YOUR_SUPABASE') ||
    upper.includes('YOUR_PROJECT') ||
    upper.startsWith('MY_')
  ) {
    return null;
  }

  return candidate;
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseKey =
  normalizeSupabaseKey(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) ??
  normalizeSupabaseKey(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedClient;
  } catch {
    return null;
  }
}

export interface AutoverseEnquiryInput {
  name: string;
  email: string;
  message: string;
}

export async function submitAutoverseEnquiry(
  input: AutoverseEnquiryInput,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Unable to send enquiry: please verify VITE_SUPABASE_URL is a valid https:// URL and VITE_SUPABASE_PUBLISHABLE_KEY is set.',
    );
  }

  const cleanName = input.name.trim();
  const cleanEmail = input.email.trim();
  const cleanMessage = input.message.trim();

  if (!cleanName || !cleanEmail || !cleanMessage) {
    throw new Error('Please fill in your name, email, and message.');
  }

  // Insert without .select() so public forms work securely with an INSERT-only RLS policy
  const { error } = await client.from('AUTOVERSE').insert([
    {
      NAME: cleanName,
      EMAIL: cleanEmail,
      MESSAGE: cleanMessage,
    },
  ]);

  if (error) {
    throw new Error(error.message || 'Unable to send your enquiry right now.');
  }
}
