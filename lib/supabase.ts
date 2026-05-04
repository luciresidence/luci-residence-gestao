import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbhgnuwmbmhmsrosqsqj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaGdudXdtYm1obXNyb3Nxc3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDE5NjYsImV4cCI6MjA5MDkxNzk2Nn0.zN8g066agXvkO0wIRFE19SfXwtUZpGID3jkudDJcbDM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'luci-residence-gestao',
    },
  },
});
