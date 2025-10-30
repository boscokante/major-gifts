import { createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  }
  return url;
};

const getAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  }
  return key;
};

const getServiceKey = () => {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? getAnonKey();
};

export const createClient = () => {
  return createBrowserClient(getSupabaseUrl(), getAnonKey());
};

export const createServerClient = () => {
  const cookieStore = cookies();

  return createSupabaseServerClient(getSupabaseUrl(), getServiceKey(), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.delete({ name, ...options });
      },
    },
  });
};
