import axios from 'axios';

export const supabaseHttp = axios.create({
  baseURL: import.meta.env.VITE_SUPABASE_URL,
  headers: {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const newsdataHttp = axios.create({
  baseURL: 'https://newsdata.io/api/1',
});
