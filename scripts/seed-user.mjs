import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const { data, error } = await supabase.rpc('register_user', {
  p_email: 'demo@pawswipe.app',
  p_password: 'password123',
  p_username: 'demo',
});

if (error) {
  if (error.message.includes('duplicate') || error.message.includes('unique')) {
    console.log('Demo user already exists: demo@pawswipe.app / password123');
    process.exit(0);
  }
  console.error(error.message);
  process.exit(1);
}

console.log('Demo user ready: demo@pawswipe.app / password123', data);
