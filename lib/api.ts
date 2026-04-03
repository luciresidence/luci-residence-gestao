
import { supabase } from './supabase';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const supabaseKey = (supabase as any).supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaXhvd29mc3NiaW11ZGJyZWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzcyNjksImV4cCI6MjA4NDM1MzI2OX0.28TcTxfnLUFr-CJ-4C7sTVSyrd_jDVkaf46qEIl4Sbo';
  
  const headers = {
    'Authorization': `Bearer ${session?.access_token || supabaseKey}`,
    'apikey': supabaseKey,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  return fetch(url, { ...options, headers });
}
