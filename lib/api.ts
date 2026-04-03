
import { supabase } from './supabase';

export async function apiFetch(url: string, options: RequestInit = {}) {
  const supabaseKey = (supabase as any).supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaXhvd29mc3NiaW11ZGJyZWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzcyNjksImV4cCI6MjA4NDM1MzI2OX0.28TcTxfnLUFr-CJ-4C7sTVSyrd_jDVkaf46qEIl4Sbo';
  let token = supabaseKey;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
    }
  } catch (e) {
    console.warn("apiFetch: Erro ao obter sessão", e);
  }
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'apikey': supabaseKey,
    ...(options.headers as Record<string, string> || {})
  };

  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, { ...options, headers });
}
