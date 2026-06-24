import axios from 'axios';
import { supabase } from './supabaseClient';

export const supabaseHttp = axios.create({
  baseURL: import.meta.env.VITE_SUPABASE_URL,
  headers: {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  },
});

// Attach the logged-in user's JWT so RLS resolves to the right user.
// Falls back to the anon key for unauthenticated requests.
supabaseHttp.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  config.headers.Authorization = `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`;
  return config;
});

export const newsdataHttp = axios.create({
  baseURL: 'https://newsdata.io/api/1',
});
